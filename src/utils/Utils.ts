import { get } from 'svelte/store';
import { spring } from 'svelte/motion';
import {
    nodes,
    connections,
    start_node_id,
    end_node_id,
    next_node_id,
    next_cn_id,
    recalculate_vis,
	last_generated,
	visualising,
    visual_progress,
    moving_canvas,
    clearing_canvas,
    default_cn_weight,
    vte_text,
    vte_temp_nnodes,
    vte_nnodes,
    vte_directed,
    vte_textvalid,
    vte_livemode,
    vte_outdated,
    canvas_offsets,
    zoom,
} from '../model/State';
import Vertex from '../model/Vertex';
import Connection from '../model/Connection';
import type { Pos } from '../model/Utils';

export function c2c(zm: number, cvo: Pos, { x, y }: Pos) {
    return {
        x: window.innerWidth / 2 + (x + cvo.x) * zm,
        y: window.innerHeight / 2 + (y + cvo.y) * zm,
    };
}

export function rc2c(zm: number, cvo: Pos, { x, y }: Pos) {
    return {
        x: (x - window.innerWidth / 2) / zm - cvo.x,
        y: (y - window.innerHeight / 2) / zm - cvo.y,
    };
}

export function getUsableBounds() {
    let canvas = document.getElementById('canvas');
    const zm = get(zoom),
        cvo = get(canvas_offsets);
    //const actualBounds = rc2c(get(zoom), get(canvas_offsets), { x:canvas.clientWidth, y: canvas.clientHeight });
    const leftUpper = rc2c(zm, cvo, {
        x: canvas.clientWidth / 20 + 50,
        y: canvas.clientWidth / 20 + 90,
    });
    const rightLower = rc2c(zm, cvo, {
        x: (canvas.clientWidth * 19) / 20 - 150,
        y: (canvas.clientHeight * 19) / 20 - 100,
    });

    return [
        [leftUpper.x, rightLower.x],
        [leftUpper.y, rightLower.y],
    ];
}

export function getDistance({ x: x1, y: y1 }: Pos, { x: x2, y: y2 }: Pos) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function randomShuffle(arr: any[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

export function sleepPromise(t: number) {
    return new Promise(_ => setTimeout(_, t));
}

export function waitForEmpty() {
    return new Promise((resolve, reject) => {
        (function check() {
            if (nodes.size === 0 && connections.size === 0) return resolve();
            setTimeout(check, 100);
        })();
    });
}

export function waitForDoneMovingIfMoving() {
    return new Promise((resolve, reject) => {
        let moving = false;
        const unsubscribemc = moving_canvas.subscribe(val => (moving = val));
        (function check() {
            if (!moving) {
                unsubscribemc();
                return resolve();
            }
            setTimeout(check, 500);
        })();
    });
}

export function resetAnimations(resetvisprog = false) {
    get(nodes).forEach((node: Vertex) => {
        node.animationEvents.set([]);
    });
    get(connections).forEach((cn: Connection) => {
        cn.animationEvents.set([]);
    });
    if (resetvisprog) visual_progress.set(0, { duration: 0 });
}

export async function playVisualisation() {
    visual_progress.set(0, { duration: 500 });
    await sleepPromise(500);
    visual_progress.set(1, { duration: 7500 });
}

export async function addRandomVertex() {
    if (get(clearing_canvas)) await waitForEmpty();
    let nni = 0;
    next_node_id.update(val => {
        nni = val;
        return val + 1;
    });
    const bounds = getUsableBounds();
    if (nodes.has(nni)) return;

    const minradius = 90;

    let x: number, y: number;
    let attempts = 0;
    do {
        x = bounds[0][0] + Math.random() * (bounds[0][1] - bounds[0][0]);
        y = bounds[1][0] + Math.random() * (bounds[1][1] - bounds[1][0]);
        attempts++;
    } while (
        [...nodes.getAll()].some(
            ([_id, node]) =>
                getDistance(get(node.posSpringA), { x, y }) < minradius
        ) &&
        attempts < 20
    );

    const newVertex = new Vertex(
        nni,
        spring({ x, y }),
        spring({ x, y }),
        spring(0),
        spring(0)
    );
    nodes.setObj(nni, newVertex);
    return nni;
}

export async function addStartVertex() {
    start_node_id.set(await addRandomVertex());
    recalculate_vis.set(true);
}

export async function addEndVertex() {
    end_node_id.set(await addRandomVertex());
    recalculate_vis.set(true);
}

export function addVertex(node: Vertex) {
    nodes.setObj(node.id, node);
    recalculate_vis.set(true);
}

export function addConnection(cn: Connection) {
    connections.setObj(cn.id, cn);
    recalculate_vis.set(true);
}

export function delVertex(id: number) {
    nodes.delete(id);
    recalculate_vis.set(true);
}

export function delConnection(id: number) {
    connections.delete(id);
    recalculate_vis.set(true);
}

export function getCurrentVTE(update_text = false) {
    let maxnid = 0;
    let new_text = '';
    let directed = get(vte_directed);
    const defw = get(default_cn_weight);
    [...nodes.keys()].forEach(nid => {
        maxnid = Math.max(maxnid, nid);
    });
    [...connections.getAll()].forEach(([cnid, cn]) => {
        const nodea = nodes.getObj(cn.idA);
        const nodeb = nodes.getObj(cn.idB);
        if (!nodea || !nodeb) return;
        const cdir = get(cn.directionCounter);

        const cnweightstr = get(cn.weight).toString();

        switch ((cdir + 2) % 3) {
            case 0:
                new_text += cn.idA.toString() + ' ' + cn.idB.toString();
                if (directed)
                    new_text +=
                        '\n' + cn.idB.toString() + ' ' + cn.idA.toString();
                break;
            case 1:
                new_text += cn.idA.toString() + ' ' + cn.idB.toString();
                break;
            case 2:
                new_text += cn.idB.toString() + ' ' + cn.idA.toString();
                break;
        }
        if (get(cn.weight) != defw) new_text += ' ' + cnweightstr;
        new_text += '\n';
    });
    if (new_text.length > 0)
        new_text = new_text.substring(0, new_text.length - 1);
    if (update_text || get(vte_livemode)) {
        vte_outdated.set(false);
        vte_text.set(new_text);
        vte_temp_nnodes.set(maxnid.toString());
        vte_nnodes.set(maxnid);
        vte_directed.set(directed);
        vte_textvalid.set(true);
    } else {
        vte_outdated.set(new_text != get(vte_text));
    }
}

export async function applyVTE() {
    if (get(clearing_canvas)) await waitForEmpty();

    const nodes_to_add: Set<number> = new Set();
    const nearby_nodes: Map<number, Set<number>> = new Map();
    const nodes_to_delete: Set<number> = new Set();
    const connections_to_add: Map<
        number,
        Map<number, [number, boolean, boolean]>
    > = new Map(); // M<u, M<v, [w, d, wspecified]>>
    const nnodes = get(vte_nnodes);
    const txt = get(vte_text);
    const directed = get(vte_directed);
    const defw = get(default_cn_weight);

    for (let i = 1; i <= nnodes; i++) {
        nearby_nodes.set(i, new Set());
        if (!nodes.has(i)) nodes_to_add.add(i);
    }

    [...nodes.getAll()].forEach(([nid, node]) => {
        if (nid <= 0 || nid > nnodes) nodes_to_delete.add(nid);
    });

    const news = txt.trim();
    for (let u_v of news.split('\n')) {
        const u_v_split = u_v.trim().split(' ');
        if (!u_v_split[0]) continue;

        let us: string, vs: string, ws: string;
        let w = defw;
        if (u_v_split.length === 2) [us, vs] = u_v_split;
        else {
            [us, vs, ws] = u_v_split;
            w = parseFloat(ws);
        }

        const u = parseInt(us);
        const v = parseInt(vs);

        nearby_nodes.get(u).add(v);
        nearby_nodes.get(v).add(u);
        if (directed) {
            if (connections_to_add.has(u) && connections_to_add.get(u).has(v)) {
                const vals = connections_to_add.get(u).get(v);
                if (Boolean(ws) && !vals[2]) {
                    vals[2] = true;
                    vals[0] = w;
                }
                continue;
            }
            if (connections_to_add.get(v) && connections_to_add.get(v).has(u)) {
                const vals = connections_to_add.get(v).get(u);
                vals[1] = true;
                if (Boolean(ws) && !vals[2]) {
                    vals[2] = true;
                    vals[0] = w;
                }
            } else {
                if (!connections_to_add.has(u))
                    connections_to_add.set(u, new Map());
                connections_to_add.get(u).set(v, [w, false, Boolean(ws)]);
            }
        } else {
            if (
                (connections_to_add.has(u) &&
                    connections_to_add.get(u).has(v)) ||
                (connections_to_add.has(v) && connections_to_add.get(v).has(u))
            )
                continue;
            if (!connections_to_add.has(u))
                connections_to_add.set(u, new Map());
            connections_to_add.get(u).set(v, [w, true, Boolean(ws)]);
        }
    }

    const bounds = getUsableBounds();
    next_node_id.set(nnodes + 1);
    nodes_to_add.forEach(nid => {
        let x = 0,
            y = 0;
        if (
            nearby_nodes.get(nid).size &&
            ![...nearby_nodes.get(nid)].every(nid => !nodes.has(nid))
        ) {
            const bounds = getUsableBounds();
            if (nodes.has(nid)) return;

            const minradius = 90;
            const maxnearbyradius = 250;

            let x: number, y: number;
            let attempts = 0;
            const all = [...nodes.getAll()];
            const nearby = all.filter(([bid, _node]) =>
                nearby_nodes.get(nid).has(bid)
            );
            do {
                x =
                    bounds[0][0] +
                    Math.random() * (bounds[0][1] - bounds[0][0]);
                y =
                    bounds[1][0] +
                    Math.random() * (bounds[1][1] - bounds[1][0]);
                attempts++;
            } while (
                (nearby.every(
                    ([_id, node]) =>
                        getDistance(get(node.posSpringA), { x, y }) >
                        maxnearbyradius
                ) ||
                all.some(
                    ([_id, node]) =>
                        getDistance(get(node.posSpringA), { x, y }) < minradius
                )) &&
                attempts < 30
            );

            const newVertex = new Vertex(
                nid,
                spring({ x, y }),
                spring({ x, y }),
                spring(0),
                spring(0)
            );
            nodes.setObj(nid, newVertex);
        } else {
            const bounds = getUsableBounds();
            if (nodes.has(nid)) return;

            const minradius = 90;

            let x: number, y: number;
            let attempts = 0;
            const all = [...nodes.getAll()];
            do {
                x =
                    bounds[0][0] +
                    Math.random() * (bounds[0][1] - bounds[0][0]);
                y =
                    bounds[1][0] +
                    Math.random() * (bounds[1][1] - bounds[1][0]);
                attempts++;
            } while (
                all.some(
                    ([_id, node]) =>
                        getDistance(get(node.posSpringA), { x, y }) < minradius
                ) &&
                attempts < 20
            );

            const newVertex = new Vertex(
                nid,
                spring({ x, y }),
                spring({ x, y }),
                spring(0),
                spring(0)
            );
            addVertex(newVertex);
        }
    });

    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe((val: number) => (nci = val));

    const cns_dont_delete: Set<number> = new Set();
    const cns = [...connections.getAll()];
    connections_to_add.forEach((nodebids, nodeaid) => {
        nodebids.forEach(([w, d, _wspecified], nodebid) => {
            if (
                cns.some(
                    ([_cnid, cn]) => cn.idA === nodeaid && cn.idB === nodebid
                )
            ) {
                const [cnid, cn] = cns.find(
                    ([_cnid, cn]) => cn.idA === nodeaid && cn.idB === nodebid
                );
                cns_dont_delete.add(cnid);
                if (d) cn.directionCounter.set(0);
                else cn.directionCounter.set(1);
                cn.settingDirection.set(true);
                cn.weight.set(w);
            } else if (
                cns.some(
                    ([_cnid, cn]) => cn.idA === nodebid && cn.idB === nodeaid
                )
            ) {
                const [cnid, cn] = cns.find(
                    ([_cnid, cn]) => cn.idA === nodebid && cn.idB === nodeaid
                );
                cns_dont_delete.add(cnid);
                if (d) cn.directionCounter.set(0);
                else cn.directionCounter.set(1);
                cn.settingDirection.set(true);
                cn.weight.set(w);
            } else {
                let cn_direction = 1;
                if (d) cn_direction = 0;
                const newcn = new Connection(
                    nci,
                    nodeaid,
                    nodebid,
                    w,
                    cn_direction
                );
                addConnection(newcn);
                cns_dont_delete.add(nci);
                next_cn_id.update((val: number) => val + 1);
            }
        });
    });

    unsubscribenci();

    [...connections.getAll()]
        .filter(([cnid, _cn]) => !cns_dont_delete.has(cnid))
        .forEach(([_cnid, cn]) => {
            cn.kill.set(true);
        });
    nodes_to_delete.forEach(nid => {
        const n = nodes.getObj(nid);
        if (n) n.kill.set(true);
    });
    vte_outdated.set(false);
}
