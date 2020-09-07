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
    visual_progress,
    moving_canvas,
    clearing_canvas,
    default_cn_weight,
    vte_text,
    vte_nnodes,
    vte_directed,
    vte_textvalid,
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
            if (get(nodes).size === 0) return resolve();
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

export function getCurrentVTE() {
    let maxnid = 0;
    let new_text = '';
    let directed = false;
    [...nodes.keys()].forEach(nid => {
        maxnid = Math.max(maxnid, nid);
    });
    [...connections.getAll()].forEach(([cnid, cn]) => {
        const nodea = nodes.getObj(cn.idA);
        const nodeb = nodes.getObj(cn.idB);
        if (!nodea || !nodeb) return;

        if (cn.directionCounter > 0) directed = true;

        const cnweightstr = get(cn.weight).toString();

        switch (cn.directionCounter) {
            case 0:
                new_text +=
                    cn.idA.toString() +
                    ' ' +
                    cn.idB.toString() +
                    ' ' +
                    cnweightstr +
                    '\n';
                new_text +=
                    cn.idB.toString() +
                    ' ' +
                    cn.idA.toString() +
                    ' ' +
                    cnweightstr +
                    '\n';
                break;
            case 1:
                new_text +=
                    cn.idA.toString() +
                    ' ' +
                    cn.idB.toString() +
                    ' ' +
                    cnweightstr +
                    '\n';
                break;
            case 2:
                new_text +=
                    cn.idB.toString() +
                    ' ' +
                    cn.idA.toString() +
                    ' ' +
                    cnweightstr +
                    '\n';
                break;
        }
    });
    vte_text.set(new_text);
    vte_nnodes.set(maxnid);
    vte_directed.set(directed);
    vte_textvalid.set(true);
}

export async function applyVTE() {
    if (get(clearing_canvas)) await waitForEmpty();

    const nodes_to_add: Set<number> = new Set();
    const nearby_nodes: Map<number, number[]> = new Map();
    const nodes_to_delete: Set<number> = new Set();
    const connections_to_add: Map<[number, number], number> = new Map();
    const connections_to_delete: Set<number> = new Set();
    const dcns: Map<number, Map<number, number>> = new Map();
    const nnodes = get(vte_nnodes);
    const txt = get(vte_text);
    const defw = get(default_cn_weight);

    [...nodes.getAll()].forEach(([nid, node]) => {
        if (nid <= 0 || nid > nnodes) {
            nodes_to_delete.add(nid);
            node.direct_cn.forEach((cnid: number) =>
                connections_to_delete.add(cnid)
            );
            node.indirect_cn.forEach((cnid: number) =>
                connections_to_delete.add(cnid)
            );
        }
    });

    nodes_to_delete.forEach(nid => {
        delVertex(nid);
    });

    const news = txt.trim();
    for (let u_v of news.split('\n')) {
        const u_v_split = u_v.trim().split(' ');

        let us: string, vs: string, ws: string;
        let w = defw;
        if (u_v_split.length == 2) [us, vs] = u_v_split;
        else {
            [us, vs, ws] = u_v_split;
            w = parseFloat(ws);
        }

        const u = parseInt(us);
        const v = parseInt(vs);

        if (!dcns.has(u)) dcns.set(u, new Map());
        dcns.get(u).set(v, w);
    }

    for (let i = 1; i <= nnodes; i++) {
        const nodea = nodes.getObj(i);
        if (nodea) {
            if (dcns.has(i)) {
                nodea.direct_cn.forEach(cnid => {
                    const cn = connections.getObj(cnid);
                    if (!cn) return;
                    const cv = cn.idA === i ? cn.idB : cn.idA;
                    console.log('i=', i, ' cv=', cv);
                    if (!dcns.get(i).has(cv)) {
                        connections_to_delete.add(cnid);
                        dcns.get(i).delete(cv);
                    } else if (dcns.get(i).get(cv) != get(cn.weight)) {
                        cn.weight.set(dcns.get(i).get(cv));
                    }
                });
                console.log(dcns.get(i));
                dcns.get(i).forEach((w, cv) => {
                    console.log('here ', [i, cv]);
                    connections_to_add.set([i, cv], w);
                    if (!nearby_nodes.has(i)) nearby_nodes.set(i, []);
                    if (!nearby_nodes.has(cv)) nearby_nodes.set(cv, []);
                    nearby_nodes.get(i).push(cv);
                    nearby_nodes.get(cv).push(i);
                });
            } else {
                nodea.direct_cn.forEach(cnid => {
                    connections_to_delete.add(cnid);
                });
            }
        } else {
            nodes_to_add.add(i);
            if (!nearby_nodes.has(i)) nearby_nodes.set(i, []);
            if (!dcns.has(i)) dcns.set(i, new Map());
            console.log(dcns.get(i));
            dcns.get(i).forEach((nid, w) => {
                if (!nearby_nodes.has(nid)) nearby_nodes.set(nid, []);
                nearby_nodes.get(i).push(nid);
                nearby_nodes.get(nid).push(i);
                connections_to_add.set([i, nid], w);
            });
        }
    }

    const bounds = getUsableBounds();
    next_node_id.set(nnodes + 1);
    nodes_to_add.forEach(nid => {
        let x = 0,
            y = 0;
        if (nearby_nodes.has(nid)) {
            let nni = 0;
            const bounds = getUsableBounds();
            if (nodes.has(nni)) return;

            const minradius = 90;
            const minnearbyradius = 250;

            let x: number, y: number;
            let attempts = 0;
            const nearby = [...nodes.getAll()].filter(([nid, _node]) =>
                nearby_nodes.has(nid)
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
                nearby.every(
                    ([_id, node]) =>
                        getDistance(get(node.posSpringA), { x, y }) >
                        minnearbyradius
                ) &&
                [...nodes.getAll()].some(
                    ([_id, node]) =>
                        getDistance(get(node.posSpringA), { x, y }) < minradius
                ) &&
                attempts < 40
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
                x =
                    bounds[0][0] +
                    Math.random() * (bounds[0][1] - bounds[0][0]);
                y =
                    bounds[1][0] +
                    Math.random() * (bounds[1][1] - bounds[1][0]);
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
        }
    });

    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe((val: number) => (nci = val));

    console.log('connections_to_add=', connections_to_add);

    connections_to_add.forEach((w, [idA, idB]) => {
        if (
            ![...connections.getAll()].some(
                ([_cnid, cn]) =>
                    (cn.idA === idA && cn.idB === idB) ||
                    (cn.idA === idB && cn.idB === idA)
            )
        ) {
            let cn_direction = 0;
            if (connections_to_add.has([idB, idA])) cn_direction = -1;
            const newcn = new Connection(nci, idA, idB, w, cn_direction);
            console.log(newcn.directionCounter);
            console.log('newcn = ', newcn);
            connections.setObj(nci, newcn);
            next_cn_id.update((val: number) => val + 1);
            console.log([...connections.getAll()].slice());
        }
    });

    connections_to_delete.forEach(cnid => {
        const cn = connections.getObj(cnid);
        console.log('killing cn=', cnid);
        if (cn) cn.kill = true;
    });
    nodes_to_delete.forEach(nid => {
        const n = nodes.getObj(nid);
        if (n) n.kill = true;
    });

    unsubscribenci();
}
