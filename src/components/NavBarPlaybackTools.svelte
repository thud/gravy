<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';
    import {
        visual_progress,
        //visual_progress_step_count,
        visualising,
        colors,
    } from '../model/State';
    import { playVisualisation } from '../utils/Utils';

    const heightTween = tweened(0, { duration: 400, easing: cubicInOut });

    visualising.subscribe(vis => heightTween.set(vis ? 1 : 0, undefined));
</script>

<style>
    .playback-tools-container {
        position: fixed;
        top: calc(5% + 1.25rem);
        right: 5%;
        padding: 0.25rem 1.25rem;
        padding-top: 2.1rem;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 10.1rem;
    }

    button {
        cursor: pointer;
    }

    #button-play-pause {
        background-color: transparent;
        border: none;
    }

    #play {
        width: 0.6rem;
    }
</style>

<div
    class="playback-tools-container"
    style="background-color:{$colors.nord5}; padding: {$heightTween * 2.7}rem
    1.25rem {$heightTween * 0.2}rem 1.25rem;">
    <button id="button-play-pause" on:click={playVisualisation}>
        <svg
            version="1.1"
            id="play"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 320.001 320.001"
            style="enable-background:new 0 0 320.001 320.001;"
            xml:space="preserve">
            <path
                fill={$colors.nord0}
                d="M295.84,146.049l-256-144c-4.96-2.784-11.008-2.72-15.904,0.128C19.008,5.057,16,10.305,16,16.001v288
                c0,5.696,3.008,10.944,7.936,13.824c2.496,1.44,5.28,2.176,8.064,2.176c2.688,0,5.408-0.672,7.84-2.048l256-144
                c5.024-2.848,8.16-8.16,8.16-13.952S300.864,148.897,295.84,146.049z" />
        </svg>
    </button>
    <input
        type="range"
        min="0"
        max="1"
        step="0.0001"
        bind:value={$visual_progress} />
</div>
