<script>
    import { derived } from 'svelte/store'
    import { fade } from 'svelte/transition'
    import { spring } from 'svelte/motion'
    import {
        nodes,
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
    } from '../model/State'
    import Connection from '../model/Connection'

    import { c2c, rc2c, addConnection, delNode } from '../utils/Utils'

    export let n
    let sizes = [20, 13]

    let posSpringA = n.posSpringA
    let posSpringB = n.posSpringB
    let sizeSpringA = n.sizeSpringA
    let sizeSpringB = n.sizeSpringB
    const animationState = derived(
        [visual_progress, n.animationEvents],
        ([vp, ae]) => {
            ae.sort((e1, e2) => e1.t - e2.t)
            const new_state = {
                processingState: 0,
            }
            for (const e of ae) {
                if (e.t > vp) break
                switch (e.method) {
                    case 'set_processingState':
                        new_state.processingState = e.newState
                        break
                }
            }
            return new_state
        }
    )

    $: if (!n.kill && $selected_node != n.id) {
        n.posSpringA.stiffness = 0.1
        n.posSpringB.stiffness = 0.05
        n.posSpringB.damping = 0.1
        sizeSpringA.set(sizes[0])
        sizeSpringB.set(sizes[1])
    } else if (!n.kill) {
        n.posSpringA.stiffness = 0.3
        n.posSpringB.stiffness = 0.02
        sizeSpringA.set(sizes[0] * 1.3)
        sizeSpringB.set(sizes[1] * 1.3)
    }

    function killConnections() {
        $connections = $connections.map((cn) => {
            if (n.direct_cn.has(cn.id)) cn.kill = true
            if (n.indirect_cn.has(cn.id)) cn.kill = true
            return cn
        })
    }

    let alreadykilling = false
    $: if (n.kill && !alreadykilling) {
        sizeSpringA.set(0)
        sizeSpringB.set(0)
        killConnections()
        alreadykilling = true
    }

    $: if (n.kill && $sizeSpringA <= 0 && $sizeSpringB <= 0) {
        killConnections() // Extra safety
        console.log('killed node')
        delNode(n.id)
    }

    let lastPos

    function handleMousedown(e) {
        switch ($mode) {
            case 0: // move node
                $selected_node = n.id
                lastPos = $posSpringA

                window.addEventListener('mousemove', handleMousemove)
                window.addEventListener('mouseup', handleMouseup)
                if ($algo_to_visualise === 4)
                    intervalID = setInterval(recalculate_vis.set, 1000, true)
                break
            case 1: // create edge
                let alreadyCreated = false
                n.direct_cn.forEach((cnid) => {
                    let cn = $connections.find((cn) => cn.id === cnid)
                    if (
                        cn.idA === $selected_node ||
                        cn.idB === $selected_node
                    ) {
                        alreadyCreated = true
                    }
                })
                if (!alreadyCreated) {
                    n.indirect_cn.forEach((cnid) => {
                        let cn = $connections.find((cn) => cn.id === cnid)
                        if (
                            cn.idA === $selected_node ||
                            cn.idB === $selected_node
                        ) {
                            alreadyCreated = true
                        }
                    })
                }

                if ($selected_node === n.id) {
                    $selected_node = -1
                } else if ($selected_node === -1 || alreadyCreated) {
                    console.log('test')
                    console.log($selected_node, alreadyCreated)
                    $selected_node = n.id
                } else if ($selected_node != n.id) {
                    let selected_node_index = $nodes.findIndex(
                        (node) => node.id === $selected_node
                    )
                    const newcn = new Connection(
                        $next_cn_id++,
                        $selected_node,
                        n.id,
                        $default_cn_weight
                    )

                    addConnection(newcn)

                    $selected_node = -1
                }
                break
            case 2: // delete node
                /*
				console.log("attempting to delete ", n.id);
				console.log(" connections to ", n.id, " = ", n.direct_cn, n.indirect_cn);
				console.log($nodes);
				*/

                n.kill = true
                break
            case 3:
                $connections = $connections.map((cn) => {
                    if (n.direct_cn.has(cn.id)) cn.kill = true
                    if (n.indirect_cn.has(cn.id)) cn.kill = true
                    return cn
                })
                n.direct_cn.clear()
                n.indirect_cn.clear()
                break
            default:
                console.warn('default on switch')
                break
        }
    }

    let intervalID
    function handleMousemove(e) {
        if ($selected_node === n.id) {
            let coords = rc2c($zoom, $canvas_offsets, {
                x: e.clientX,
                y: e.clientY,
            })
            let dx = coords.x - lastPos.x
            let dy = coords.y - lastPos.y
            lastPos = coords

            posSpringA.update((psa) => ({
                x: psa.x + dx,
                y: psa.y + dy,
            }))
            posSpringB.update((psb) => ({
                x: psb.x + dx,
                y: psb.y + dy,
            }))
        }
    }

    function handleMouseup(e) {
        $selected_node = -1
        if (intervalID) {
            clearInterval(intervalID)
            recalculate_vis.set(true)
        }
        window.removeEventListener('mousemove', handleMousemove)
        window.removeEventListener('mouseup', handleMouseup)
    }

    const outerFill = derived(
        [animationState, start_node_id, end_node_id],
        ([as, sni, eni]) => {
            if (sni === n.id && as.processingState <= 2) return $colors.nord14
            if (eni === n.id && as.processingState <= 2) return $colors.nord11
            switch (as.processingState) {
                case -1:
                    return $colors.nord3
                case 0:
                    return $colors.nord10
                case 1:
                    return $colors.nord13
                case 2:
                    return $colors.nord14
                case 3:
                    return $colors.nord12
                case 4:
                    return $colors.nord7
                case 5:
                    return $colors.nord15
                case 6:
                    return $colors.nord4
                case 7:
                    return $colors.nord8
            }
        }
    )
    const innerFill = derived(
        [animationState, start_node_id, end_node_id],
        ([as, sni, eni]) => {
            if (sni === n.id) return $colors.nord5
            if (eni === n.id) return $colors.nord5
            if (as.processingState == 0) return $colors.nord9
            return $colors.nord5
        }
    )
    const textFill = derived(
        [animationState, start_node_id, end_node_id],
        ([as, sni, eni]) => {
            if (as.processingState !== 0 || sni === n.id || eni === n.id)
                return $colors.nord0
            return $colors.nord5
        }
    )

    const pa = derived([zoom, canvas_offsets, posSpringA], ([zm, cvo, psa]) => {
        return c2c(zm, cvo, {
            x: psa.x,
            y: psa.y,
        })
    })
    const pb = derived([zoom, canvas_offsets, posSpringB], ([zm, cvo, psb]) => {
        return c2c(zm, cvo, {
            x: psb.x,
            y: psb.y,
        })
    })
    const ssa = derived(
        [zoom, sizeSpringA],
        ([zm, ssa]) => zm * Math.max(0, ssa)
    )
    const ssb = derived(
        [zoom, sizeSpringB],
        ([zm, ssb]) => zm * Math.max(0, ssb)
    )
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
        dominant-baseline: middle;
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

{#if $show_node_labels && !n.kill}
    <text
        on:mousedown={handleMousedown}
        transition:fade={{ duration: 150 }}
        style="fill:{$textFill}; font-size:{16 * $zoom}px; {$zoom < 0.6 ? 'display: none;' : ''}
        {$mode === 0 ? 'cursor: move;' : ''}
        {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
        x={$pb.x}
        y={$pb.y + 2}>
        {n.id}
    </text>
{/if}
