<script lang="ts">
    import { derived } from 'svelte/store';
    import { tweened } from 'svelte/motion';
    import { fade } from 'svelte/transition';
    import { expoInOut, cubicInOut } from 'svelte/easing';
    import type Vertex from '../model/Vertex';
    import type Connection from '../model/Connection';
    import type { Pos, PosDerived, StrDerived } from '../model/Utils';
    import {
        time_offset,
        zoom,
        canvas_offsets,
        visual_progress,
        nodes,
        orb_number,
        mode,
        show_cn_weights,
        show_cn_directions,
        selected_cn_weight,
        recalculate_vis,
        colors,
    } from '../model/State';

    import { delConnection, c2c } from '../utils/Utils';

    export let c: Connection;
	
	let cweight = c.weight;
    let lengthTween = c.lengthTween;
    let opacityTween = tweened(1, { easing: expoInOut, duration: 500 });
    let nodeA: Vertex,
        nodeB: Vertex,
        nodeAPos: PosDerived,
        nodeBPos: PosDerived;

    type ConnectionAnimationState = {
        processingState: number;
        processingProgress: number;
        flipped: boolean;
    };

    const animationState = derived(
        [visual_progress, c.animationEvents],
        ([vp, ae]) => {
            vp = vp as number;
            ae = ae as any[];
            ae.sort((e1, e2) => e1.t - e2.t);
            const new_state: ConnectionAnimationState = {
                processingState: 1,
                processingProgress: 0,
                flipped: false,
            };
            let startt: number, endt: number, new_progress: number;
            for (const e of ae) {
                if (e.t > vp) break;
                switch (e.method) {
                    case 'set_processingState':
                        new_state.processingState = e.newState;
                        break;
                    case 'set_processingProgressOffsets':
                        [startt, endt] = e.newProgressOffsets;
                        new_progress = 0;
                        if (vp >= startt && vp <= endt)
                            new_progress = (vp - startt) / (endt - startt);
                        else if (vp > endt) new_progress = 1;
                        new_state.processingProgress = new_progress;
                        break;
                    case 'set_processingProgressBackwardOffsets':
                        [startt, endt] = e.newProgressOffsets;
                        new_progress = 1;
                        if (vp >= startt && vp <= endt)
                            new_progress = (endt - vp) / (endt - startt);
                        else if (vp > endt) new_progress = 0;
                        new_state.processingProgress = new_progress;
                        break;
                    case 'set_processingProgress':
                        new_state.processingProgress = e.newProgress;
                        break;
                    case 'clear_processingProgress':
                        new_state.processingProgress = 0;
                        break;
                    case 'set_flipped':
                        new_state.flipped = e.newFlipped;
                        break;
                }
            }
            return new_state;
        }
    );

    if ($nodes.has(c.idA) && $nodes.has(c.idB)) {
        // check if connection is legit before creating
        nodeA = $nodes.get(c.idA);
        nodeB = $nodes.get(c.idB);
        nodeAPos = derived(
            [zoom, canvas_offsets, nodeA.posSpringA],
            ([zm, cvo, psa]) => c2c(zm as number, cvo as Pos, psa as Pos)
        );
        nodeBPos = derived(
            [zoom, canvas_offsets, nodeB.posSpringA],
            ([zm, cvo, psa]) => c2c(zm as number, cvo as Pos, psa as Pos)
        );

        lengthTween.set(1, {});
    } else {
        c.kill = true;
    }

    let alreadykilling = false;
    $: if (c && c.kill && !alreadykilling) {
        lengthTween.set(0, {});
        opacityTween.set(0, {});
        if ($nodes.has(c.idA)) {
            nodeA.direct_cn.delete(c.id);
            nodeA.indirect_cn.delete(c.id);
        }
        if ($nodes.has(c.idB)) {
            nodeB.direct_cn.delete(c.id);
            nodeB.indirect_cn.delete(c.id);
        }
        alreadykilling = true;
    }

    $: if ($lengthTween <= 0 && c.kill) {
        delConnection(c.id);
    }

    function handleMousedown() {
        switch ($mode) {
            case 3: // delete edge
                c.kill = true;
                break;
            case 4: // edit edge weights
                $selected_cn_weight = c.id;
                break;
            case 5: // edit edge directions
                c.settingDirection = true;
                break;
        }
    }

    const progressStart: PosDerived = derived(
        [animationState, nodeAPos, nodeBPos, lengthTween],
        ([as, snp, enp, lt]) => {
            as = as as ConnectionAnimationState;
            snp = snp as Pos;
            enp = enp as Pos;
            lt = lt as number;
            if (as.flipped) {
                return {
                    x: enp.x,
                    y: enp.y,
                };
            }
            return {
                x: snp.x,
                y: snp.y,
            };
        }
    );
    const progressEnd: PosDerived = derived(
        [animationState, nodeAPos, nodeBPos, lengthTween],
        ([as, snp, enp, lt]) => {
            as = as as ConnectionAnimationState;
            snp = snp as Pos;
            enp = enp as Pos;
            lt = lt as number;
            const p = as.processingProgress;
            if (as.flipped) {
                return {
                    x: (1 - lt * p) * enp.x + p * lt * snp.x,
                    y: (1 - lt * p) * enp.y + p * lt * snp.y,
                };
            }
            return {
                x: (1 - lt * p) * snp.x + p * lt * enp.x,
                y: (1 - lt * p) * snp.y + p * lt * enp.y,
            };
        }
    );

    const getXFromD = (d: number, twval: number) =>
        (1 - d * twval) * $nodeAPos.x + d * twval * $nodeBPos.x;
    const getYFromD = (d: number, twval: number) =>
        (1 - d * twval) * $nodeAPos.y + d * twval * $nodeBPos.y;

    const undirected = (orb: number, orbs_length: number, t: number) =>
        Math.abs(((t + (2 * orb) / orbs_length) % 2) - 1);
    const directedA = (orb: number, orbs_length: number, t: number) =>
        (t + orb / orbs_length) % 1;
    const directedB = (orb: number, orbs_length: number, t: number) =>
        1 - ((t + orb / orbs_length) % 1);

    let getD = undirected;

    $: if (c.settingDirection && !c.kill) {
        nodeA.direct_cn.delete(c.id);
        nodeA.indirect_cn.delete(c.id);
        nodeB.direct_cn.delete(c.id);
        nodeB.indirect_cn.delete(c.id);
        switch (c.directionCounter) {
            case 0:
                nodeA.direct_cn.add(c.id);
                nodeB.direct_cn.add(c.id);
                nodeA.indirect_cn.add(c.id);
                nodeB.indirect_cn.add(c.id);
                getD = undirected;
                break;
            case 1:
                nodeA.direct_cn.add(c.id);
                nodeB.indirect_cn.add(c.id);
                getD = directedA;
                break;
            case 2:
                nodeA.indirect_cn.add(c.id);
                nodeB.direct_cn.add(c.id);
                getD = directedB;
                break;
        }

        c.settingDirection = false;
        c.directionCounter++;
        c.directionCounter %= 3;
        recalculate_vis.set(true);
    }

    const progressColour: StrDerived = derived(animationState, as => {
        switch (as.processingState) {
            case -1:
                return $colors.nord3;
            case 0:
                return $colors.nord10;
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
            default:
                return $colors.nord13;
        }
    });

    c.centerPos = derived(
        [lengthTween, nodeAPos, nodeBPos],
        ([lt, apos, bpos]) => ({
            x: (1 - 0.5 * lt) * apos.x + 0.5 * lt * bpos.x,
            y: (1 - 0.5 * lt) * apos.y + 0.5 * lt * bpos.y,
        })
    );
    let centerPos = c.centerPos;

    $: orbs = Array.from(Array($orb_number).keys());
</script>

<style>
    text {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        font-family: 'Inter', sans-serif;
        font-weight: bold;
    }

    .cn-weight-text {
        text-anchor: middle;
    }

    .processingLine {
        transition: stroke 0.5s ease;
    }
</style>

<mask id="textMask{c.id}">
    <line
        on:mousedown={handleMousedown}
        x1={$progressStart.x}
        y1={$progressStart.y}
        x2={$progressEnd.x}
        y2={$progressEnd.y}
        stroke-linecap="round"
        opacity={$opacityTween}
        style="stroke:white; stroke-width:{15 * $zoom}; {$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}" />
</mask>

<line
    on:mousedown={handleMousedown}
    x1={$nodeAPos.x}
    y1={$nodeAPos.y}
    x2={(1 - $lengthTween) * $nodeAPos.x + $lengthTween * $nodeBPos.x}
    y2={(1 - $lengthTween) * $nodeAPos.y + $lengthTween * $nodeBPos.y}
    stroke-linecap="round"
    opacity={$opacityTween}
    style="stroke:{$colors.nord10}; stroke-width:{15 * $zoom}; {$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}" />

<line
    class="processingLine"
    on:mousedown={handleMousedown}
    x1={$progressStart.x}
    y1={$progressStart.y}
    x2={$progressEnd.x}
    y2={$progressEnd.y}
    stroke-linecap="round"
    opacity={$opacityTween}
    style="stroke:{$progressColour}; stroke-width:{15 * $zoom}; {$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}" />

{#if $show_cn_directions && !c.kill}
    {#each orbs as orb (orb)}
        <circle
            on:mousedown={handleMousedown}
            style={$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}
            transition:fade={{ duration: 200, delay: 0, easing: cubicInOut }}
            r={5 * $zoom}
            fill={$colors.nord9}
            cx={getXFromD(getD(orb, orbs.length, $time_offset), $lengthTween)}
            cy={getYFromD(getD(orb, orbs.length, $time_offset), $lengthTween)} />
    {/each}
{/if}

{#if $show_cn_weights && !c.kill}
    <text
        on:mousedown={handleMousedown}
        transition:fade={{ duration: 200, delay: 0, easing: cubicInOut }}
        fill={$colors.nord4}
        class="cn-weight-text"
        style="font-size:{$zoom}rem; {$mode === 3 || $mode === 5 ? 'cursor: pointer;' : ''}
        {$zoom < 0.6 ? 'display: none;' : ''}"
        x={$centerPos.x}
        y={$centerPos.y + 6 * $zoom}>
        {$cweight}
    </text>
    <text
        on:mousedown={handleMousedown}
        transition:fade={{ duration: 200, delay: 0, easing: cubicInOut }}
        fill={$colors.nord0}
        mask="url(#textMask{c.id})"
        class="cn-weight-text"
        style=" font-size:{$zoom}rem; {$mode === 3 || $mode === 5 ? 'cursor: pointer;' : ''}
        {$zoom < 0.6 ? 'display: none;' : ''}"
        x={$centerPos.x}
        y={$centerPos.y + 6 * $zoom}>
        {$cweight}
    </text>
{/if}
