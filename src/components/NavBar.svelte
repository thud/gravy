<script>
	import { nodes, connections, clearing_canvas, colors } from "../model/State.js";
	import { fade } from "svelte/transition";
	import { tweened } from "svelte/motion";
	//import { clearCanvas } from "../utils/ClearCanvas.svelte";
	import { clearCanvas, generatePseudoRandom, generatePerfect, generateBinaryTree } from "../utils/Generate.js";

	let selected_item = -1;

	let hover_algo_dropdown = false;
	let hover_gen_dropdown = false;

	function genMouseenter(e) {
		hover_gen_dropdown = true;
	}
	function genMouseleave(e) {
		hover_gen_dropdown = false;
	}

	function algoMouseenter(e) {
		hover_algo_dropdown = true;
	}
	function algoMouseleave(e) {
		hover_algo_dropdown = false;
	}

	function updatestate(fn) {
		return e => {
			fn(e);
			$nodes = $nodes;
			$connections = $connections;
		}
	}
			
</script>

<style>
	nav {
		position: fixed;
		width: 90%;
		height: 60px;
		top: 5%;
		left: 5%;
		padding: 0 20px;
		border-radius: 15px;
		overflow: hidden;
		box-sizing: border-box;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
	}

	nav li {
		float: right;
	}

	nav li.nav-left {
		float: left;
	}

	nav li a:not(#logo):hover {
		background-color: #2e34401a;
	}

	#logo {
		font-family: "Inter", sans-serif;
		font-weight: bold;
		text-decoration: none;
		text-align: center;
		font-size: 29.5px;
		padding: 6px;
		margin: 6px;
	}

	nav li a {
		font-family: "Inter", sans-serif;
		font-weight: 600;
		font-size: 16px;
		display: block;
		padding: 8px 12px;
		margin: 12px 6px;
		text-decoration: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
	}

	.dropdown-icon {
		width: 20px;
		float: right;
		-webkit-transition: -webkit-transform 0.3s ease-in-out;
		transition: transform 0.3s ease-in-out;
	}

	.dropdown-menu {
		min-width: 100px;
		height: 200px;
		background-color: white;
		position: fixed;
		top: calc(5% + 60px);
		border-radius: 0 0 5px 5px;
		border: grey solid;
		border-width: 0 1px 1px 1px;
		z-index: 1;
	}

	.dropdown-menu-algo {
		right: calc(5% + 115px);
	}

	.dropdown-menu-gen {
		right: calc(5% + 230px);
	}

	.dropdown-menu li {
		margin: 10px 13px;
	}

	.dropdown-menu a {
		width: 100%;
		height: 100%;
		text-align: center;
		font-family: "Inter", sans-serif;
		font-weight: 500;
		text-decoration: none;
		color: inherit;
	}

	a.disabled {
		pointer-events: none;
		cursor: pointer;
	}
</style>

<nav style="background-color:{$colors.nord5}">
	<ul>
		<li class="nav-left">
			<a id="logo" href="/" style="color:{$colors.nord1}">
				Graph Visualisation
			</a>
		</li>
		<li>
			<a
				class="visualise-button"
					   style="color:{$colors.nord1}; background-color: {$colors.nord14}"
					   on:click="{() => console.log('visualise!')}"
					   href="/#">
					   VISUALISE
			</a>
		</li>
		<li>
			<a
				href="/#"
					  style="color:{$colors.nord1}"
					  on:mouseenter={algoMouseenter}
					  on:mouseleave={algoMouseleave}>
				Algorithms
				<svg
					fill="currentColor"
					viewBox="0 0 20 20"
					class="dropdown-icon algo-dropdown-icon"
						   style={hover_algo_dropdown ? 'transform: rotate(180deg);-webkit-transform: rotate(180deg);' : ''}>
					<path
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414
							   1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
																				 clip-rule="evenodd" />
				</svg>

			</a>
		</li>
		<li>
			<a
				href="/#"
					  style="color:{$colors.nord1}"
					  on:mouseenter={genMouseenter}
					  on:mouseleave={genMouseleave}>
				Generate
				<svg
					fill="currentColor"
					viewBox="0 0 20 20"
					class="dropdown-icon gen-dropdown-icon"
						   style={hover_gen_dropdown ? 'transform: rotate(180deg);-webkit-transform: rotate(180deg);' : ''}>
					<path
						fill-rule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414
							   1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
																				 clip-rule="evenodd" />
				</svg>
			</a>
		</li>
	</ul>
</nav>

{#if hover_algo_dropdown}
	<div
		class="dropdown-menu dropdown-menu-algo"
			   style="background-color:{$colors.nord5}"
			   on:mouseenter={algoMouseenter}
			   on:mouseleave={algoMouseleave}
			   transition:fade={{ duration: 250 }}>
		<div class="dropdown-menu-content">
			<ul class="dropdown-menu-list; color={$colors.nord1};">
				<li>
					<a href="/#">Depth First Search</a>
				</li>
				<li>
					<a href="/#">Breadth First Search</a>
				</li>
				<li>
					<a href="/#">Convex Hull</a>
				</li>
			</ul>
		</div>
	</div>
{/if}

{#if hover_gen_dropdown}
	<div
		class="dropdown-menu dropdown-menu-gen"
			   style="background-color:{$colors.nord5}"
			   on:mouseenter={genMouseenter}
			   on:mouseleave={genMouseleave}
			   transition:fade={{ duration: 250 }}>
		<div class="dropdown-menu-content">
			<ul class="dropdown-menu-list; color={$colors.nord1};">
				<li>
					<a href="/#" on:click={clearCanvas} class:disabled={$clearing_canvas}>
						Clear Graph
					</a>
				</li>
				<li>
					<a href="/#" on:click={generatePseudoRandom} class:disabled={$clearing_canvas}>
						Generate Pseudo-Random
						<br />
						Arrangement
					</a>
				</li>
				<li>
					<a href="/#" on:click={generatePerfect} class:disabled={$clearing_canvas}>
						Generate Perfect Graph
					</a>
				</li>
				<!--<li>
					<a href="/#" on:click={generateBinaryTree} class:disabled={$clearing_canvas}>
						Generate Binary Tree
					</a>
				</li>--!>
			</ul>
		</div>
	</div>
{/if}
