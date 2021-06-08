<script lang="ts">
    import { tutorial_open, colors } from '../model/State';
    import { fade } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';

    let stage = 0;

    const tips: [string, ...[string, string][]][] = [
        [
            'Welcome to <strong>Gravy</strong> (short for <strong>gra</strong>ph <strong>v</strong>isualisation, I guess?).<br>Gravy is a toy that allows you to generate graphs and visualise some common graph-based algorithms.',
            ['/images/example.png', 'screenshot demo image'],
        ],
        [
            'To generate a common type of graph, use the <em>Generate</em> dropdown in the top navbar. You can zoom in and out with the scroll wheel, and pan around by dragging. on empty space.',
            ['/images/gendropdown.png', 'screenshot of "Generate" dropdown'],
        ],
        [
            'To create your own graph, you can use the <em>toolbar</em> in the bottom right. Here, you can choose from several modes which allow you to create/delete nodes and edges.',
            ['/images/toolbar1.png', 'screenshot of toolbar'],
        ],
        [
            'All edges have an associated <strong>weight</strong> and <strong>direction</strong>. These come in to play when visualising algorithms. To change or hide them, you can use options in the toolbar.',
            ['/images/toolbar2.png', "screenshot of toolbar's view options"],
        ],
        [
            'To actually visualise an algorithm, select it in the <em>Algorithms</em> dropdown in the top navbar. Then press the <em>VISUALISE</em> button next to it. You can use the playback tools to play or scroll through a visualisation. The visualisation will recalculate as you play with the graph so give that a try and have fun!',
            ['/images/algodropdown.png', 'screenshot of "Algorithms" dropdown'],
            ['/images/playbacktools.png', 'screenshot of playback tools'],
        ],
    ];

    let tip: string = 'Loading...',
        imgs: [string, string][] = [];
    $: [tip, ...imgs] = tips[stage];

</script>

<style>
    .tutorial-container {
        position: absolute;
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        flex-direction: column;
        top: max(calc(50% - 30rem), 7%);
        left: max(calc(50% - 30rem), 7%);
        right: max(calc(50% - 30rem), 7%);
        bottom: max(calc(50% - 30rem), 7%);
        border: 0.05rem solid grey;
        border-radius: 0.75rem;
        box-sizing: border-box;
        padding: 1rem;
    }

    .tutorial-close {
        position: absolute;
        top: 0;
        right: 1rem;
        cursor: pointer;
        font-weight: 700;
        font-size: 2rem;
    }

    .tutorial-title {
        font-family: Inter, sans-serif;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }

    .tutorial-imgs-container {
        box-sizing: border-box;
        padding: 1rem;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
    }

    .tutorial-img {
        max-width: 100%;
        border-radius: 0.5rem;
    }

    .tutorial-progressdot {
        border-radius: 100%;
        width: 0.8rem;
        height: 0.8rem;
        display: inline-block;
        margin: 0.4rem;
        transition: background-color 0.3s ease-in-out;
        cursor: pointer;
    }

    button {
        font-family: Inter, sans-serif;
        font-weight: 700;
        text-align: center;
        border-radius: 0.5rem;
        width: 7rem;
        cursor: pointer;
        border: none !important;
    }

    .tutorial-footer {
        display: flex;
        flex-direction: row-reverse;
        margin-top: 1rem;
        margin-left: 1rem;
        margin-right: 1rem;
        justify-content: space-between;
        align-content: flex-end;
    }

</style>

{#if $tutorial_open}
    <div
        class="tutorial-container"
        style="background-color:{$colors.nord5};"
        transition:fade={{ delay: 0, duration: 500, easing: cubicInOut }}>
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
        <div class="tutorial-imgs-container">
            {#each imgs as [src, alt]}
                <img
                    class="tutorial-img"
                    {src}
                    {alt}
                    style="max-height: {100 / imgs.length - 5}%;" />
            {/each}
        </div>

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

        <div class="tutorial-footer">
            <button
                style="background-color:{$colors.nord14};color:{$colors.nord0};"
                on:click={() => {
                    if (++stage === tips.length) {
                        tutorial_open.set(false);
                        stage--;
                    }
                }}>
                {stage === tips.length - 1 ? 'START' : 'NEXT'}
            </button>
            {#if stage > 0}
                <button
                    style="background-color:{$colors.nord11};color:{$colors.nord5};"
                    on:click={() => {
                        stage--;
                    }}>
                    PREVIOUS
                </button>
            {/if}
        </div>
    </div>
{/if}
