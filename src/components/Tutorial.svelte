<script lang="ts">
    import { tutorial_open, colors } from '../model/State';
	import { fade } from "svelte/transition";
	import { expoInOut } from "svelte/easing";

    let stage = 0;

    const tips = [
        [
            'Welcome to <strong>Gravy</strong> (short for graph visualisation, I guess?).<br>Gravy is a toy that allows you to generate graphs and visualise some common graph-based algorithms.',
            '/#',
        ],
        [
            'To generate a common type of graph, use the <em>Generate</em> dropdown in the top navbar. You can zoom in and out with the scroll wheel, and pan around by dragging. on empty space.',
            '/#',
        ],
        [
            'To create your own graph, you can use the <em>toolbar</em> in the bottom right. Here, you can choose from several modes which allow you to create/delete nodes and edges.',
            '/#',
        ],
        [
            'All edges have an associated <strong>weight</strong> and <strong>direction</strong>. These come in to play when visualising algorithms. To change or hide them, you can use options in the toolbar.',
            '/#',
        ],
        [
            'To actually visualise an algorithm, select it in the <em>Algorithms</em> dropdown in the top navbar. Then press the <em>VISUALISE</em> button next to it. You can use the playback tools to play or scroll through a visualisation. The visualisation will recalculate as you play with the graph so give that a try and have fun!',
            '/#',
        ],
    ];

    let tip: String = 'Loading...',
        imgUrl: String = 'Loading...';
    $: [tip, imgUrl] = tips[stage];
</script>

<style>
    .tutorial-container {
        position: absolute;
        display: flex;
        align-items: stretch;
        flex-direction: column;
        top: calc(50% - 300px);
        left: calc(50% - 300px);
        right: calc(50% - 300px);
        bottom: calc(50% - 300px);
        border: 1px solid grey;
        border-radius: 8px;
        box-sizing: border-box;
        padding: 20px;
    }

    .tutorial-close {
        position: absolute;
        top: 0;
        right: 10px;
        cursor: pointer;
        font-weight: 700;
        font-size: 30px;
    }

    .tutorial-title {
        font-family: Inter, sans-serif;
        font-size: 30px;
        font-weight: 700;
        margin-bottom: 10px;
    }

    .tutorial-progressdots-container {
        margin-top: auto;
    }

    .tutorial-progressdot {
        border-radius: 100%;
        width: 10px;
        height: 10px;
        display: inline-block;
        margin: 5px;
        transition: background-color 0.3s ease-in-out;
    }
</style>

{#if $tutorial_open}
	<div
		class="tutorial-container"
		style="background-color:{$colors.nord5};"
		transition:fade={{ duration: 500, easing: expoInOut }}>
        <div
            class="tutorial-close"
            on:click={() => {
                $tutorial_open = false;
            }}>
            x
        </div>
        <div class="tutorial-title" style="color:{$colors.nord0}">Tutorial</div>
        <div class="tutorial-tip">
            {@html tip}
        </div>
        <!--<img class="tutorial-img" />-->
        <div class="tutorial-progressdots-container">
            {#each tips as _ctip, i}
                <div
                    class="tutorial-progressdot"
                    style="background-color:{i === stage ? $colors.nord0 : 'grey'};"
                    on:click={() => {
                        stage = i;
                    }} />
            {/each}
        </div>
    </div>
{/if}
