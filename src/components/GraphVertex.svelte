<script lang="ts">
    import { derived } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';
    import {
        connections,
        selected_node,
        show_node_labels,
        next_cn_id,
        default_cn_weight,
        start_node_id,
        end_node_id,
        mode,
        visual_progress,
        recalculate_vis,
        algo_to_visualise,
        zoom,
        canvas_offsets,
        colors,
    } from '../model/State';
    import type Vertex from '../model/Vertex';
    import Connection from '../model/Connection';
    import type { Pos } from '../model/Utils';

    import { c2c, rc2c, addConnection, delVertex } from '../utils/Utils';

    export let n: Vertex;
    let sizes = [20, 13];

    let posSpringA = n.posSpringA;
    let posSpringB = n.posSpringB;
    let sizeSpringA = n.sizeSpringA;
    let sizeSpringB = n.sizeSpringB;
    let nkill = n.kill;
    const animationState = derived(
        [visual_progress, n.animationEvents],
        ([vp, ae]) => {
            ae.sort((e1, e2) => e1.t - e2.t);
            const new_state = {
                processingState: 0,
            };
            for (const e of ae) {
                if (e.t > vp) break;
                switch (e.method) {
                    case 'set_processingState':
                        new_state.processingState = e.newState;
                        break;
                }
            }
            return new_state;
        }
    );

    $: if (!$nkill && $selected_node != n.id) {
        n.posSpringA.stiffness = 0.1;
        n.posSpringB.stiffness = 0.05;
        n.posSpringB.damping = 0.1;
        sizeSpringA.set(sizes[0]);
        sizeSpringB.set(sizes[1]);
    } else if (!$nkill) {
        n.posSpringA.stiffness = 0.3;
        n.posSpringB.stiffness = 0.02;
        sizeSpringA.set(sizes[0] * 1.3);
        sizeSpringB.set(sizes[1] * 1.3);
    }

    function killConnections() {
        n.direct_cn.forEach(cnid => {
            if ($connections.has(cnid)) $connections.get(cnid).kill.set(true);
        });
        n.indirect_cn.forEach(cnid => {
            if ($connections.has(cnid)) $connections.get(cnid).kill.set(true);
        });
        n.direct_cn.clear();
        n.indirect_cn.clear();
    }

    let alreadykilling = false;
    $: if ($nkill && !alreadykilling) {
        sizeSpringA.set(0);
        sizeSpringB.set(0);
        killConnections();
        alreadykilling = true;
    }

    $: if ($nkill && $sizeSpringA <= 0 && $sizeSpringB <= 0) {
        killConnections(); // Extra safety
        delVertex(n.id);
    }

    let lastPos: Pos;

    function handleMousedown() {
        switch ($mode) {
            case 0: // move node
                $selected_node = n.id;
                lastPos = $posSpringA;

                window.addEventListener('mousemove', handleMousemove);
                window.addEventListener('mouseup', handleMouseup);
                if ($algo_to_visualise === 4)
                    // only need to recalc every second for A* (node position dependent)
                    intervalID = setInterval(recalculate_vis.set, 1000, true);
                break;
            case 1: // create edge
                let alreadyCreated = false;
                n.direct_cn.forEach(cnid => {
                    let cn = $connections.get(cnid);
                    if (
                        cn.idA === $selected_node ||
                        cn.idB === $selected_node
                    ) {
                        alreadyCreated = true;
                    }
                });
                if (!alreadyCreated) {
                    n.indirect_cn.forEach(cnid => {
                        let cn = $connections.get(cnid);
                        if (
                            cn.idA === $selected_node ||
                            cn.idB === $selected_node
                        ) {
                            alreadyCreated = true;
                        }
                    });
                }

                if ($selected_node === n.id) $selected_node = -1;
                else if ($selected_node === -1 || alreadyCreated)
                    $selected_node = n.id;
                else if ($selected_node != n.id) {
                    const newcn = new Connection(
                        $next_cn_id,
                        $selected_node,
                        n.id,
                        $default_cn_weight
                    );
                    $next_cn_id++;
                    addConnection(newcn);

                    $selected_node = -1;
                }
                break;
            case 2: // delete node
                $nkill = true;
                break;
            case 3:
                killConnections();
                break;
            default:
                console.warn('default on switch');
                break;
        }
    }

    let intervalID: number;
    function handleMousemove(e: any) {
        if ($selected_node === n.id) {
            let coords = rc2c($zoom, $canvas_offsets, {
                x: e.clientX,
                y: e.clientY,
            });
            let dx = coords.x - lastPos.x;
            let dy = coords.y - lastPos.y;
            lastPos = coords;

            posSpringA.update((psa: any) => ({
                x: psa.x + dx,
                y: psa.y + dy,
            }));
            posSpringB.update((psb: any) => ({
                x: psb.x + dx,
                y: psb.y + dy,
            }));
        }
    }

    function handleMouseup() {
        $selected_node = -1;
        if (intervalID) {
            clearInterval(intervalID);
            recalculate_vis.set(true);
        }
        window.removeEventListener('mousemove', handleMousemove);
        window.removeEventListener('mouseup', handleMouseup);
    }

    const outerFill = derived(
        [animationState, start_node_id, end_node_id],
        ([as, sni, eni]) => {
            if (sni === n.id && as.processingState <= 2) return $colors.nord14;
            if (eni === n.id && as.processingState <= 2) return $colors.nord11;
            switch (as.processingState) {
                case -1:
                    return $colors.nord3;
                case 0:
                    return $colors.nord10;
                case 1:
                    return $colors.nord13;
                case 2:
                    return $colors.nord14;
                case 3:
                    return $colors.nord12;
                case 4:
                    return $colors.nord7;
                case 5:
                    return $colors.nord15;
                case 6:
                    return $colors.nord4;
                case 7:
                    return $colors.nord8;
            }
        }
    );
    const innerFill = derived(
        [animationState, start_node_id, end_node_id],
        ([as, sni, eni]) => {
            if (sni === n.id) return $colors.nord5;
            if (eni === n.id) return $colors.nord5;
            if (as.processingState == 0) return $colors.nord9;
            return $colors.nord5;
        }
    );
    const textFill = derived(
        [animationState, start_node_id, end_node_id],
        ([as, sni, eni]) => {
            if (as.processingState !== 0 || sni === n.id || eni === n.id)
                return $colors.nord0;
            return $colors.nord5;
        }
    );

    const pa = derived([zoom, canvas_offsets, posSpringA], ([zm, cvo, psa]) => {
        psa = psa as any;
        return c2c(zm, cvo, {
            x: psa.x,
            y: psa.y,
        });
    });
    const pb = derived([zoom, canvas_offsets, posSpringB], ([zm, cvo, psb]) => {
        return c2c(zm, cvo, {
            x: psb.x,
            y: psb.y,
        });
    });
    const ssa = derived(
        [zoom, sizeSpringA],
        ([zm, ssa]) => zm * Math.max(0, ssa)
    );
    const ssb = derived(
        [zoom, sizeSpringB],
        ([zm, ssb]) => zm * Math.max(0, ssb)
    );

</script>

<style>
    circle,
    text {
        transition: fill 0.5s ease;
    }

    text {
        font-family: 'Inter', sans-serif;
        font-weight: bold;
        text-anchor: middle;
        /*dominant-baseline: middle;*/
        cursor: move;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -o-user-select: none;
        user-select: none;
    }

</style>

<circle
    on:mousedown={handleMousedown}
    class:selected-node={$selected_node === n.id}
    style="fill:{$outerFill}; {$mode === 0 ? 'cursor: move;' : ''}
    {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
    cx={$pa.x}
    cy={$pa.y}
    r={$ssa} />
<circle
    on:mousedown={handleMousedown}
    class:selected-node={$selected_node === n.id}
    style="fill:{$innerFill}; {$zoom < 0.6 ? 'display: none;' : ''}
    {$mode === 0 ? 'cursor: move;' : ''}
    {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
    cx={$pb.x}
    cy={$pb.y}
    r={$ssb} />

{#if $show_node_labels && !$nkill}
    <text
        on:mousedown={handleMousedown}
        transition:fade={{ duration: 150, easing: cubicInOut, delay: 0 }}
        style="fill:{$textFill}; font-size:{$zoom}rem; {$zoom < 0.6 ? 'display: none;' : ''}
        {$mode === 0 ? 'cursor: move;' : ''}
        {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
        x={$pb.x}
        y={$pb.y + 6 * $zoom}>
        {n.id}
    </text>
{/if}
