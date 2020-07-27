<script>
	import { fade } from "svelte/transition";
	import { spring } from "svelte/motion";
	import { nodes, connections, selected_node, show_node_labels, next_cn_id, default_cn_weight, start_node_id, end_node_id, mode, colors } from "../model/State";
	import Connection from '../model/Connection';
	//import movable from "./Movable";
	export let n;
	let sizes = [20, 13];

	let posSpringA = n.posSpringA;
	let posSpringB = n.posSpringB;
	let sizeSpringA = n.sizeSpringA;
	let sizeSpringB = n.sizeSpringB;

	$: if (!n.kill && $selected_node != n.id) {
		n.posSpringA.stiffness = 0.1;
		n.posSpringB.stiffness = 0.05;
		n.posSpringB.damping = 0.1;
		sizeSpringA.update(() => sizes[0]);
		sizeSpringB.update(() => sizes[1]);
	} else if (!n.kill) {
		n.posSpringA.stiffness = 0.3;
		n.posSpringB.stiffness = 0.02;
		sizeSpringA.update(() => sizes[0] * 1.3);
		sizeSpringB.update(() => sizes[1] * 1.3);
	}

	function killConnections() {
		$connections = $connections.map(
			cn => {
				if (n.direct_cn.has(cn.id)) cn.kill = true;
				if (n.indirect_cn.has(cn.id)) cn.kill = true;
				return cn;
			}
		);
	}


	let alreadykilling = false;
	$: if (n.kill && !alreadykilling) {
		sizeSpringA.update($sizeSpringA => 0);
		sizeSpringB.update($sizeSpringB => 0);
		/*n.direct_cn.forEach(
			cnid => {
				let nodeid = $connections.find(cn => cn.id === cnid).idB;
				$nodes.find(node => node.id === nodeid).indirect_cn.delete(cnid);
			}
		);
		n.indirect_cn.forEach(
			cnid => {
				let nodeid = $connections.find(cn => cn.id === cnid).idA;
				$nodes.find(node => node.id === nodeid).direct_cn.delete(cnid);
			}
		);*/
		killConnections();
		alreadykilling = true;
	}

	$: if (n.kill && $sizeSpringA <= 0 && $sizeSpringB <= 0) {
		killConnections(); // Extra safety
		console.log($nodes);
		$nodes = $nodes.filter(node => node.id !== n.id);
	}

	let lastPos;

	function handleMousedown(e) {
		switch ($mode) {
			case 0: // move node
				$selected_node = n.id;
				lastPos = $posSpringA;

				window.addEventListener("mousemove", handleMousemove);
				window.addEventListener("mouseup", handleMouseup);
				break;
			case 1: // create edge
				let alreadyCreated = false;
				n.direct_cn.forEach(
					cnid => {
						let cn = $connections.find(cn => cn.id === cnid);
						if (cn.idA === $selected_node || cn.idB === $selected_node) {
							alreadyCreated = true;
						}
					}
				);
				if (!alreadyCreated) {
					n.indirect_cn.forEach(
						cnid => {
							let cn = $connections.find(cn => cn.id === cnid);
							if (cn.idA === $selected_node || cn.idB === $selected_node) {
								alreadyCreated = true;
							}
						}
					);
				}
				if ($selected_node === -1 || alreadyCreated) {
					$selected_node = n.id;
				}
				else if ($selected_node != n.id) {
					let selected_node_index = $nodes.findIndex(node => node.id === $selected_node);
					$connections = [
						...$connections,
						new Connection($next_cn_id++, $selected_node, n.id, $default_cn_weight),
					];
					$selected_node = -1;
				}
				else {
					$selected_node = -1;
				}
				break;
			case 2: // delete node
				/*
				console.log("attempting to delete ", n.id);
				console.log(" connections to ", n.id, " = ", n.direct_cn, n.indirect_cn);
				console.log($nodes);
				*/

				n.kill = true;
				break;
			case 3:
				$connections = $connections.map(
					cn => {
						if (n.direct_cn.has(cn.id)) cn.kill = true;
						if (n.indirect_cn.has(cn.id)) cn.kill = true;
						return cn;
					}
				);
				n.direct_cn.clear();
				n.indirect_cn.clear();
				break;
			default:
				console.warn("default on switch");
				break;
		}
	}

	function handleMousemove(e) {
		if ($selected_node === n.id) {
			let dx = e.clientX - lastPos.x;
			let dy = e.clientY - lastPos.y;

			lastPos = { x: e.clientX, y: e.clientY };

			posSpringA.update($posSpringA => ({
				x: $posSpringA.x + dx,
				y: $posSpringA.y + dy
			}));
			posSpringB.update($posSpringB => ({
				x: $posSpringB.x + dx,
				y: $posSpringB.y + dy
			}));
		}
	}

	function handleMouseup(e) {
		$selected_node = -1;
		lastPos = $posSpringA;
		window.removeEventListener("mousemove", handleMousemove);
		window.removeEventListener("mouseup", handleMouseup);
	}

	let outerFill = $colors.nord10;
	let innerFill = $colors.nord9;
	//$: console.log("start_node_id", $start_node_id);
	$: if ($selected_node === n.id) {
		outerFill = $colors.nord9;
		innerFill = $colors.nord7;
		if ($start_node_id === n.id) {
			outerFill = $colors.nord15;
			innerFill = $colors.nord5;
		}
		else if ($end_node_id === n.id) {
			outerFill = $colors.nord12;
			innerFill = $colors.nord5;
		}
	} else {
		outerFill = $colors.nord10;
		innerFill = $colors.nord9;
		if ($start_node_id === n.id) {
			outerFill = $colors.nord14;
			innerFill = $colors.nord5;
		}
		if ($end_node_id === n.id) {
			outerFill = $colors.nord11;
			innerFill = $colors.nord5;
		}
	}
</script>

<style>
  text {
	  font-family: "Inter", sans-serif;
	  font-weight: bold;
	  text-anchor: middle;
	  dominant-baseline: middle;
	  cursor: move;
	  -webkit-touch-callout: none;
	  -webkit-user-select:none;
	  -khtml-user-select:none;
	  -moz-user-select:none;
	  -ms-user-select:none;
	  -o-user-select:none;
	  user-select:none;
  }
</style>

<circle
   on:mousedown={handleMousedown}
	style="fill:{outerFill};
		   {$mode === 0 ? 'cursor: move;' : ''}
		   {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
	cx={$posSpringA.x}
	cy={$posSpringA.y}
	r={Math.max(0, $sizeSpringA)} />
<circle
	on:mousedown={handleMousedown}
	style="fill:{innerFill};
		   {$mode === 0 ? 'cursor: move;' : ''}
		   {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
	cx={$posSpringB.x}
	cy={$posSpringB.y}
	r={Math.max(0, $sizeSpringB)} />

{#if $show_node_labels && !n.kill}
	<text
		on:mousedown={handleMousedown}
		transition:fade={{duration: 150}}
		style="fill:{$colors.nord5};
			   {$mode === 0 ? 'cursor: move;' : ''}
			   {$mode === 1 || $mode === 2 || $mode === 3 ? 'cursor: pointer;' : ''}"
		x={$posSpringB.x}
		y={$posSpringB.y+2}>
		{n.id}
	</text>
{/if}
