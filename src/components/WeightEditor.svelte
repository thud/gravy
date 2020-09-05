<script lang="ts">
    import { recalculate_vis, zoom, colors } from '../model/State';
    import type Connection from '../model/Connection';

    export let c: Connection;
    $: centerPos = c.centerPos;
    let input_field: any;
    let new_weight_temp = c.weight.toString();

    let valid_new_weight = true;

    $: if (parseFloat(new_weight_temp)) {
        valid_new_weight = true;
        c.weight = parseFloat(new_weight_temp);
        recalculate_vis.set(true);
    } else {
        valid_new_weight = false;
    }
</script>

<style>
    div {
        position: fixed;
    }

    input {
        box-sizing: border-box;
        text-align: center;
        border-radius: 20.5%/50%;
        border: none !important;
        transition: border-radius 0.3s ease-in-out;
        font-family: 'Inter', sans-serif;
        font-weight: bold;
    }

    input:focus {
        outline: none;
        border-radius: 5%/12.5%;
    }
</style>

{#if centerPos !== null}
    <div
        style="top: calc({$centerPos.y}px - {0.9375 * $zoom}rem); left: calc({$centerPos.x}px
        - {2.1875 * $zoom}rem);">
        <input
            style="background-color: {valid_new_weight ? $colors.nord5 : $colors.nord13};
            width: {4.4 * $zoom}rem; height: {1.8 * $zoom}rem; padding: {0.25 * $zoom}rem
            {0.06 * $zoom}rem; font-size: {$zoom}rem"
            bind:value={new_weight_temp}
            bind:this={input_field} />
    </div>
{/if}
