<script>
    import { tweened, spring } from 'svelte/motion'
    import { derived, get } from 'svelte/store'
    import GraphNode from './GraphNode.svelte'
    import GraphConnection from './GraphConnection.svelte'
    import WeightEditor from './WeightEditor.svelte'
    import StackVis from './StackVis.svelte'
    import Node from '../model/Node.js'
    import {
        zoom,
        zoom_multiplier,
        canvas_offsets,
        moving_canvas,
        time_offset,
        nodes,
        next_node_id,
        orb_speed,
        orb_number,
        connections,
        show_cn_directions,
        selected_node,
        selected_cn_weight,
        create_start_node,
        create_end_node,
        start_node_id,
        end_node_id,
        clearing_canvas,
        visualising,
        visual_progress_step_count,
        algo_to_visualise,
        recalculate_vis,
        colors,
        mode,
    } from '../model/State.js'

    import { resetAnimations, playVisualisation } from '../utils/Utils.js'
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
    } from '../utils/Algorithms.js'

    import { addNode, c2c, rc2c } from '../utils/Utils.js'

    const nodecreatedeadzoneradius = 40
    let canvas
    let mousedown = false

    function step(t) {
        $time_offset = t * $orb_speed

        if ($show_cn_directions) {
            window.requestAnimationFrame(step)
        }
    }

    $: if ($show_cn_directions) {
        window.requestAnimationFrame(step)
    }

    $: if ($create_start_node) {
        $create_start_node = false
        $start_node_id = $next_node_id
        let x =
            (Math.random() * canvas.clientWidth) / 2 + canvas.clientWidth / 8
        let y =
            (Math.random() * canvas.clientHeight) / 2 + canvas.clientHeight / 4
        const newnode = new Node(
            $next_node_id++,
            spring({ x, y }),
            spring({ x, y }),
            spring(0),
            spring(0)
        )
        addNode(newnode)
    }

    $: if ($create_end_node) {
        $create_end_node = false
        $end_node_id = $next_node_id
        let x =
            (Math.random() * canvas.clientWidth) / 2 + canvas.clientWidth / 8
        let y =
            (Math.random() * canvas.clientHeight) / 2 + canvas.clientHeight / 4
        const newnode = new Node(
            $next_node_id++,
            spring({ x, y }),
            spring({ x, y }),
            spring(0),
            spring(0)
        )
        addNode(newnode)
    }

    $: if ($mode !== 4) {
        $selected_cn_weight = -1
    }

    $: if ($mode !== 1) {
        $selected_node = -1
    }

    let addedScrollListener = false
    $: if (canvas && !addedScrollListener) {
        canvas.addEventListener(
            'wheel',
            (e) => {
                zoom.update((zm) =>
                    Math.min(Math.max(zm - e.deltaY * $zoom_multiplier, 0.4), 3)
                )
            },
            { passive: true }
        )
        addedScrollListener = true
    }

    let lastPos, totDistMoved
    function handleMousedown(e) {
        if ($selected_node === -1) {
            switch ($mode) {
                case 0:
                    if (!$clearing_canvas)
                        window.addEventListener(
                            'mouseup',
                            handleMouseupCreateNode
                        )
                default:
                    if ($selected_node === -1) {
                        $moving_canvas = true
                        totDistMoved = 0
                        lastPos = { x: e.clientX, y: e.clientY }
                        window.addEventListener('mousemove', handleMousemove)
                        window.addEventListener('mouseup', handleMouseupDefault)
                    }
            }
        }
    }

    function handleMousemove(e) {
        let coords = { x: e.clientX, y: e.clientY }
        let dx = coords.x - lastPos.x
        let dy = coords.y - lastPos.y
        lastPos = coords
        totDistMoved += dx * dx + dy * dy

        canvas_offsets.update((cvo) => ({
            x: cvo.x + dx / $zoom,
            y: cvo.y + dy / $zoom,
        }))
    }

    function handleMouseupDefault(e) {
        window.removeEventListener('mousemove', handleMousemove)
        window.removeEventListener('mouseup', handleMouseupDefault)
        $moving_canvas = false
    }

    function handleMouseupCreateNode(e) {
        if (totDistMoved <= nodecreatedeadzoneradius) {
            const pos = rc2c($zoom, $canvas_offsets, lastPos)
            const newnode = new Node(
                $next_node_id++,
                spring(pos),
                spring(pos),
                spring(0),
                spring(0)
            )
            addNode(newnode)
        }
        window.removeEventListener('mouseup', handleMouseupCreateNode)
    }

    const recalc = derived([visualising, algo_to_visualise], ([vis, algo]) => [
        vis,
        algo,
    ])

    let unsubscribeprevalgo = () => {}
    let c_startid, c_endid
    tryResetRandomStartAndEnd(get(nodes))

    function tryResetRandomStartAndEnd(ns) {
        const sni = get(start_node_id),
            eni = get(end_node_id)
        if (ns.find((node) => node.id === sni)) c_startid = sni
        else if (!ns.find((node) => node.id === c_startid) && ns.length) {
            c_startid = ns[Math.floor(Math.random() * ns.length)].id
        }

        if (ns.find((node) => node.id === eni)) c_endid = eni
        else if (!ns.find((node) => node.id === c_endid) && ns.length > 1) {
            do {
                c_endid = ns[Math.floor(Math.random() * ns.length)].id
            } while (c_endid === c_startid)
        } else if (ns.length <= 1) {
            c_endid = c_startid
        }
    }

    function fullResetStartAndEnd(ns) {
        const sni = get(start_node_id),
            eni = get(end_node_id)
        if (ns.find((node) => node.id === sni)) c_startid = sni
        else if (ns.length) {
            c_startid = ns[Math.floor(Math.random() * ns.length)].id
        }

        if (ns.find((node) => node.id === eni)) c_endid = eni
        else if (ns.length > 1) {
            do {
                c_endid = ns[Math.floor(Math.random() * ns.length)].id
            } while (c_endid === c_startid)
        } else if (ns.length <= 1) {
            c_endid = c_startid
        }
    }

    recalc.subscribe(([vis, algo]) => {
        if (vis && algo >= 0 && algo <= 10) {
            let algofn = () => {}
            switch (algo) {
                case 0:
                    algofn = calcDFS
                    break
                case 1:
                    algofn = calcBFS
                    break
                case 2:
                    algofn = calcDijkstra
                    break
                case 3:
                    algofn = calcBiDijkstra
                    break
                case 4:
                    algofn = calcAStar
                    break
                case 5:
                    algofn = calcTopDFS
                    break
                case 6:
                    algofn = calcTopKhan
                    break
                case 7:
                    algofn = calcKosaraju
                    break
                case 8:
                    algofn = calcTarjan
                    break
                case 9:
                    algofn = calcHamiltonian
                    break
                case 10:
                    algofn = calcTS
                    break
            }
            unsubscribeprevalgo()

            fullResetStartAndEnd(get(nodes))

            recalculate_vis.set(true)

            unsubscribeprevalgo = recalculate_vis.subscribe((recalc) => {
                if (recalc) {
                    const sni = get(start_node_id)
                    const eni = get(end_node_id)
                    const ns = get(nodes)
                    const cns = get(connections)

                    tryResetRandomStartAndEnd(ns)

                    if (ns.length)
                        algofn(ns, cns, c_startid, c_endid, eni === -1)

                    recalculate_vis.set(false)
                }
            })

            playVisualisation()
        } else if (!vis) {
            visual_progress_step_count.set(1)
            resetAnimations(true)
            unsubscribeprevalgo()
            unsubscribeprevalgo = () => {}
        }
    })
</script>

<style>
    svg {
        margin: 0;
        width: 100%;
        height: 100%;
    }

    .weight-edit-input {
        display: block;
        position: absolute;
        top: 15%;
    }
</style>

{#if $mode === 4}
    {#each $connections as c (c.id)}
        <WeightEditor bind:c />
    {/each}
{/if}
<!--<StackVis />!-->
<svg
    bind:this={canvas}
    id="canvas"
    style="background-color: {$colors.nord0}"
    on:mousedown={handleMousedown}
    onscroll="console.log">
    {#each $connections as c (c.id)}
        <GraphConnection bind:c />
    {/each}
    {#each $nodes as n (n.id)}
        <GraphNode bind:n />
    {/each}
</svg>
