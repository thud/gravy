import { get, derived } from 'svelte/store';
import { spring, tweened } from 'svelte/motion';
import {
    visual_progress,
    visual_progress_step_count,
    stop_visualising,
    nodes,
    connections,
    next_node_id,
    start_node_id,
    end_node_id,
    next_cn_id,
    default_cn_weight,
    clearing_canvas,
    recalculate_vis,
} from '../model/State';
import type Vertex from '../model/Vertex';
import type Connection from '../model/Connection';
import type { Pos } from '../model/Utils';
import { sleepPromise, resetAnimations, playVisualisation } from './Utils';

export function calcDFS(
    startid: number,
    endid: number,
    leave_open: boolean = false
) {
    const visited_nodes: Map<number, number> = new Map();
    const visited_cns: Map<number, [number, number]> = new Map();
    const flipped_cn: Map<number, boolean> = new Map();
    const node_part_of_final_path: Set<number> = new Set();
    const cn_part_of_final_path: Set<number> = new Set();
    let time_counter = 0;

    function runDFS(i: number) {
        const nodea = nodes.getObj(i);
        if (!nodea) console.error('no node found with this id');
        visited_nodes.set(i, time_counter);
        if (i === endid && !leave_open) {
            node_part_of_final_path.add(i);
            return true;
        }
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (!visited_nodes.has(nodebid)) {
                flipped_cn.set(cnid, flipped);
                visited_cns.set(cnid, [time_counter, ++time_counter]);
                if (runDFS(nodebid)) {
                    node_part_of_final_path.add(i);
                    cn_part_of_final_path.add(cnid);
                    return true;
                }
            }
        }
        return false;
    }

    runDFS(startid);
    resetAnimations();
    visited_nodes.forEach((offset, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        ae.push({
            method: 'set_processingState',
            newState: 1,
            t: offset / time_counter,
        });
        if (node_part_of_final_path.has(nid))
            ae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
    });
    visited_cns.forEach(([startoffset, endoffset], cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            },
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    startoffset / time_counter,
                    endoffset / time_counter,
                ],
                t: startoffset / time_counter,
            }
        );
        if (cn_part_of_final_path.has(cnid))
            ae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
    });
    visual_progress_step_count.set(time_counter);
}

export function calcBFS(
    startid: number,
    endid: number,
    leave_open: boolean = false
) {
    const visited_nodes = new Map();
    const visited_cns = new Map();
    const flipped_cn = new Map();
    const q = [[startid, -1]];
    let time_counter = 0;

    let found = false;

    while (q.length) {
        const [i, from_cnid] = q.shift();
        const nodea = nodes.getObj(i);
        if (!nodea) continue;

        if (connections.has(from_cnid)) {
            visited_cns.set(from_cnid, [time_counter, ++time_counter]);
        }

        if (visited_nodes.has(i)) visited_nodes.get(i)[2] = time_counter;
        else visited_nodes.set(i, [-1, -1, 0]);

        if (i === endid && !leave_open) {
            found = true;
            break;
        }

        nodea.direct_cn.forEach(cnid => {
            const cn = connections.getObj(cnid);

            if (cn) {
                let nodebid = cn.idB;
                let flipped = false;
                if (cn.idB === i) {
                    nodebid = cn.idA;
                    flipped = true;
                } else {
                    flipped = false;
                }

                if (!visited_nodes.has(nodebid)) {
                    visited_nodes.set(nodebid, [i, cnid, -1]);
                    q.push([nodebid, cnid]);
                    flipped_cn.set(cnid, flipped);
                }
            }
        });
    }

    resetAnimations();
    visited_nodes.forEach(([_, __, offset], nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        if (offset != -1) {
            const ae = get(nextnode.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: 1,
                t: offset / time_counter,
            });
        }
    });
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            }
        );
    });

    if (found) {
        let c_id = endid;
        while (c_id !== startid) {
            const c_node = nodes.getObj(c_id);
            if (!c_node) continue;
            const nae = get(c_node.animationEvents);
            nae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });

            const [nxt_node, c_cnid, _] = visited_nodes.get(c_id);
            const c_cn = connections.getObj(c_cnid);
            if (!c_cn) continue;
            const cae = get(c_cn.animationEvents);
            cae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });

            c_id = nxt_node;
        }
        const start_node = nodes.getObj(startid);
        if (start_node) {
            const snae = get(start_node.animationEvents);
            snae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
        }
    }
    visual_progress_step_count.set(time_counter);
}

export function calcDijkstra(
    startid: number,
    endid: number,
    leave_open: boolean = false
) {
    const visited_nodes = new Map();
    const visited_cns = new Map();
    const flipped_cn = new Map();
    let q = [[startid, -1, 0]];
    let time_counter = 0;

    let found = false;

    while (q.length) {
        const _ = q.sort((a, b) => b[2] - a[2]);

        const [i, from_cnid, cost] = q.pop();
        q = q.filter(([nodeid, _, __]) => nodeid !== i);
        const nodea = nodes.getObj(i);
        if (!nodea) continue;

        if (i === endid && !leave_open) {
            found = true;
        }

        if (connections.has(from_cnid)) {
            visited_cns.set(from_cnid, [time_counter, ++time_counter]);
        }

        if (visited_nodes.has(i)) {
            visited_nodes.get(i)[2] = time_counter;
        } else visited_nodes.set(i, [-1, -1, 0]);

        if (found) break;

        nodea.direct_cn.forEach(cnid => {
            const cn = connections.getObj(cnid);

            if (cn) {
                let nodebid = cn.idB;
                let flipped = false;
                if (cn.idB === i) {
                    nodebid = cn.idA;
                    flipped = true;
                } else {
                    flipped = false;
                }

                if (!visited_nodes.has(nodebid)) {
                    visited_nodes.set(nodebid, [i, cnid, -1]);
                    q.push([nodebid, cnid, cost + cn.weight]);
                    flipped_cn.set(cnid, flipped);
                }
            }
        });
    }

    resetAnimations();
    visited_nodes.forEach(([_, __, offset], nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        if (offset != -1) {
            ae.push({
                method: 'set_processingState',
                newState: 1,
                t: offset / time_counter,
            });
        }
    });
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            }
        );
    });

    if (found) {
        let c_id = endid;
        while (c_id !== startid) {
            const c_node = nodes.getObj(c_id);
            if (!c_node) continue;
            const nae = get(c_node.animationEvents);
            nae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });

            const [nxt_node, c_cnid, _] = visited_nodes.get(c_id);
            const c_cn = connections.getObj(c_cnid);
            if (!c_cn) continue;
            const cae = get(c_cn.animationEvents);
            cae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });

            c_id = nxt_node;
        }
        const start_node = nodes.getObj(startid);
    }
    visual_progress_step_count.set(time_counter);
}

export function calcBiDijkstra(
    startid: number,
    endid: number,
    leave_open: boolean = false
) {
    const visited_nodes = new Map();
    const visited_by_a = new Set();
    const visited_by_b = new Set();
    const visited_cns = new Map();
    const flipped_cn = new Map();

    if (endid === startid) return calcDijkstra(startid, endid, true);
    type qitem = [number, number, number, boolean];
    let q: qitem[] = [
        [startid, -1, 0, true],
        [endid, -1, 0, false],
    ];
    let time_counter = 0;

    let found = false;
    let meet_node = -1;
    let meet_node_second_cnid = -1;

    while (q.length) {
        q.sort((a: qitem, b: qitem) => b[2] - a[2]);

        const [i, from_cnid, cost, v_by_a] = q.pop();
        q = q.filter(([nodeid, _, __, vba]) => nodeid !== i || v_by_a != vba);
        const nodea = nodes.getObj(i);
        if (!nodea) continue;

        if (v_by_a) visited_by_a.add(i);
        else visited_by_b.add(i);

        if (visited_by_a.has(i) && visited_by_b.has(i)) {
            meet_node = i;
            meet_node_second_cnid = from_cnid;
            found = true;
        }

        if (connections.has(from_cnid)) {
            visited_cns.set(from_cnid, [time_counter, ++time_counter, v_by_a]);
        }

        if (visited_nodes.has(i)) {
            if (visited_nodes.get(i)[2] === -1)
                visited_nodes.get(i)[2] = time_counter;
        } else visited_nodes.set(i, [-1, -1, 0, v_by_a]);

        if (found) break;

        const cns_to_follow = v_by_a ? nodea.direct_cn : nodea.indirect_cn;
        cns_to_follow.forEach(cnid => {
            const cn = connections.getObj(cnid);
            if (!cn) return;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (
                (v_by_a && visited_by_b.has(nodebid)) ||
                (!v_by_a && visited_by_a.has(nodebid)) ||
                !visited_nodes.has(nodebid)
            ) {
                if (!visited_nodes.has(nodebid))
                    visited_nodes.set(nodebid, [i, cnid, -1, v_by_a]);
                q.push([nodebid, cnid, cost + cn.weight, v_by_a]);
                flipped_cn.set(cnid, flipped);
            }
        });
    }

    resetAnimations(false);
    visited_nodes.forEach(([_, __, offset, v_by_a], nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        if (offset != -1) {
            ae.push({
                method: 'set_processingState',
                newState: v_by_a ? 1 : 3,
                t: offset / time_counter,
            });
        }
    });
    visited_cns.forEach(([startoffset, endoffset, v_by_a], cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    startoffset / time_counter,
                    endoffset / time_counter,
                ],
                t: startoffset / time_counter,
            },
            {
                method: 'set_processingState',
                newState: v_by_a ? 1 : 3,
                t: 0,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            }
        );
    });

    if (found) {
        let c_id = meet_node;
        while (c_id !== startid && c_id !== endid) {
            const c_node = nodes.getObj(c_id);
            if (c_node) {
                const nae = get(c_node.animationEvents);
                nae.push({
                    method: 'set_processingState',
                    newState: 2,
                    t: 1,
                });
            }

            const [nxt_node, c_cnid, _] = visited_nodes.get(c_id);
            const c_cn = connections.getObj(c_cnid);
            if (c_cn) {
                const cae = get(c_cn.animationEvents);
                cae.push({
                    method: 'set_processingState',
                    newState: 2,
                    t: 1,
                });
            }

            c_id = nxt_node;
        }

        const meet_node_second_cn = connections.getObj(meet_node_second_cnid);
        if (meet_node_second_cn) {
            get(meet_node_second_cn.animationEvents).push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
            const second_node_id =
                meet_node_second_cn.idA === meet_node
                    ? meet_node_second_cn.idB
                    : meet_node_second_cn.idA;
            const second_node = nodes.getObj(second_node_id);
            if (second_node) {
                c_id = second_node_id;
                do {
                    const c_node = nodes.getObj(c_id);
                    if (c_node) {
                        const nae = get(c_node.animationEvents);
                        nae.push({
                            method: 'set_processingState',
                            newState: 2,
                            t: 1,
                        });
                    }

                    const [nxt_node, c_cnid, _] = visited_nodes.get(c_id);
                    const c_cn = connections.getObj(c_cnid);
                    if (c_cn) {
                        const cae = get(c_cn.animationEvents);
                        cae.push({
                            method: 'set_processingState',
                            newState: 2,
                            t: 1,
                        });
                    }

                    c_id = nxt_node;
                } while (c_id !== startid && c_id !== endid);
            }
        } else console.error("couldn't find second cn");

        const start_node = nodes.getObj(startid);
        if (start_node) {
            const snae = get(start_node.animationEvents);
            snae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
        }
        const end_node = nodes.getObj(endid);
        if (end_node) {
            const enae = get(end_node.animationEvents);
            enae.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
        }
    }
    visual_progress_step_count.set(time_counter);
}

export function calcAStar(
    startid: number,
    endid: number,
    leave_open: boolean = false
) {
    const hcostweight = 0.1;
    const visited_nodes = new Map();
    const visited_cns = new Map();
    const flipped_cn = new Map();
    const endnode = nodes.getObj(endid);
    let endnode_pos: Pos;
    if (endnode) endnode_pos = get(endnode.posSpringA);
    const q = [[startid, -1, 0, 0]];
    let time_counter = 0;

    let found = false;

    while (q.length) {
        const _ = q.sort((a, b) => b[2] + b[3] - (a[2] + a[3]));
        const [i, from_cnid, gcost, hcost] = q.pop();
        const nodea = nodes.getObj(i);
        if (!nodea) continue;

        if (connections.has(from_cnid)) {
            visited_cns.set(from_cnid, [time_counter, ++time_counter]);
        }

        if (visited_nodes.has(i)) visited_nodes.get(i)[2] = time_counter;
        else visited_nodes.set(i, [-1, -1, 0]);

        if (i === endid) {
            found = true;
            break;
        }

        nodea.direct_cn.forEach(cnid => {
            const cn = connections.getObj(cnid);

            if (cn) {
                let nodebid = cn.idB;
                let flipped = false;
                if (cn.idB === i) {
                    nodebid = cn.idA;
                    flipped = true;
                } else {
                    flipped = false;
                }

                if (!visited_nodes.has(nodebid)) {
                    visited_nodes.set(nodebid, [i, cnid, -1]);
                    const nodeb = nodes.getObj(nodebid);

                    const nodeb_pos = get(nodeb.posSpringA);
                    let newhcost = 0;
                    if (nodes.has(endid)) {
                        const dx = endnode_pos.x - nodeb_pos.x,
                            dy = endnode_pos.y - nodeb_pos.y;
                        newhcost = Math.sqrt(dx * dx + dy * dy);
                    }
                    q.push([
                        nodebid,
                        cnid,
                        gcost + cn.weight,
                        hcostweight * newhcost,
                    ]);
                    flipped_cn.set(cnid, flipped);
                }
            }
        });
    }

    resetAnimations(false);
    visited_nodes.forEach(([_, __, offset], nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        if (offset != -1) {
            ae.push({
                method: 'set_processingState',
                newState: 1,
                t: offset / time_counter,
            });
        }
    });
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            }
        );
    });

    if (found) {
        let c_id = endid;
        while (c_id !== startid) {
            const c_node = nodes.getObj(c_id);
            if (c_node) {
                const nae = get(c_node.animationEvents);
                nae.push({
                    method: 'set_processingState',
                    newState: 2,
                    t: 1,
                });
            }

            const [nxt_node, c_cnid, _] = visited_nodes.get(c_id);
            const c_cn = connections.getObj(c_cnid);
            if (c_cn) {
                const cae = get(c_cn.animationEvents);
                cae.push({
                    method: 'set_processingState',
                    newState: 2,
                    t: 1,
                });
            }

            c_id = nxt_node;
        }
    }
    visual_progress_step_count.set(time_counter);
}

export function calcTopDFS(
    startid: number,
    endid?: number,
    leave_open?: boolean
) {
    const visited_nodes = new Map();
    const visited_cns = new Map();
    const flipped_cn = new Map();
    const perm_seen = new Set();
    type stackitem = [number, number, number];
    const stack: stackitem[] = [];
    const present_on_stack = new Set();
    let time_counter = -1;
    let c_index = 0;

    function runDFS(i: number, tmp_seen: Set<number> = new Set()) {
        const nodea = nodes.getObj(i);
        if (!nodea) return;
        visited_nodes.set(i, ++time_counter);
        tmp_seen.add(i);
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (tmp_seen.has(nodebid)) {
                return false;
            }
            if (!perm_seen.has(nodebid)) {
                flipped_cn.set(cnid, flipped);
                visited_cns.set(cnid, [time_counter, time_counter + 1]);
                if (!runDFS(nodebid, tmp_seen)) return false;
                stack.push([nodebid, cnid, -1]);
            } else {
                stack.find(e => e[0] === nodebid)[1] = cnid;
            }
        }
        tmp_seen.delete(i);
        perm_seen.add(i);
        return true;
    }

    let okgraph = true;
    okgraph = okgraph && runDFS(startid);
    while (visited_nodes.size != nodes.size && okgraph) {
        for (const [id, node] of [...nodes.getAll()]) {
            if (!visited_nodes.has(id)) {
                okgraph = okgraph && runDFS(id);
                stack.push([id, -1, -1]);
                break;
            }
        }
    }
    time_counter++;

    resetAnimations();

    if (!okgraph) {
        [...nodes.getAll()].forEach(([_nid, node]) => {
            const ae = get(node.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: -1,
                t: 0,
            });
        });
        [...connections.getAll()].forEach(([_cnid, cn]) => {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 0,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 0,
                }
            );
        });
        return;
    }

    const endt_of_dfs = time_counter++;

    stack.reverse();
    stack.forEach(arr => {
        arr[2] = ++time_counter;
        return arr;
    });

    visited_nodes.forEach((offset, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        ae.push(
            {
                method: 'set_processingState',
                newState: 1,
                t: offset / time_counter,
            },
            {
                method: 'set_processingState',
                newState: 0,
                t: endt_of_dfs / time_counter,
            }
        );
    });

    const cns_changed_in_sort = new Set();
    stack.forEach(([nid, from_cnid, offset]) => {
        const nextnode = nodes.getObj(nid);
        if (nextnode) {
            const nae = get(nextnode.animationEvents);
            cns_changed_in_sort.add(from_cnid);
            nae.push({
                method: 'set_processingState',
                newState: 3,
                t: offset / time_counter,
            });
        }

        const from_cn = connections.getObj(from_cnid);
        if (from_cn) {
            const cae = get(from_cn.animationEvents);
            cae.push(
                {
                    method: 'set_processingState',
                    newState: 3,
                    t: offset / time_counter,
                },
                {
                    method: 'set_processingProgressOffsets',
                    newProgressOffsets: [
                        (offset - 1) / time_counter,
                        offset / time_counter,
                    ],
                    t: (offset - 1) / time_counter,
                }
            );
        }
    });

    const cns_changed_in_dfs = new Set();
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        cns_changed_in_dfs.add(cnid);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            },
            {
                method: 'set_processingState',
                newState: 0,
                t: endt_of_dfs / time_counter,
            },
            {
                method: 'set_processingProgress',
                newProgress: 0,
                t: endt_of_dfs / time_counter,
            }
        );
        if (!cns_changed_in_sort.has(cnid)) {
            ae.push(
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                },
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 1,
                }
            );
        }
    });

    [...connections.getAll()].forEach(([cnid, cn]) => {
        const ae = get(cn.animationEvents);
        if (!cns_changed_in_sort.has(cnid) && !cns_changed_in_dfs.has(cnid)) {
            ae.push(
                {
                    method: 'set_processingState',
                    newState: 0,
                    t: 0,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                },
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 1,
                }
            );
        }
    });
    visual_progress_step_count.set(time_counter);
}

export function calcTopKhan(
    startid: number,
    endid?: number,
    leave_open?: boolean
) {
    const visited_nodes = new Map();
    const visited_cns = new Map();
    const flipped_cn = new Map();
    const stack = [];
    const present_on_stack = new Set();
    let time_counter = -1;
    let c_index = 0;

    const s = [];
    const incoming = new Map();
    [...nodes.getAll()].forEach(([nid, node]) => {
        incoming.set(nid, node.indirect_cn.size);
        if (node.indirect_cn.size === 0) {
            s.push([node.id, -1]);
        }
    });
    while (s.length) {
        const [i, from_cnid] = s.shift();
        const nodea = nodes.getObj(i);
        if (!nodea) continue;

        visited_nodes.set(i, ++time_counter);
        if (from_cnid !== -1)
            visited_cns.set(from_cnid, [time_counter - 1, time_counter]);
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            flipped_cn.set(cnid, flipped);

            incoming.set(nodebid, incoming.get(nodebid) - 1);
            if (incoming.get(nodebid) === 0) {
                s.push([nodebid, cnid]);
            }
        }
    }
    let okgraph = true;
    incoming.forEach((edges, _) => {
        if (edges !== 0) okgraph = false;
    });

    resetAnimations();

    if (!okgraph) {
        [...nodes.getAll()].forEach(([_nid, node]) => {
            const ae = get(node.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: -1,
                t: 0,
            });
        });
        [...connections.getAll()].forEach(([_cnid, cn]) => {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 0,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 0,
                }
            );
        });
        return;
    }

    visited_nodes.forEach((offset, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        ae.push({
            method: 'set_processingState',
            newState: 1,
            t: offset / time_counter,
        });
    });

    const cns_changed = new Set();
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        cns_changed.add(cnid);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            }
        );
    });
    [...connections.getAll()].forEach(([cnid, cn]) => {
        if (!cns_changed.has(cnid)) {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingState',
                    newState: 0,
                    t: 0,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                },
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 1,
                }
            );
        }
    });
    visual_progress_step_count.set(time_counter);
}

export function calcKosaraju(
    startid: number,
    endid?: number,
    leave_open?: boolean
) {
    const visited_nodes1: Map<number, number> = new Map();
    const visited_nodes2: Map<number, number> = new Map();
    const visited_cns1: Map<number, [number, number]> = new Map();
    const visited_cns2: Map<number, [number, number]> = new Map();
    const flipped_cn1: Map<number, boolean> = new Map();
    const flipped_cn2: Map<number, boolean> = new Map();
    const stack: number[] = [];
    let time_counter = -1;

    function runDFS1(i: number) {
        const nodea = nodes.getObj(i);
        if (!nodea) return;
        visited_nodes1.set(i, ++time_counter);
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (!visited_nodes1.has(nodebid)) {
                flipped_cn1.set(cnid, flipped);
                visited_cns1.set(cnid, [time_counter, time_counter + 1]);
                runDFS1(nodebid);
            }
        }
        stack.push(i);
        return false;
    }

    runDFS1(startid);
    while (visited_nodes1.size != nodes.size) {
        for (const [id, node] of [...nodes.getAll()]) {
            if (!visited_nodes1.has(id)) {
                runDFS1(id);
                break;
            }
        }
    }
    const endt_of_dfs1 = ++time_counter;

    function runDFS2(
        i: number,
        nodesinscc: Set<number>,
        cn_already_part_of_scc: Set<number>,
        root: number = i
    ) {
        const nodea = nodes.getObj(i);
        if (!nodea) return;
        visited_nodes2.set(i, ++time_counter);
        nodesinscc.add(i);
        for (const cnid of nodea.indirect_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (!visited_nodes2.has(nodebid)) {
                flipped_cn2.set(cnid, flipped);
                visited_cns2.set(cnid, [time_counter, time_counter + 1]);
                cn_already_part_of_scc.add(cnid);
                runDFS2(nodebid, nodesinscc, cn_already_part_of_scc, root);
            }
        }
        return false;
    }

    const sccs: [number, Set<number>, Set<number>][] = [];
    do {
        const nxtid = stack.pop();
        const nodesinscc: Set<number> = new Set();
        const cn_already_part_of_scc: Set<number> = new Set();
        if (!visited_nodes2.has(nxtid)) {
            runDFS2(nxtid, nodesinscc, cn_already_part_of_scc);
            sccs.push([++time_counter, nodesinscc, cn_already_part_of_scc]);
        }
    } while (stack.length);

    resetAnimations();
    visited_nodes1.forEach((offset, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        ae.push(
            {
                method: 'set_processingState',
                newState: 1,
                t: offset / time_counter,
            },
            {
                method: 'set_processingState',
                newState: 0,
                t: endt_of_dfs1 / time_counter,
            }
        );
    });
    visited_cns1.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn1.get(cnid),
                t: 0,
            },
            {
                method: 'clear_processingProgress',
                t: endt_of_dfs1 / time_counter,
            }
        );
    });

    visited_nodes2.forEach((offset, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        ae.push({
            method: 'set_processingState',
            newState: 1,
            t: offset / time_counter,
        });
    });
    visited_cns2.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn2.get(cnid),
                t: endt_of_dfs1 / time_counter,
            }
        );
    });
    let scc_counter = 0;
    const cns_changed = new Set();
    sccs.forEach(([offset, nodesinscc, cn_already_part_of_scc]) => {
        for (const nid of nodesinscc) {
            const nextnode = nodes.getObj(nid);
            if (!nextnode) continue;
            const ae = get(nextnode.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: 3 + scc_counter,
                t: offset / time_counter,
            });
            nextnode.direct_cn.forEach(cnid => {
                const nextcn = connections.getObj(cnid);
                if (!nextcn) return;
                const nodebid = nextcn.idA === nid ? nextcn.idB : nextcn.idA;
                if (nodesinscc.has(nodebid)) {
                    cns_changed.add(cnid);
                    const ae = get(nextcn.animationEvents);
                    if (!cn_already_part_of_scc.has(cnid)) {
                        ae.push({
                            method: 'set_processingProgressOffsets',
                            newProgressOffsets: [
                                offset / time_counter,
                                (offset + 1) / time_counter,
                            ],
                            t: offset / time_counter,
                        });
                    }
                    ae.push({
                        method: 'set_processingState',
                        newState: 3 + scc_counter,
                        t: offset / time_counter,
                    });
                }
            });
        }
        scc_counter = (scc_counter + 1) % 5;
    });

    [...connections.getAll()].forEach(([cnid, cn]) => {
        if (!cns_changed.has(cnid)) {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingState',
                    newState: 0,
                    t: endt_of_dfs1 / time_counter,
                },
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: (endt_of_dfs1 / time_counter + 1) / 2,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                }
            );
        }
    });
    visual_progress_step_count.set(time_counter);
}

export function calcTarjan(
    startid: number,
    endid?: number,
    leave_open?: boolean
) {
    const visited_nodes: Map<number, number> = new Map();
    const visited_cns: Map<number, [number, number]> = new Map();
    const flipped_cn: Map<number, boolean> = new Map();
    const stack: [number, number][] = [];
    const present_on_stack: Set<number> = new Set();
    const lowlink: Map<number, number> = new Map();
    const node_index: Map<number, number> = new Map();
    const sccs: [number, Set<number>, Set<number>][] = [];
    let time_counter = -1;
    let c_index = 0;

    function runDFS(i: number) {
        const nodea = nodes.getObj(i);
        if (!nodea) return;
        visited_nodes.set(i, ++time_counter);
        present_on_stack.add(i);
        lowlink.set(i, c_index);
        node_index.set(i, c_index++);
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (!visited_nodes.has(nodebid)) {
                flipped_cn.set(cnid, flipped);
                visited_cns.set(cnid, [time_counter, time_counter + 1]);
                stack.push([nodebid, cnid]);
                runDFS(nodebid);
                lowlink.set(i, Math.min(lowlink.get(i), lowlink.get(nodebid)));
            }
            if (present_on_stack.has(nodebid)) {
                lowlink.set(
                    i,
                    Math.min(lowlink.get(i), node_index.get(nodebid))
                );
            }
        }
        if (lowlink.get(i) === node_index.get(i)) {
            let nxtnodeid = -1;
            const nodesinscc: Set<number> = new Set();
            const cn_already_part_of_scc: Set<number> = new Set();
            let prevcnid;
            const offset = ++time_counter;
            while (nxtnodeid != i) {
                [nxtnodeid, prevcnid] = stack.pop();
                present_on_stack.delete(nxtnodeid);
                nodesinscc.add(nxtnodeid);
                if (nxtnodeid != i) cn_already_part_of_scc.add(prevcnid);
            }
            sccs.push([offset, nodesinscc, cn_already_part_of_scc]);
        }
    }

    stack.push([startid, -1]);
    runDFS(startid);
    while (visited_nodes.size != nodes.size) {
        for (const [id, node] of [...nodes.getAll()]) {
            if (!visited_nodes.has(id)) {
                stack.push([id, -1]);
                runDFS(id);
                break;
            }
        }
    }
    time_counter++;

    resetAnimations();
    visited_nodes.forEach((offset, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        ae.push({
            method: 'set_processingState',
            newState: 1,
            t: offset / time_counter,
        });
    });
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        ae.push(
            {
                method: 'set_processingProgressOffsets',
                newProgressOffsets: [
                    offsets[0] / time_counter,
                    offsets[1] / time_counter,
                ],
                t: offsets[0] / time_counter,
            },
            {
                method: 'set_flipped',
                newFlipped: flipped_cn.get(cnid),
                t: 0,
            }
        );
    });

    let scc_counter = 0;
    const cns_changed = new Set();
    sccs.forEach(([offset, nodesinscc, cn_already_part_of_scc]) => {
        for (const nid of nodesinscc) {
            const nextnode = nodes.getObj(nid);
            if (!nextnode) continue;
            const ae = get(nextnode.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: 3 + scc_counter,
                t: offset / time_counter,
            });
            nextnode.direct_cn.forEach(cnid => {
                const nextcn = connections.getObj(cnid);
                if (!nextcn) return;
                const nodebid = nextcn.idA === nid ? nextcn.idB : nextcn.idA;
                if (nodesinscc.has(nodebid)) {
                    cns_changed.add(cnid);
                    const ae = get(nextcn.animationEvents);
                    if (!cn_already_part_of_scc.has(cnid)) {
                        ae.push({
                            method: 'set_processingProgressOffsets',
                            newProgressOffsets: [
                                offset / time_counter,
                                (offset + 1) / time_counter,
                            ],
                            t: offset / time_counter,
                        });
                    }
                    ae.push({
                        method: 'set_processingState',
                        newState: 3 + scc_counter,
                        t: offset / time_counter,
                    });
                }
            });
        }
        scc_counter = (scc_counter + 1) % 5;
    });

    [...connections.getAll()].forEach(([cnid, cn]) => {
        if (!cns_changed.has(cnid)) {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingState',
                    newState: 0,
                    t: 0,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                },
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 0.5,
                }
            );
        }
    });
    visual_progress_step_count.set(time_counter);
}

export function calcHamiltonian(
    startid: number,
    endid?: number,
    leave_open?: boolean
) {
    const visited_nodes: Map<number, [boolean, number][]> = new Map();
    const visited_cns: Map<
        number,
        [boolean, boolean, number, number][]
    > = new Map();
    const node_part_of_final_path: Set<number> = new Set();
    const cn_part_of_final_path: Set<number> = new Set();
    let time_counter = 0;

    function runDFS(i: number) {
        const nodea = nodes.getObj(i);
        if (!nodea) return false;

        if (!visited_nodes.has(i)) visited_nodes.set(i, []);
        visited_nodes.get(i).push([true, time_counter]);
        if (i === startid && node_part_of_final_path.size > 1)
            return node_part_of_final_path.size === nodes.size;
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (
                !cn_part_of_final_path.has(cnid) &&
                (!node_part_of_final_path.has(nodebid) ||
                    (nodebid === startid &&
                        nodes.size === node_part_of_final_path.size))
            ) {
                if (!visited_cns.has(cnid)) visited_cns.set(cnid, []);
                visited_cns
                    .get(cnid)
                    .push([true, flipped, time_counter, ++time_counter]);

                node_part_of_final_path.add(nodebid);
                cn_part_of_final_path.add(cnid);
                if (runDFS(nodebid)) return true;
                visited_cns
                    .get(cnid)
                    .push([false, flipped, time_counter, ++time_counter]);
                node_part_of_final_path.delete(nodebid);
                cn_part_of_final_path.delete(cnid);
            }
        }
        visited_nodes.get(i).push([false, time_counter]);
        return false;
    }

    node_part_of_final_path.add(startid);
    const found = runDFS(startid);
    resetAnimations();
    visited_nodes.forEach((offsets, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        const toadd = offsets.map(([forward, offset]) => ({
            method: 'set_processingState',
            newState: forward ? 1 : 0,
            t: offset / time_counter,
        }));
        if (node_part_of_final_path.has(nid))
            toadd.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
        ae.push(...toadd);
    });
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        const toadd = [];
        offsets.forEach(([forward, flipped, startoffset, endoffset]) => {
            toadd.push(
                {
                    method: 'set_flipped',
                    newFlipped: flipped,
                    t: startoffset / time_counter,
                },
                {
                    method: forward
                        ? 'set_processingProgressOffsets'
                        : 'set_processingProgressBackwardOffsets',
                    newProgressOffsets: [
                        startoffset / time_counter,
                        endoffset / time_counter,
                    ],
                    t: startoffset / time_counter,
                }
            );
        });
        if (cn_part_of_final_path.has(cnid))
            toadd.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
        ae.push(...toadd);
    });

    if (!found) {
        [...nodes.getAll()].forEach(([_nid, node]) => {
            const ae = get(node.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: -1,
                t: 1,
            });
        });
        [...connections.getAll()].forEach(([_cnid, cn]) => {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 1,
                },
                {
                    method: 'set_processingState',
                    newState: 0,
                    t: (time_counter - 1) / time_counter,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                }
            );
        });
    }
    visual_progress_step_count.set(time_counter);
}

export function calcTS(startid: number, endid?: number, leave_open?: boolean) {
    const visited_nodes: Map<number, [boolean, number][]> = new Map();
    const visited_cns: Map<
        number,
        [boolean, boolean, number, number][]
    > = new Map();
    const node_part_of_path: Set<number> = new Set();
    const cn_part_of_path: Set<number> = new Set();
    let node_part_of_best_path: Set<number> = new Set();
    let cn_part_of_best_path: Set<number> = new Set();
    let time_counter = 0;
    let bestsum = Infinity;

    function runDFS(i: number, weightsum = 0) {
        const nodea = nodes.getObj(i);
        if (!nodea) return false;
        if (!visited_nodes.has(i)) visited_nodes.set(i, []);
        visited_nodes.get(i).push([true, time_counter]);
        if (i === startid && node_part_of_path.size) {
            if (node_part_of_path.size === nodes.size) {
                if (weightsum < bestsum) {
                    node_part_of_best_path = new Set(node_part_of_path);
                    cn_part_of_best_path = new Set(cn_part_of_path);
                    bestsum = weightsum;
                }
            } else return false;
        }
        for (const cnid of nodea.direct_cn) {
            const cn = connections.getObj(cnid);
            if (!cn) continue;

            let nodebid = cn.idB;
            let flipped = false;
            if (cn.idB === i) {
                nodebid = cn.idA;
                flipped = true;
            } else {
                flipped = false;
            }

            if (!node_part_of_path.has(nodebid) && !cn_part_of_path.has(cnid)) {
                if (!visited_cns.has(cnid)) visited_cns.set(cnid, []);
                visited_cns
                    .get(cnid)
                    .push([true, flipped, time_counter, ++time_counter]);

                node_part_of_path.add(nodebid);
                cn_part_of_path.add(cnid);
                if (
                    nodebid !== startid ||
                    node_part_of_path.size === nodes.size
                )
                    runDFS(nodebid, weightsum + cn.weight);
                visited_cns
                    .get(cnid)
                    .push([false, flipped, time_counter, ++time_counter]);
                node_part_of_path.delete(nodebid);
                cn_part_of_path.delete(cnid);
            }
        }
        visited_nodes.get(i).push([false, time_counter]);
        return false;
    }

    runDFS(startid);
    time_counter++;
    resetAnimations();

    visited_nodes.forEach((offsets, nid) => {
        const nextnode = nodes.getObj(nid);
        if (!nextnode) return;
        const ae = get(nextnode.animationEvents);
        const toadd = offsets.map(([forward, offset]) => ({
            method: 'set_processingState',
            newState: forward ? 1 : 0,
            t: offset / time_counter,
        }));
        if (node_part_of_best_path.has(nid))
            toadd.push({
                method: 'set_processingState',
                newState: 2,
                t: 1,
            });
        ae.push(...toadd);
    });
    visited_cns.forEach((offsets, cnid) => {
        const nextcn = connections.getObj(cnid);
        if (!nextcn) return;
        const ae = get(nextcn.animationEvents);
        const toadd = [];
        offsets.forEach(([forward, flipped, startoffset, endoffset]) => {
            toadd.push(
                {
                    method: 'set_flipped',
                    newFlipped: flipped,
                    t: startoffset / time_counter,
                },
                {
                    method: forward
                        ? 'set_processingProgressOffsets'
                        : 'set_processingProgressBackwardOffsets',
                    newProgressOffsets: [
                        startoffset / time_counter,
                        endoffset / time_counter,
                    ],
                    t: startoffset / time_counter,
                }
            );
        });
        if (cn_part_of_best_path.has(cnid))
            toadd.push(
                {
                    method: 'set_processingProgressOffsets',
                    newProgressOffsets: [(time_counter - 1) / time_counter, 1],
                    t: (time_counter - 1) / time_counter,
                },
                {
                    method: 'set_processingState',
                    newState: 2,
                    t: 1,
                }
            );
        ae.push(...toadd);
    });

    if (bestsum === Infinity) {
        [...nodes.getAll()].forEach(([_nid, node]) => {
            const ae = get(node.animationEvents);
            ae.push({
                method: 'set_processingState',
                newState: -1,
                t: 1,
            });
        });
        [...connections.getAll()].forEach(([_cnid, cn]) => {
            const ae = get(cn.animationEvents);
            ae.push(
                {
                    method: 'set_processingProgress',
                    newProgress: 1,
                    t: 1,
                },
                {
                    method: 'set_processingState',
                    newState: 0,
                    t: (time_counter - 1) / time_counter,
                },
                {
                    method: 'set_processingState',
                    newState: -1,
                    t: 1,
                }
            );
        });
    }
    visual_progress_step_count.set(time_counter);
}
