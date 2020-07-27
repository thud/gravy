<script>
	import { spring, tweened } from "svelte/motion";
	import { fade } from "svelte/transition";
	import { time_offset, selected_node, nodes, orb_number, orb_speed, connections, mode, show_cn_weights, show_cn_directions, selected_cn_weight, colors } from "../model/State.js";
	export let c;

	let lengthTween = c.lengthTween;
	let startNodePos;
	let endNodePos;

	if ($nodes.find(node => node.id === c.idA) && $nodes.find(node => node.id === c.idB)) { // check if connection is legit before creating
		startNodePos = $nodes.find(node => node.id === c.idA).posSpringA;
		endNodePos = $nodes.find(node => node.id === c.idB).posSpringA;
		lengthTween.update($lengthTween => 1);
	}
	else {
		c.kill = true;
	}

	let alreadykilling = false;
	$: if (c && c.kill && !alreadykilling) {
		lengthTween.update($lengthTween => 0);
		let nodea = $nodes.find(node => node.id === c.idA);
		let nodeb = $nodes.find(node => node.id === c.idB);
		if (nodea) {
			nodea.direct_cn.delete(c.id);
			nodea.indirect_cn.delete(c.id);
		}
		if (nodeb) {
			nodeb.direct_cn.delete(c.id);
			nodeb.indirect_cn.delete(c.id);
		}
		alreadykilling = true;
	}

	$: if ($lengthTween <= 0 && c.kill) {
		$connections = $connections.filter(cn => cn.id !== c.id);
	}

	function handleMousedown(e) {
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

	const getXFromD = d => (1-d*$lengthTween) * $startNodePos.x + d * $lengthTween * $endNodePos.x;
	const getYFromD = d => (1-d*$lengthTween) * $startNodePos.y + d * $lengthTween * $endNodePos.y;

	const undirected = (orb, orbs_length, t) => Math.abs((t+2*orb/orbs_length)%2-1);
	const directedA = (orb, orbs_length, t) => (t+orb/orbs_length)%1;
	const directedB = (orb, orbs_length, t) => 1-(t+orb/orbs_length)%1;

	let getD = undirected;

	$: if (c.settingDirection && !c.kill) {
		let nodea = $nodes.find(node => node.id === c.idA);
		let nodeb = $nodes.find(node => node.id === c.idB);
		nodea.direct_cn.delete(c.id);
		nodea.indirect_cn.delete(c.id);
		nodeb.direct_cn.delete(c.id);
		nodeb.indirect_cn.delete(c.id);

		switch (c.directionCounter) {
			case 0:
				nodea.direct_cn.add(c.id);
				nodeb.direct_cn.add(c.id);
				getD = undirected;
				break;
			case 1:
				nodea.direct_cn.add(c.id);
				nodeb.indirect_cn.add(c.id);
				getD = directedA;
				break;
			case 2:
				nodea.indirect_cn.add(c.id);
				nodeb.direct_cn.add(c.id);
				getD = directedB;
				break;
		}

		c.settingDirection = false;
		c.directionCounter++;
		c.directionCounter%=3;
	}

	$: c.centerX = (1-.5*$lengthTween) * $startNodePos.x + .5 * $lengthTween * $endNodePos.x;
	$: c.centerY = (1-.5*$lengthTween) * $startNodePos.y + .5 * $lengthTween * $endNodePos.y;

	$: grad = ($endNodePos.y-$startNodePos.y)/($endNodePos.x-$startNodePos.x);

	$: orbs = Array.from(Array($orb_number).keys());
</script>

<style>
	text {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		font-family: "Inter", sans-serif;
		font-size: 16px;
		font-weight: bold;
	}

	.cn-weight-text {
		text-anchor: middle;
	}
</style>


<line
	on:mousedown={handleMousedown}
	x1={$startNodePos.x}
	y1={$startNodePos.y}
	x2={(1 - $lengthTween) * $startNodePos.x + $lengthTween * $endNodePos.x}
	y2={(1 - $lengthTween) * $startNodePos.y + $lengthTween * $endNodePos.y}
	style="stroke:{$colors.nord10}; stroke-width:15; {$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}" />

{#if $show_cn_directions && !c.kill}
	{#each orbs as orb (orb)}
		<circle
			on:mousedown={handleMousedown}
			style="{$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}"
			transition:fade={{duration:200}}
			r=5
			fill={$colors.nord9}
			cx={getXFromD(getD(orb,orbs.length,$time_offset))}
			cy={getYFromD(getD(orb,orbs.length,$time_offset))} />
	{/each}
{/if}

{#if $show_cn_weights && !c.kill}
	<text
		on:mousedown={handleMousedown}
		transition:fade
		fill="{$colors.nord4}"
		class="cn-weight-text"
		style="{$mode === 3 || $mode === 5 ? 'cursor: pointer' : ''}"
		x="{c.centerX}"
		y="{c.centerY+6}">
		{c.weight}
	</text>
{/if}
