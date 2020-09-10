<script lang="ts">
    import { fade } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';
    import {
        vte_show,
        vte_text,
        vte_temp_nnodes,
        vte_nnodes,
        vte_directed,
        vte_textvalid,
        vte_livemode,
        vte_outdated,
        nodes,
        clearing_canvas,
        connections,
        colors,
    } from '../model/State';
    import { getCurrentVTE, applyVTE } from '../utils/Utils';
	import { clearCanvas } from "../utils/Generate";

    $vte_temp_nnodes = $vte_nnodes.toString();
    let isvalid_nnodes_input = true;
	let keepTextWhileClearing = false;
	let regenQueued = false;

    function parseValid() {
        const valid_nnodes = parseInt($vte_temp_nnodes);
        if (isNaN(valid_nnodes) || valid_nnodes < 0) {
            isvalid_nnodes_input = false;
            return;
        }
        isvalid_nnodes_input = true;
        $vte_nnodes = valid_nnodes;
        $vte_temp_nnodes = $vte_nnodes.toString();

        const news = $vte_text.trim();
        for (let u_v of news.split('\n')) {
            const u_v_split = u_v.trim().split(' ');
            if (!u_v_split[0]) continue;
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
                u === v ||
                u < 1 ||
                v < 1 ||
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

	export async function retryGenerateVTE() {
		if (regenQueued) return;
		console.log("regenerating");
		regenQueued = true;
		keepTextWhileClearing = true;
		await clearCanvas();
		keepTextWhileClearing = false;
		applyVTE();
		await new Promise(resolve => setTimeout(resolve, 500));
		regenQueued = false;
	}

    $: if ($vte_show) getCurrentVTE(true);

    nodes.subscribe(() => {
        getCurrentVTE(false);
    });
    connections.subscribe(() => {
        getCurrentVTE(false);
    });
    //recalculate_vis.subscribe(getCurrentVTE);

    $: if ($vte_livemode && $clearing_canvas && !keepTextWhileClearing) {
        $vte_text = '';
    }

    vte_directed.subscribe(_ => {
        parseValid();
    });
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
	.vte-directed,
	/*.vte-livemode,*/
	.vte-getcurrent,
	.vte-regenerate {
        height: 2rem;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: baseline;
        transition: background-color 0.3s ease-in-out;
    }

    /*.vte-livemode {
		font-size: 0.9rem;
		height: 3rem;
		text-align: left;
		justify-content: flex-start;
	}
	
	.vte-livemode em {
		font-size: 0.6rem;
	}*/

    .vte-getcurrent button,.vte-regenerate button {
        font-size: 0.8rem;
        font-weight: 600;
        width: 100%;
        padding: 0.2rem;
        cursor: pointer;
        border-radius: 1rem;
        border: 0.06rem solid grey;
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
        transition: background-color 0.3s ease-in-out;
        width: 4.4rem;
    }

    input:focus {
        outline: none;
        border-radius: 0.25rem;
    }

    textarea {
        width: 100%;
        height: calc(100% - 11.1rem);
        resize: none;
        border-radius: 0.5rem;
        border: none;
        transition: background-color 0.3s ease-in-out;
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
                class:text-outdated={$vte_outdated}
                bind:value={$vte_temp_nnodes}
                on:input={parseValid}
                style="background-color:{$vte_outdated ? $colors.nord4 : isvalid_nnodes_input ? $colors.nord6 : $colors.nord13};" />
        </div>
        <div class="vte-directed">
            <div>Directed</div>
            <input type="checkbox" bind:checked={$vte_directed} />
        </div>
        <div class="vte-getcurrent">
            <button
                on:click={() => {
                    getCurrentVTE(true);
                }}
                style="background-color:{$colors.nord6}">
                Grab Current Graph
            </button>
        </div>
        <!--<div class="vte-livemode">
			<div>Live Mode <em>(experimental)</em></div>
            <input
                type="checkbox"
                bind:checked={$vte_livemode} />
		</div>!-->
        <!-- prettier-ignore -->
        <textarea
            bind:value={$vte_text}
            on:input={parseValid}
			placeholder="u v [weight]
2 3
3 4 2..."
            style="background-color:{$vte_outdated ? $colors.nord4 : (isvalid_nnodes_input ? $colors.nord5 : $colors.nord13)};" />
        <!--<button on:click={applyVTE} />!-->
        <div class="vte-regenerate">
            <button
                on:click={() => {
                    retryGenerateVTE();
                }}
                style="background-color:{$colors.nord6}">
                Regenerate Graph
            </button>
        </div>
    </div>
{/if}
