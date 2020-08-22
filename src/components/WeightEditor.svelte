<script>
    import { recalculate_vis, colors } from '../model/State.js'

    export let c
    let input_field
    let new_weight_temp = c.weight.toString()

    let valid_new_weight = true

    $: if (parseFloat(new_weight_temp)) {
        valid_new_weight = true
        c.weight = parseFloat(new_weight_temp)
        recalculate_vis.set(true)
    } else {
        valid_new_weight = false
    }
</script>

<style>
    div {
        position: fixed;
    }

    input {
        width: 70px;
        height: 29px;
        padding: 5px 1px;
        box-sizing: border-box;
        text-align: center;
        border-radius: 15px;
        transition: border-radius 0.3s ease-in-out;
        font-family: 'Inter', sans-serif;
        font-weight: bold;
    }

    textarea:focus,
    input:focus {
        outline: none;
        border-radius: 5px;
    }
</style>

<div style="top: {c.centerY - 15}px; left: {c.centerX - 35}px;">
    <input
        style="background-color: {valid_new_weight ? $colors.nord5 : $colors.nord13};"
        bind:value={new_weight_temp}
        bind:this={input_field} />
</div>
