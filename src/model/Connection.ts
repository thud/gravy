import { tweened } from 'svelte/motion';
import { expoInOut } from 'svelte/easing';
import { writable } from 'svelte/store';
import type { NumTweened, AnyArrayWritable, BooleanWritable } from './Utils';

export default class Connection {
    id: number;
    idA: number;
    idB: number;
    weight: number;
    directionCounter: number;
    lengthTween: NumTweened;
    kill: boolean;
    centerX: number;
    centerY: number;
    settingDirection: boolean;
    animationEvents: AnyArrayWritable;
    progressFlipped: BooleanWritable;

    constructor(
        id: number,
        idA: number,
        idB: number,
        weight: number = 1,
        directionCounter: number = 0,
        lengthTween: NumTweened = tweened(0, {
            easing: expoInOut,
            duration: 500,
        })
    ) {
        this.id = id;
        this.idA = idA;
        this.idB = idB;
        this.lengthTween = lengthTween;
        this.weight = weight;
        this.kill = false;
        this.centerX = 0;
        this.centerY = 0;
        this.settingDirection = true;
        this.directionCounter = directionCounter;

        this.animationEvents = writable([]);
        this.progressFlipped = writable(false);
    }
}

function connectionwritable() {
    return writable<Connection>(undefined);
}
export type ConnectionWritable = ReturnType<typeof connectionwritable>;
