<script>
	import GraphNode from "./GraphNode.svelte";
	import GraphConnection from "./GraphConnection.svelte";
	import Toolbar from "./Toolbar.svelte";
	import WeightEditor from "./WeightEditor.svelte";
	import Node from "../model/Node.js";
	import { time_offset, nodes, next_node_id, orb_speed, orb_number, connections, show_cn_directions, selected_node, selected_cn_weight, create_start_node, create_end_node, start_node_id, end_node_id, clearing_canvas, colors, mode } from "../model/State.js";
	import { tweened, spring } from "svelte/motion";

	let canvas;
	let mousedown = false;

	//$: console.log($nodes); $: console.log($connections);

	function step(t) {
		$time_offset = t*$orb_speed;

		if ($show_cn_directions) {
			window.requestAnimationFrame(step);
		}
	}

	$: if ($show_cn_directions) {
		window.requestAnimationFrame(step);
	}

	$: if ($create_start_node) {
	$create_start_node = false;
	$start_node_id = $next_node_id;
	let x = (Math.random()*canvas.clientWidth/2)+canvas.clientWidth/8;
	let y = (Math.random()*canvas.clientHeight/2)+canvas.clientHeight/4;
	$nodes = [
		...$nodes,
		new Node(
			$next_node_id++,
			spring({ x, y }),
			spring({ x, y }),
			spring(0),
			spring(0)
		)
	];
	}

	$: if ($create_end_node) {
		$create_end_node = false;
		$end_node_id = $next_node_id;
		let x = (Math.random()*canvas.clientWidth/2)+canvas.clientWidth/8;
		let y = (Math.random()*canvas.clientHeight/2)+canvas.clientHeight/4;
		$nodes = [
			...$nodes,
			new Node(
				$next_node_id++,
				spring({ x, y }),
				spring({ x, y }),
				spring(0),
				spring(0)
			)
		];
	}

	$: if ($mode !== 4) {
		$selected_cn_weight = -1;
	}

		$: if ($mode !== 1) {
		$selected_node = -1;
	}

	function handleMousedown(e) {
		switch ($mode) {
			case 0:
				if ($clearing_canvas) break;
				if ($selected_node === -1) {
					$nodes = [
						...$nodes,
						new Node(
							$next_node_id++,
							spring({ x: e.clientX, y: e.clientY }),
							spring({ x: e.clientX, y: e.clientY }),
							spring(0),
							spring(0)
						)
					];
				}
				break;
		}
	}
</script>

<style>
	svg {
		margin: 0;
		width: 100%;
		height: 100%;
	}

	.toolbar-label {
		font-family: "Inter", sans-serif;
		font-size: 25px;
		font-weight: bold;
		top: calc(95% - 380px);
		left: calc(95% - 280px);
		position: fixed;
	}

	.weight-edit-input {
		display: block;
		position: absolute;
		top: 15%;
	}
</style>

<Toolbar />
{#if $mode === 4}
	{#each $connections as c (c.id)}
		<WeightEditor bind:c />
	{/each}
{/if}
<svg bind:this={canvas} id="canvas" style="background-color: {$colors.nord0}" on:mousedown={handleMousedown}>
	{#each $connections as c (c.id)}
		<GraphConnection bind:c />
	{/each}
	{#each $nodes as n (n.id)}
		<GraphNode bind:n />
	{/each}
</svg>
