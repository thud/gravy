<script lang="ts">
    import { spring } from 'svelte/motion';
    import { derived, get } from 'svelte/store';
    import GraphVertex from './GraphVertex.svelte';
    import GraphConnection from './GraphConnection.svelte';
    import WeightEditor from './WeightEditor.svelte';
    import Vertex from '../model/Vertex';
    import type Connection from '../model/Connection';
    import {
        zoom,
        zoom_multiplier,
        canvas_offsets,
        moving_canvas,
        time_offset,
        nodes,
        next_node_id,
        orb_speed,
        connections,
        show_cn_directions,
        selected_node,
        selected_cn_weight,
        start_node_id,
        end_node_id,
        clearing_canvas,
        recalculate_vis,
        visualising,
        visual_progress_step_count,
        algo_to_visualise,
        colors,
        mode,
    } from '../model/State';
    import { generateRandomUndirected } from '../utils/Generate';
    import {
        calcDFS,
        calcBFS,
        calcDijkstra,
        calcBiDijkstra,
        calcAStar,
        calcTopDFS,
        calcTopKhan,
        calcKosaraju,
        calcTarjan,
        calcHamiltonian,
        calcTS,
    } from '../utils/Algorithms';
    import {
        addVertex,
        rc2c,
        playVisualisation,
        resetAnimations,
    } from '../utils/Utils';

    const nodecreatedeadzoneradius = 40;
    let canvas: any;

    function step(t: number) {
        $time_offset = t * $orb_speed;

        if ($show_cn_directions) {
            window.requestAnimationFrame(step);
        }
    }

    $: if ($show_cn_directions) {
        window.requestAnimationFrame(step);
    }

    $: if ($mode !== 4) {
        $selected_cn_weight = -1;
    }

    $: if ($mode !== 1) {
        $selected_node = -1;
    }

    let addedScrollListener = false;
    $: if (canvas && !addedScrollListener) {
        canvas.addEventListener(
            'wheel',
            (e: any) => {
                zoom.update(zm =>
                    Math.min(Math.max(zm - e.deltaY * $zoom_multiplier, 0.4), 3)
                );
            },
            { passive: true }
        );
        addedScrollListener = true;
    }

    let lastPos: any, totDistMoved: number;
    function handleMousedown(e: any) {
        if ($selected_node === -1) {
            switch ($mode) {
                case 0:
                    if (!$clearing_canvas)
                        window.addEventListener(
                            'mouseup',
                            handleMouseupCreateVertex
                        );
                default:
                    if ($selected_node === -1) {
                        $moving_canvas = true;
                        totDistMoved = 0;
                        lastPos = { x: e.clientX, y: e.clientY };
                        window.addEventListener('mousemove', handleMousemove);
                        window.addEventListener(
                            'mouseup',
                            handleMouseupDefault
                        );
                    }
            }
        }
    }

    function handleMousemove(e: any) {
        let coords = { x: e.clientX, y: e.clientY };
        let dx = coords.x - lastPos.x;
        let dy = coords.y - lastPos.y;
        lastPos = coords;
        totDistMoved += dx * dx + dy * dy;

        canvas_offsets.update(cvo => ({
            x: cvo.x + dx / $zoom,
            y: cvo.y + dy / $zoom,
        }));
    }

    function handleMouseupDefault() {
        window.removeEventListener('mousemove', handleMousemove);
        window.removeEventListener('mouseup', handleMouseupDefault);
        $moving_canvas = false;
    }

    function handleMouseupCreateVertex() {
        if (totDistMoved <= nodecreatedeadzoneradius) {
            const pos = rc2c($zoom, $canvas_offsets, lastPos);
            const newid = $next_node_id;
            $next_node_id++;
            const newnode = new Vertex(
                newid,
                spring(pos),
                spring(pos),
                spring(0),
                spring(0)
            );
            addVertex(newnode);
        }
        window.removeEventListener('mouseup', handleMouseupCreateVertex);
    }

    const recalc = derived([visualising, algo_to_visualise], ([vis, algo]) => [
        vis,
        algo,
    ]);

    let unsubscribeprevalgo = () => {};
    let c_startid: number = -1,
        c_endid: number = -1;
    tryResetRandomStartAndEnd();

    function tryResetRandomStartAndEnd() {
        const sni = get(start_node_id),
            eni = get(end_node_id);
        if (nodes.has(sni)) c_startid = sni;
        else if (!nodes.has(c_startid) && nodes.size) {
            let x = 0;
            const nsids = nodes.keys();
            let randindex = Math.floor(Math.random() * nodes.size);
            while (x++ < randindex) c_startid = nsids.next().value;
        }

        if (nodes.has(eni)) c_endid = eni;
        else if (!nodes.has(c_endid) && nodes.size > 1) {
            do {
                let x = 0;
                const nsids = nodes.keys();
                let randindex = Math.floor(Math.random() * nodes.size);
                c_endid = nsids.next().value;
                while (x++ < randindex) c_endid = nsids.next().value;
            } while (c_endid === c_startid);
        } else if (nodes.size <= 1) {
            c_endid = c_startid;
        }
    }

    function fullResetStartAndEnd() {
        const sni = get(start_node_id),
            eni = get(end_node_id);
        const nsids = nodes.keys();
        if (nodes.has(sni)) c_startid = sni;
        else if (nodes.size) {
            let x = 0;
            let randindex = Math.floor(Math.random() * nodes.size);
            while (x++ < randindex) c_startid = nsids.next().value;
        }

        if (nodes.has(eni)) c_endid = eni;
        else if (nodes.size > 1) {
            do {
                let x = 0;
                let randindex = Math.floor(Math.random() * nodes.size);
                while (x++ < randindex) c_endid = nsids.next().value;
            } while (c_endid === c_startid);
        } else if (nodes.size <= 1) {
            c_endid = c_startid;
        }
    }

    recalc.subscribe(([vis, algo]) => {
        if (vis && algo >= 0 && algo <= 10) {
            let algofn = (
                _startid: number,
                _endid: number,
                _leave_open?: boolean
            ) => {};
            switch (algo) {
                case 0:
                    algofn = calcDFS;
                    break;
                case 1:
                    algofn = calcBFS;
                    break;
                case 2:
                    algofn = calcDijkstra;
                    break;
                case 3:
                    algofn = calcBiDijkstra;
                    break;
                case 4:
                    algofn = calcAStar;
                    break;
                case 5:
                    algofn = calcTopDFS;
                    break;
                case 6:
                    algofn = calcTopKhan;
                    break;
                case 7:
                    algofn = calcKosaraju;
                    break;
                case 8:
                    algofn = calcTarjan;
                    break;
                case 9:
                    algofn = calcHamiltonian;
                    break;
                case 10:
                    algofn = calcTS;
                    break;
            }
            unsubscribeprevalgo();

            fullResetStartAndEnd();

            recalculate_vis.set(true);

            unsubscribeprevalgo = recalculate_vis.subscribe(re => {
                if (re) {
                    const eni = get(end_node_id);

                    tryResetRandomStartAndEnd();

                    if (nodes.size) algofn(c_startid, c_endid, eni === -1);

                    recalculate_vis.set(false);
                }
            });

            playVisualisation();
        } else if (!vis) {
            visual_progress_step_count.set(1);
            resetAnimations(true);
            unsubscribeprevalgo();
            unsubscribeprevalgo = () => {};
        }
    });

    // start with a random graph;
    generateRandomUndirected();
</script>

<style>
    svg {
        margin: 0;
        width: 100%;
        height: 100%;
    }
</style>

{#if $mode === 4}
    {#each [...$connections] as [cid, c] (cid)}
        <WeightEditor {c} />
    {/each}
{/if}
<svg
    bind:this={canvas}
    id="canvas"
    style="background-color: {$colors.nord0}"
    on:mousedown={handleMousedown}>
    {#each [...$connections] as [cid, c] (cid)}
        <GraphConnection {c} />
    {/each}
    {#each [...$nodes] as [nid, n] (nid)}
        <GraphVertex {n} />
    {/each}
</svg>
