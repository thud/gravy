import type { Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';

// Map which can be subscribed to as a whole or used as a normal map;
export default class StoreMap<K, V> {
    _map: Map<K, Writable<V>>;
    _itemunsubfns: Map<K, Function>;
    _setsubfns: Map<number, Function>;
    _subfns_counter: number;

    constructor(arr: [K, V][]) {
        //console.log(arr.map(([key, obj]) => [key, writable(obj)]));
        this._map = new Map();
        this._itemunsubfns = new Map();
        this._setsubfns = new Map();
        this._subfns_counter = 0;

        for (const [id, obj] of arr) this.setObj(id, obj);
        //console.log('StoreMap created = ', this._map.entries());
    }

    getAll() {
        //console.log('ran getAll on StoreMap');
        return new Map(
            Array.from(this._map.entries()).map(([id, obj]) => [id, get(obj)])
        );
    }

    getObj(id: K): V {
        //console.log('ran getObj on StoreMap');
        return get(this._map.get(id));
    }

    setObj(id: K, newobj: V) {
        //console.log('\t\tran setObj on StoreMap, setting', newobj, 'at', id);
        const newobjwritable = writable(newobj);
        this._map.set(id, newobjwritable);
        if (this._itemunsubfns.has(id)) this._itemunsubfns.get(id)();
        //console.log(this);
        const unsubscribenewobj = newobjwritable.subscribe(() => {
            this.runAllSubscriptions();
        });
        this._itemunsubfns.set(id, unsubscribenewobj);
        this.runAllSubscriptions();
    }

    subscribe(fn: Function): Function {
        //console.log('new subscription, running callback');
        //fn(this.getAll());
        const counter = this._subfns_counter++;
        this._setsubfns.set(counter, fn);
        this.runAllSubscriptions();
        return () => {
            this._setsubfns.delete(counter);
        };
    }

    runAllSubscriptions() {
        //console.log('-----------ranallsubscriptions------------');
        const cur = this.getAll();
        this._setsubfns.forEach(x => {
            x(cur);
        });
    }

    has(id: K): any {
        return this._map.has(id);
    }

    get size(): any {
        return this._map.size;
    }

    keys(): any {
        return this._map.keys();
    }

    delete(id: K) {
        //console.log('storemap unsubscribing from', id);
        if (this._itemunsubfns.has(id)) this._itemunsubfns.get(id)();
        this._itemunsubfns.delete(id);
        const res = this._map.delete(id);
        this.runAllSubscriptions();
        return res;
    }
}
