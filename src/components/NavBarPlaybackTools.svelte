<script lang="ts">
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';
    import {
        visual_progress,
        visual_progress_step_count,
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
        top: calc(5% + 20px);
        right: 5%;
        padding: 3px 20px;
        padding-top: 33px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 180px;
        /*overflow: hidden;*/
    }

    button {
        cursor: pointer;
    }

    #button-play-pause {
        background-color: transparent;
        border: none;
    }

    #play {
        width: 10px;
    }
</style>

<div
    class="playback-tools-container"
    style="background-color:{$colors.nord5}; padding: {$heightTween * 43}px 20px
    {$heightTween * 3}px 20px;">
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
        <!--<svg version="1.1" id="pause" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
			 viewBox="0 0 477.867 477.867" style="enable-background:new 0 0 477.867 477.867;" xml:space="preserve">
			<g>
				<g>
					<path fill={$colors.nord0} d="M187.733,0H51.2c-9.426,0-17.067,7.641-17.067,17.067V460.8c0,9.426,7.641,17.067,17.067,17.067h136.533
						c9.426,0,17.067-7.641,17.067-17.067V17.067C204.8,7.641,197.159,0,187.733,0z"/>
				</g>
			</g>
			<g>
				<g>
					<path fill={$colors.nord0} d="M426.667,0H290.133c-9.426,0-17.067,7.641-17.067,17.067V460.8c0,9.426,7.641,17.067,17.067,17.067h136.533
						c9.426,0,17.067-7.641,17.067-17.067V17.067C443.733,7.641,436.092,0,426.667,0z"/>
				</g>
			</g>
		</svg>!-->
    </button>
    <button
        on:click={() => {
            visual_progress.set(Math.min(1, $visual_progress + 1 / $visual_progress_step_count), undefined);
        }} />
    <input
        type="range"
        min="0"
        max="1"
        step="0.0001"
        bind:value={$visual_progress} />
</div>
<!--
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 477.867 477.867" style="enable-background:new 0 0 477.867 477.867;" xml:space="preserve">
<g>
	<g>
		<path d="M187.733,0H51.2c-9.426,0-17.067,7.641-17.067,17.067V460.8c0,9.426,7.641,17.067,17.067,17.067h136.533
			c9.426,0,17.067-7.641,17.067-17.067V17.067C204.8,7.641,197.159,0,187.733,0z"/>
	</g>
</g>
<g>
	<g>
		<path d="M426.667,0H290.133c-9.426,0-17.067,7.641-17.067,17.067V460.8c0,9.426,7.641,17.067,17.067,17.067h136.533
			c9.426,0,17.067-7.641,17.067-17.067V17.067C443.733,7.641,436.092,0,426.667,0z"/>
	</g>
</g>
</svg>!-->
