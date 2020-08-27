//import { clearCanvas } from "./ClearCanvas.svelte";
import { get } from 'svelte/store';
import { spring } from 'svelte/motion';
import {
    nodes,
    connections,
    next_node_id,
    start_node_id,
    end_node_id,
    next_cn_id,
    default_cn_weight,
    clearing_canvas,
    visualising,
    visual_progress,
    last_generated,
} from '../model/State';
import Vertex from '../model/Vertex';
import Connection from '../model/Connection';
import type { Pos } from '../model/Utils';

import {
    getUsableBounds,
    getDistance,
    randomShuffle,
    sleepPromise,
    waitForEmpty,
    waitForDoneMovingIfMoving,
    addVertex,
    addConnection,
} from './Utils';

const placement_timeout = 15000;

export async function clearCanvas() {
    clearing_canvas.set(true);
    console.log('clearing');

    get(nodes).forEach((node: Vertex) => {
        node.kill = true;
    });
    next_node_id.set(1);
    next_cn_id.set(1);
    start_node_id.set(-1);
    end_node_id.set(-1);

    last_generated.set(-1);
    visualising.set(false);
    visual_progress.set(0, undefined);
    await waitForEmpty();
    clearing_canvas.set(false);
    return;
}

async function generateRandom(dir: number) {
    await clearCanvas();
    last_generated.set(dir);
    const bounds = getUsableBounds();
    const area = (bounds[0][1] - bounds[0][0]) * (bounds[1][1] - bounds[1][0]);
    const count = Math.floor(area * (Math.random() * 0.00001) + area * 0.00005);
    //const count = Math.floor((bounds[0][1]-bounds[0][0])*(bounds[1][1]-bounds[1][0]) * (Math.random() * 0.00005) + 20);
    const minradius = 90;
    const minstartenddist = 800;
    const max_to_connect = 4;
    const node_time = 2000;
    const cn_approx_time = 5000;
    const node_delay = node_time / count;
    const cn_delay = cn_approx_time / (count * 4);

    let nni = -1;
    const unsubscribenni = next_node_id.subscribe((val: number) => (nni = val));
    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe((val: number) => (nci = val));
    let clearing = false;
    const unsubscribeclearingcanvas = clearing_canvas.subscribe(
        (val: boolean) => (clearing = val)
    );

    let start_node_pos = { x: 0, y: 0 };
    let start_time = performance.now();

    for (let i = 0; i < count; i++) {
        if (clearing) {
            unsubscribenni();
            unsubscribenci();
            unsubscribeclearingcanvas();
            return;
        }
        if (performance.now() - start_time > placement_timeout) break;

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
            (i !== count - 1 ||
                getDistance({ x, y }, start_node_pos) < minstartenddist) &&
            attempts < 20
        );
        if (i === 0) start_node_pos = { x, y };

        const newnode = new Vertex(
            nni,
            spring({ x, y }),
            spring({ x, y }),
            spring(0),
            spring(0)
        );
        addVertex(newnode);

        if (i === 0) start_node_id.set(nni);
        else if (i === count - 1) end_node_id.set(nni);
        next_node_id.update((val: number) => val + 1);
        await sleepPromise(node_delay);
        await waitForDoneMovingIfMoving();
    }
    unsubscribenni();

    start_time = performance.now();
    console.log('nodes.size=', nodes.size);

    for (const [nid, nodea] of nodes.getAll()) {
        const no_to_connect = Math.random() * max_to_connect + 1;
        for (let j = 1; j < no_to_connect && j < nodes.size; j++) {
            // (first element is 0 away)
            if (clearing) {
                unsubscribenci();
                unsubscribeclearingcanvas();
                return;
            }

            if (
                !nodea ||
                nodea.kill ||
                performance.now() - start_time > placement_timeout
            )
                break;

            const sortedByDistance = [...nodes.getAll()];
            const _ = sortedByDistance.sort(
                // sort by distance away
                ([_aid, a]: [number, Vertex], [_bid, b]: [number, Vertex]) =>
                    getDistance(get(a.posSpringA), get(nodea.posSpringA)) -
                    getDistance(get(b.posSpringA), get(nodea.posSpringA))
            );

            const cn_weight = Math.floor(Math.random() * 10 + 1);
            let cn_direction = 0;
            if (dir === 1) {
                cn_direction = Math.floor(Math.random() * 3);
            } else if (dir === 2) {
                cn_direction = Math.floor(Math.random() * 2) + 1;
            }
            const nodeb = sortedByDistance[j][1];

            const idA = nodea.id,
                idB = nodeb.id;
            if (
                ![...connections.getAll()].some(
                    cn =>
                        (cn[1].idA === idA && cn[1].idB === idB) ||
                        (cn[1].idA === idB && cn[1].idB === idA)
                ) &&
                !nodeb.kill
            ) {
                console.log('here', idA, idB, nodea, nodeb);
                const newcn = new Connection(
                    nci,
                    idA,
                    idB,
                    cn_weight,
                    cn_direction
                );
                addConnection(newcn);
                next_cn_id.update((val: number) => val + 1);
            }
            await sleepPromise(cn_delay);
            await waitForDoneMovingIfMoving();
        }
    }

    unsubscribenci();
    unsubscribeclearingcanvas();
}

export async function generateRandomUndirected() {
    await generateRandom(0);
}

export async function generateRandomDirected() {
    await generateRandom(1);
}

export async function generateRandomOnlyDirected() {
    await generateRandom(2);
}

export async function generateRandomDAG() {
    await clearCanvas();
    last_generated.set(3);
    const bounds = getUsableBounds();
    const area = (bounds[0][1] - bounds[0][0]) * (bounds[1][1] - bounds[1][0]);
    const count = Math.floor(area * (Math.random() * 0.00001) + area * 0.00005);
    const minradius = 90;
    const minstartenddist = 800;
    const max_to_connect = 8;
    const node_time = 2000;
    const cn_approx_time = 5000;
    const node_delay = node_time / count;
    const cn_delay = cn_approx_time / (count * 4);
    const nranks = count * 0.5;

    let nni = -1;
    const unsubscribenni = next_node_id.subscribe(val => (nni = val));
    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe(val => (nci = val));
    let clearing = false;
    const unsubscribeclearingcanvas = clearing_canvas.subscribe(
        val => (clearing = val)
    );

    let start_node_pos = { x: 0, y: 0 };
    let start_time = performance.now();

    for (let i = 0; i < count; i++) {
        if (clearing) {
            unsubscribenni();
            unsubscribenci();
            unsubscribeclearingcanvas();
            return;
        }
        if (performance.now() - start_time > placement_timeout) break;

        let x: number, y: number;
        let attempts = 0;
        let good = false;

        const c_top_rank = i === 0 ? 1 : 1 + Math.floor(Math.random() * nranks);

        do {
            x = bounds[0][0] + Math.random() * (bounds[0][1] - bounds[0][0]);
            y =
                bounds[1][0] +
                (bounds[1][1] - bounds[1][0]) * ((c_top_rank - 1) / nranks) +
                Math.random() * (bounds[1][1] - bounds[1][0]) * (1 / nranks);
            attempts++;
            good = ![...nodes.getAll()].some(
                ([_id, node]) =>
                    getDistance(get(node.posSpringA), { x, y }) < minradius
            );
            if (i === count - 1)
                good =
                    good &&
                    getDistance({ x, y }, start_node_pos) > minstartenddist;
            if (attempts > 30) good = true;
        } while (!good);
        if (i === 0) start_node_pos = { x, y };

        const newnode = new Vertex(
            nni,
            spring({ x, y }),
            spring({ x, y }),
            spring(0),
            spring(0),
            c_top_rank
        );
        addVertex(newnode);

        if (i === 0) start_node_id.set(nni);
        else if (i === count - 1) end_node_id.set(nni);
        next_node_id.update(val => val + 1);
        await sleepPromise(node_delay);
        await waitForDoneMovingIfMoving();
    }
    unsubscribenni();

    start_time = performance.now();

    for (let i = 0; i < nodes.size; i++) {
        const no_to_connect = Math.random() * max_to_connect + 3;

        const nodea = [...nodes.getAll()][i][1];
        for (let j = 1; j < no_to_connect && j < nodes.size; j++) {
            // (first element is 0 away)
            if (clearing) {
                unsubscribenci();
                unsubscribeclearingcanvas();
                return;
            }
            if (
                !nodea ||
                nodea.kill ||
                performance.now() - start_time > placement_timeout
            )
                break;

            const c_top_rank = nodea.top_rank,
                c_pos = get(nodea.posSpringA);
            const sortedByDistance = [...nodes.getAll()]
                .slice()
                .map(([_id, node]) => node)
                .filter(
                    (node: Vertex) =>
                        node.top_rank > c_top_rank &&
                        getDistance(get(node.posSpringA), c_pos) <
                            minradius * 2.5
                )
                .sort(
                    (a: Vertex, b: Vertex) =>
                        getDistance(get(a.posSpringA), c_pos) -
                        getDistance(get(b.posSpringA), c_pos)
                );

            if (!sortedByDistance[j]) continue;
            const idA = nodea.id,
                idB = sortedByDistance[j].id;
            const cn_weight = Math.floor(Math.random() * 10 + 1);
            let cn_direction = 1;

            if (
                ![...connections.getAll()].some(
                    ([_cnid, cn]: [number, Connection]) =>
                        (cn.idA === idA && cn.idB === idB) ||
                        (cn.idB === idA && cn.idA === idB)
                ) &&
                !sortedByDistance[j].kill
            ) {
                const newcn = new Connection(
                    nci,
                    idA,
                    idB,
                    cn_weight,
                    cn_direction
                );
                addConnection(newcn);
                next_cn_id.update(val => val + 1);
            }
            await sleepPromise(cn_delay);
            await waitForDoneMovingIfMoving();
        }
    }

    unsubscribenci();
    unsubscribeclearingcanvas();
}

export async function generateComplete() {
    await clearCanvas();
    last_generated.set(4);
    const count = Math.floor(Math.random() * 15 + 4);
    const max_to_connect = 4;
    const node_time = 2000;
    const cn_time = 5000;
    const node_delay = node_time / count;
    const cn_delay = (2 * cn_time) / (count * (count + 1));

    const bounds = getUsableBounds();
    const radius =
        Math.min(bounds[0][1] - bounds[0][0], bounds[1][1] - bounds[1][0]) *
        0.4;
    const cx = (bounds[0][0] + bounds[0][1]) / 2;
    const cy = (bounds[1][0] + bounds[1][1]) / 2;
    const dt = (2 * Math.PI) / count;

    let nni = -1;
    const unsubscribenni = next_node_id.subscribe(val => (nni = val));
    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe(val => (nci = val));
    let clearing = false;
    const unsubscribeclearingcanvas = clearing_canvas.subscribe(
        val => (clearing = val)
    );

    let start_time = performance.now();

    for (let i = 0; i < count; i++) {
        if (clearing) {
            unsubscribenni();
            unsubscribenci();
            unsubscribeclearingcanvas();
            return;
        }
        if (performance.now() - start_time > placement_timeout) break;

        const x = cx + radius * Math.sin(i * dt);
        const y = cy - radius * Math.cos(i * dt);

        const newnode = new Vertex(
            nni,
            spring({ x, y }),
            spring({ x, y }),
            spring(0),
            spring(0)
        );

        addVertex(newnode);
        next_node_id.update(val => val + 1);
        start_node_id.update(_ => 1);
        await sleepPromise(node_delay);
        await waitForDoneMovingIfMoving();
    }
    unsubscribenni();

    start_time = performance.now();

    for (let i = 0; i < nodes.size; i++) {
        const nodea = [...nodes.getAll()][i][1];
        for (let j = i + 1; j < nodes.size; j++) {
            if (clearing) {
                unsubscribenni();
                unsubscribenci();
                unsubscribeclearingcanvas();
                return;
            }
            if (performance.now() - start_time > placement_timeout) break;

            const cn_weight = Math.floor(Math.random() * 10 + 1);
            const cn_direction = Math.floor(Math.random() * 3);

            const nodeb = [...nodes.getAll()][j][1];

            const idA = nodea.id,
                idB = nodeb.id;
            if (
                ![...connections.getAll()].some(
                    ([_cnid, cn]) =>
                        (cn.idA === idA && cn.idB === idB) ||
                        (cn.idB === idA && cn.idA === idB)
                ) &&
                !nodea.kill &&
                !nodeb.kill
            ) {
                const newcn = new Connection(
                    nci,
                    idA,
                    idB,
                    cn_weight,
                    cn_direction
                );
                addConnection(newcn);
                next_cn_id.update(val => val + 1);
            }
            await sleepPromise(cn_delay);
            await waitForDoneMovingIfMoving();
        }
    }

    unsubscribenni();
    unsubscribenci();
    unsubscribeclearingcanvas();
}

export async function generateBinaryTree() {
    await clearCanvas();
    last_generated.set(5);
    const count = Math.floor(Math.random() * 30 + 8);
    const node_time = 1000;
    const cn_time = 2000;
    const node_delay = node_time / count;
    const cn_delay = cn_time / (count - 1);

    const bounds = getUsableBounds();
    const cx = (bounds[0][0] + bounds[0][1]) / 2;
    const cy = (bounds[1][0] + bounds[1][1]) / 2;
    const width = (bounds[0][1] - bounds[0][0]) * 0.8;
    const height = (bounds[1][1] - bounds[1][0]) * 0.8;
    const start_dx = width * 0.25;
    const start_dy = height * 0.25;
    const cn_weight = get(default_cn_weight);
    const cn_direction = 1;

    let nni = -1;
    const unsubscribenni = next_node_id.subscribe(val => (nni = val));
    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe(val => (nci = val));
    let clearing = false;
    const unsubscribeclearingcanvas = clearing_canvas.subscribe(
        val => (clearing = val)
    );

    let start_time = performance.now();

    let toadd = randomShuffle([...new Array(count).keys()].map(x => x + 1));

    // create root node
    const rootid = toadd[0];
    const root = new Vertex(
        rootid,
        spring({ x: cx, y: cy - height / 2 }),
        spring({ x: cx, y: cy - height / 2 }),
        spring(0),
        spring(0)
    );
    addVertex(root);

    next_node_id.update(val => val + count);
    start_node_id.set(rootid);
    await sleepPromise(node_delay);
    await waitForDoneMovingIfMoving();

    for (let i = 1; i < count; i++) {
        //console.log("attempting to insert node ", toadd[i]);
        if (clearing || !root || root.kill) {
            unsubscribenni();
            unsubscribenci();
            unsubscribeclearingcanvas();
            return;
        }
        if (performance.now() - start_time > placement_timeout) break;

        // random omission of nodes to make search algorithm more interesting
        if (Math.random() < 0.3) continue;

        const addingid = toadd[i];
        let c_nodeid = root.id;
        let last_cnid_traversed = -1;
        let found = false;
        let x = cx;
        let y = bounds[1][0];
        let dx = start_dx;
        let dy = start_dy;
        let valid = true;
        while (!found) {
            const c_node = nodes.getObj(c_nodeid);
            if (!c_node) break;
            let possible_cnids = [...c_node.direct_cn]
                .concat([...c_node.indirect_cn])
                .filter(cnid => cnid !== last_cnid_traversed);
            if (possible_cnids.length > 2) {
                valid = false;
                break;
            }
            let left_cn = connections.getObj(possible_cnids[0]);
            let right_cn = connections.getObj(possible_cnids[1]);
            let flipped = false;
            let dir = false; // false = left , true = right

            if (!right_cn && !left_cn) {
                dir = addingid > c_nodeid;
            } else if (!right_cn) {
                const childid =
                    left_cn.idA === c_nodeid ? left_cn.idB : left_cn.idA;
                if (c_nodeid < childid) flipped = true;
                dir = addingid > c_nodeid;
            } else {
                const childidA =
                    left_cn.idA === c_nodeid ? left_cn.idB : left_cn.idA;
                const childidB =
                    right_cn.idA === c_nodeid ? right_cn.idB : right_cn.idA;
                if (childidA > c_nodeid === childidB > c_nodeid) valid = false;

                if (c_nodeid > childidB) flipped = true;
                dir = addingid > c_nodeid;
            }

            if (!valid) break;

            if (!dir) {
                // going left
                x -= dx;
                if ((!left_cn && !flipped) || (!right_cn && flipped))
                    found = true;
                else {
                    if (flipped) {
                        c_nodeid =
                            right_cn.idA === c_nodeid
                                ? right_cn.idB
                                : right_cn.idA;
                        last_cnid_traversed = right_cn.id;
                    } else {
                        c_nodeid =
                            left_cn.idA === c_nodeid
                                ? left_cn.idB
                                : left_cn.idA;
                        last_cnid_traversed = left_cn.id;
                    }
                }
            } else {
                // going right
                x += dx;
                if ((!left_cn && flipped) || (!right_cn && !flipped))
                    found = true;
                else {
                    if (flipped) {
                        c_nodeid =
                            left_cn.idA === c_nodeid
                                ? left_cn.idB
                                : left_cn.idA;
                        last_cnid_traversed = left_cn.id;
                    } else {
                        c_nodeid =
                            right_cn.idA === c_nodeid
                                ? right_cn.idB
                                : right_cn.idA;
                        last_cnid_traversed = right_cn.id;
                    }
                }
            }
            y += dy;
            dx *= 0.5;
            dy *= 0.85;
        }

        if (!valid) continue;

        const newnode = new Vertex(
            addingid,
            spring({ x, y }),
            spring({ x, y }),
            spring(0),
            spring(0)
        );
        addVertex(newnode);
        await sleepPromise(node_delay);
        await waitForDoneMovingIfMoving();

        if (clearing || !root || root.kill) {
            unsubscribenni();
            unsubscribenci();
            unsubscribeclearingcanvas();
            return;
        }
        if (performance.now() - start_time > placement_timeout) break;

        const idA = c_nodeid,
            idB = addingid;
        const nodea = nodes.getObj(idA);
        const nodeb = nodes.getObj(idB);
        if (!nodea || !nodeb || nodea.kill || nodeb.kill) continue;
        if (
            ![...connections.getAll()].some(
                ([_cnid, cn]) =>
                    (cn.idA === idA && cn.idB === idB) ||
                    (cn.idB === idA && cn.idA === idB)
            )
        ) {
            const newcn = new Connection(
                nci,
                idA,
                idB,
                cn_weight,
                cn_direction
            );
            addConnection(newcn);
            next_cn_id.update((val: number) => val + 1);
        }
        await sleepPromise(cn_delay);
        await waitForDoneMovingIfMoving();
    }
    unsubscribenni();

    unsubscribenni();
    unsubscribenci();
    unsubscribeclearingcanvas();
}

async function generateRandomTree(dir: number) {
    await clearCanvas();
    last_generated.set(dir + 6);
    const count = Math.floor(Math.random() * 15 + 8);
    const node_time = 2000;
    const cn_time = 3000;
    const node_delay = node_time / count;
    const cn_delay = cn_time / (count - 1);

    const bounds = getUsableBounds();
    const cx = (bounds[0][0] + bounds[0][1]) / 2;
    const cy = (bounds[1][0] + bounds[1][1]) / 2;
    const width = (bounds[0][1] - bounds[0][0]) * 0.8;
    const height = (bounds[1][1] - bounds[1][0]) * 0.8;
    const start_dx = width * 0.15;
    const start_dy = height * 0.3;
    const cn_weight = get(default_cn_weight);
    const cn_direction = dir;

    let nni = -1;
    const unsubscribenni = next_node_id.subscribe(val => (nni = val));
    let nci = -1;
    const unsubscribenci = next_cn_id.subscribe(val => (nci = val));
    let clearing = false;
    const unsubscribeclearingcanvas = clearing_canvas.subscribe(
        val => (clearing = val)
    );

    // create root node
    const root = new Vertex(
        nni,
        spring({ x: cx, y: cy - height / 2 }),
        spring({ x: cx, y: cy - height / 2 }),
        spring(0),
        spring(0)
    );
    addVertex(root);
    if (dir != 2) start_node_id.set(nni);
    else end_node_id.set(nni);
    next_node_id.update(val => val + 1);
    await sleepPromise(node_delay);
    await waitForDoneMovingIfMoving();

    let start_time = performance.now();

    let q = [[1, 0, 0]];
    let placed = 1;

    while (q.length) {
        if (clearing) {
            unsubscribenni();
            unsubscribenci();
            unsubscribeclearingcanvas();
            return;
        }
        if (performance.now() - start_time > placement_timeout) break;

        const [c_nodeid, c_nodedepth, c_nodesiblingcount] = q.shift();
        if (c_nodedepth > 5) continue;

        const c_node = nodes.getObj(c_nodeid);
        if (!c_node || c_node.kill) continue;
        let cnp: Pos = { x: 0, y: 0 };
        const unsubscribecnodepos = c_node.posSpringA.subscribe(
            (val: Pos) => (cnp = val)
        );

        let no_of_children = Math.floor(
            Math.random() * Math.min(5, count - placed)
        );
        if (c_nodedepth === 0) no_of_children = Math.max(2, no_of_children);

        for (let child = 0; child < no_of_children; child++) {
            if (clearing) {
                unsubscribenni();
                unsubscribenci();
                unsubscribeclearingcanvas();
                return;
            }
            if (performance.now() - start_time > placement_timeout) break;

            let x = 0;
            if (no_of_children === 1) x = cnp.x;
            else {
                x =
                    cnp.x +
                    2 *
                        ((2 * child) / (no_of_children - 1) - 1) *
                        (start_dx /
                            ((c_nodesiblingcount + 1) *
                                Math.pow(2, c_nodedepth)));
            }
            const y = cnp.y + start_dy / Math.pow(1.5, c_nodedepth);
            const c_childid = nni;
            const c_child = new Vertex(
                nni,
                spring({ x, y }),
                spring({ x, y }),
                spring(0),
                spring(0)
            );

            addVertex(c_child);
            next_node_id.update(val => val + 1);
            q.push([c_childid, c_nodedepth + 1, no_of_children - 1]);
            placed++;
            await sleepPromise(node_delay);
            await waitForDoneMovingIfMoving();

            if (clearing) {
                unsubscribenni();
                unsubscribenci();
                unsubscribeclearingcanvas();
                return;
            }
            if (performance.now() - start_time > placement_timeout) break;

            const idA = c_nodeid,
                idB = c_childid;
            if (!c_node || c_node.kill || !c_child || c_child.kill) continue;
            if (
                ![...connections.getAll()].some(
                    ([_cnid, cn]) =>
                        (cn.idA === idA && cn.idB === idB) ||
                        (cn.idB === idA && cn.idA === idB)
                )
            ) {
                const newcn = new Connection(
                    nci,
                    idA,
                    idB,
                    cn_weight,
                    cn_direction
                );
                addConnection(newcn);
                next_cn_id.update(val => val + 1);
            }
            await sleepPromise(cn_delay);
            await waitForDoneMovingIfMoving();
        }
        unsubscribecnodepos();
    }

    unsubscribenni();
    unsubscribenci();
    unsubscribeclearingcanvas();
}

export async function generateUndirectedRandomTree() {
    await generateRandomTree(0);
}

export async function generateDirectedRandomTree() {
    await generateRandomTree(1);
}

export async function generateReverseDirectedRandomTree() {
    await generateRandomTree(2);
}
