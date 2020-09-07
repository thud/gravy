<script lang="ts">
    import { fade } from 'svelte/transition';
    import { writable } from 'svelte/store';
    import { cubicInOut } from 'svelte/easing';
    import {
        vte_show,
        vte_text,
        vte_nnodes,
        vte_directed,
        vte_textvalid,
        nodes,
        connections,
        colors,
    } from '../model/State';
    import { applyVTE } from '../utils/Utils';

    function parseValid() {
        const news = $vte_text.trim();
        for (let u_v of news.split('\n')) {
            const u_v_split = u_v.trim().split(' ');
            if (u_v_split.length != 2 && u_v_split.length != 3) {
                $vte_textvalid = false;
                return false;
            }
            let us: string, vs: string, ws: string;
            let w: number;
            if (u_v_split.length == 2) [us, vs] = u_v_split;
            else {
                [us, vs, ws] = u_v_split;
                w = parseFloat(ws);
                if (isNaN(w)) {
                    $vte_textvalid = false;
                    return false;
                }
            }

            const u = parseInt(us);
            const v = parseInt(vs);
            if (isNaN(u) || isNaN(v) || !u || !v) {
                $vte_textvalid = false;
                return false;
            }
            if (
                u == v ||
                u <= 0 ||
                v <= 0 ||
                u > $vte_nnodes ||
                v > $vte_nnodes
            ) {
                $vte_textvalid = false;
                return false;
            }
        }
        $vte_textvalid = true;
        applyVTE();
        return true;
    }
</script>

<style>
    .vte-container {
        position: absolute;
        bottom: calc(5% + 5rem);
        left: 5%;
        width: 10rem;
        height: 45%;
        border-radius: 0.6rem;
        padding: 1rem;
    }

    .vte-title {
        text-align: left;
        font-weight: 700;
        font-size: 1.6rem;
        margin-bottom: 0.5rem;
    }

    .vte-nnodes,
    .vte-directed {
        height: 2rem;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
    }

    input {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 0.9rem;
        text-align: center;
        box-sizing: border-box;
        margin: 0 0.6rem;
        padding: 0.25rem 0.06rem;
        border-radius: 1rem;
        border: 0.06rem solid grey;
        transition: border-radius 0.3s ease-in-out;
        width: 4.4rem;
    }

    input:focus {
        outline: none;
        border-radius: 0.25rem;
    }

    textarea {
        width: 100%;
        height: calc(100% - 6.1rem);
        resize: none;
        border-radius: 0.5rem;
        border: none;
    }
</style>

{#if $vte_show}
    <div
        transition:fade={{ delay: 0, duration: 300, easing: cubicInOut }}
        class="vte-container"
        style="background-color:{$colors.nord5};">
        <div class="vte-title">Editor</div>
        <div class="vte-nnodes">
            <div>Nodes</div>
            <input
                class="vte-nnodes-input"
                bind:value={$vte_nnodes}
                on:input={parseValid} />
        </div>
        <div class="vte-directed">
            <div>Directed</div>
            <input
                type="checkbox"
                bind:checked={$vte_directed}
                on:input={parseValid} />
        </div>
        <textarea
            bind:value={$vte_text}
            on:input={parseValid}
            style="background-color:{$vte_textvalid ? $colors.nord5 : $colors.nord13};" />
    </div>
{/if}
