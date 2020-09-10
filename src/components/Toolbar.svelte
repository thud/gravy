<script lang="ts">
    import {
        colors,
        connections,
        toolbar_visible,
        show_cn_weights,
        show_cn_directions,
        default_cn_weight,
        orb_number,
        orb_speed,
        mode,
        vte_show,
    } from '../model/State';
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';
    import { addStartVertex, addEndVertex } from '../utils/Utils';

    let maxheight = 50;

    let heightTween = tweened(maxheight, { duration: 400, easing: cubicInOut });

    let toolbar_div: any;
    function onClickToggleToolbar() {
        toolbar_visible.update(tv => !tv);

        if ($toolbar_visible) {
            heightTween.set(maxheight, undefined);
        } else {
            heightTween.set(0, undefined);
            toolbar_div.scrollTop = 0;
        }
    }

    function handleClickMode(m: number) {
        return () => {
            $mode = m;
        };
    }

    function handleClickView(m: number) {
        switch (m) {
            case 0:
                return () => {
                    $show_cn_weights = !$show_cn_weights;
                };
            case 1:
                return () => {
                    $show_cn_directions = !$show_cn_directions;
                };
        }
    }

    let default_cn_weight_temp = $default_cn_weight.toString();
    let valid_default_cn_weight = true;
    $: if (parseFloat(default_cn_weight_temp)) {
        valid_default_cn_weight = true;
        $default_cn_weight = parseFloat(default_cn_weight_temp);
    } else {
        valid_default_cn_weight = false;
    }
</script>

<style>
    .toolbar-container {
        position: fixed;
        left: calc(95% - 18.75rem);
        bottom: 5%;
        width: 18.75rem;
        max-height: 62rem;
        border-radius: 0.6rem;
        padding: 0.6rem;
        box-sizing: border-box;
        margin: 0;
        overflow: hidden;
        text-align: center;
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
    }

    .toolbar-container::-webkit-scrollbar {
        display: none;
    }

    .toolbar-label {
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 1.6rem;
        text-align: left;
        margin: 0.25rem;
        cursor: pointer;
    }

    .dropdown-icon {
        width: 2rem;
        float: right;
        -webkit-transition: -webkit-transform 0.3s ease-in-out;
        transition: transform 0.3s ease-in-out;
    }

    .toolbar-section {
        width: 100%;
        display: flex;
        flex-direction: column;
        margin: 0.6rem 0;
    }

    .toolbar-section-label {
        margin: 0.6rem 0;
    }

    .toolbar-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        font-weight: 400;
    }

    .toolbar-row-element {
        padding: 0.6rem;
        border-radius: 0.4rem;
        cursor: pointer;
        box-sizing: border-box;
    }

    .toolbar-row-element:not(.nohover):hover {
        opacity: 0.75;
    }

    .toolbar-row-element-inline {
        padding: 0.6rem;
        border-radius: 0.5rem;
        cursor: unset !important;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        width: 100%;
    }

    .node-demo-svg {
        width: 100%;
        box-sizing: border-box;
        height: 2.5rem;
        margin: 0.6rem 0;
    }

    .toolbar-settings-input {
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
    }

    input:focus {
        outline: none;
        border-radius: 0.25rem;
    }
</style>

<div
    bind:this={toolbar_div}
    style="background-color:{$colors.nord5}; height:calc(3.75rem + {$heightTween}%);
    overflow:{$toolbar_visible ? 'scroll' : 'hidden'}"
    class="toolbar-container">

    <div
        class="toolbar-label"
        on:click={onClickToggleToolbar}
        style="color:{$colors.nord0}">
        Toolbar
        <svg
            fill={$colors.nord0}
            viewBox="0 0 20 20"
            class="dropdown-icon gen-dropdown-icon"
            style={$toolbar_visible ? '' : 'transform: rotate(180deg);-webkit-transform: rotate(180deg)'}>
            <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0
                111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd" />
        </svg>
    </div>

    <div class="toolbar-section">
        <div class="toolbar-section-label">Special</div>
        <div class="toolbar-row">
            <div
                on:click={addStartVertex}
                class="toolbar-row-element"
                id="toolbar-create-start-node"
                style="color:{$colors.nord0}">
                Create Start Vertex
                <svg class="node-demo-svg">
                    <circle
                        id="toolbar-start-node-outer"
                        fill={$colors.nord14}
                        r="20"
                        cx="50%"
                        cy="50%" />
                    <circle
                        id="toolbar-start-node-inner"
                        fill={$colors.nord5}
                        r="13"
                        cx="50%"
                        cy="50%" />
                </svg>
            </div>
            <div
                on:click={addEndVertex}
                class="toolbar-row-element"
                id="toolbar-create-start-node"
                style="color:{$colors.nord0}">
                Create End Vertex
                <svg class="node-demo-svg">
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord12}
                        r="20"
                        cx="50%"
                        cy="50%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord5}
                        r="13"
                        cx="50%"
                        cy="50%" />
                </svg>
            </div>
        </div>
    </div>
    <div class="toolbar-section">
        <div class="toolbar-section-label">Mode</div>
        <div class="toolbar-row">
            <div
                class="toolbar-row-element"
                id="toolbar-choose-node-creation-mode"
                style="color:{$colors.nord0};background-color:{$mode === 0 ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickMode(0)}>
                Vertex Creation
                <svg class="node-demo-svg">
                    <circle
                        id="toolbar-start-node-outer"
                        fill={$colors.nord9}
                        r="20"
                        cx="50%"
                        cy="50%" />
                    <circle
                        id="toolbar-start-node-inner"
                        fill={$colors.nord8}
                        r="13"
                        cx="50%"
                        cy="50%" />
                </svg>
            </div>
            <div
                class="toolbar-row-element"
                id="toolbar-choose-edge-creation-mode"
                style="color:{$colors.nord0};background-color:{$mode === 1 ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickMode(1)}>
                Edge Creation
                <svg class="node-demo-svg">
                    <line
                        x1="25%"
                        y1="75%"
                        x2="75%"
                        y2="25%"
                        stroke={$colors.nord9}
                        stroke-width="5" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="25%"
                        cy="75%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="25%"
                        cy="75%" />
                </svg>
            </div>
        </div>
        <div class="toolbar-row">
            <div
                class="toolbar-row-element"
                id="toolbar-choose-node-creation-mode"
                style="color:{$colors.nord0};background-color:{$mode === 2 ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickMode(2)}>
                Vertex Deletion
                <svg class="node-demo-svg">
                    <circle
                        id="toolbar-start-node-outer"
                        fill={$colors.nord3}
                        r="20"
                        cx="50%"
                        cy="50%" />
                    <circle
                        id="toolbar-start-node-inner"
                        fill={$colors.nord4}
                        r="13"
                        cx="50%"
                        cy="50%" />
                </svg>
            </div>
            <div
                class="toolbar-row-element"
                id="toolbar-choose-edge-creation-mode"
                style="color:{$colors.nord0};background-color:{$mode === 3 ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickMode(3)}>
                Edge Deletion
                <svg class="node-demo-svg">
                    <line
                        x1="25%"
                        y1="75%"
                        x2="75%"
                        y2="25%"
                        stroke={$colors.nord3}
                        stroke-width="5" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord3}
                        r="10"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord4}
                        r="6.5"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord3}
                        r="10"
                        cx="25%"
                        cy="75%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord4}
                        r="6.5"
                        cx="25%"
                        cy="75%" />
                </svg>
            </div>
        </div>
        <div class="toolbar-row">
            <div
                class="toolbar-row-element"
                id="toolbar-choose-edge-creation-mode"
                style="color:{$colors.nord0};background-color:{$mode === 4 ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickMode(4)}>
                Edit Edge Weights
                <svg class="node-demo-svg">
                    <text x="47%" y="30%" style="font-size: 0.7rem">5</text>
                    <line
                        x1="25%"
                        y1="75%"
                        x2="75%"
                        y2="25%"
                        stroke={$colors.nord9}
                        stroke-width="5" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="25%"
                        cy="75%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="25%"
                        cy="75%" />
                </svg>
            </div>
            <div
                class="toolbar-row-element"
                id="toolbar-choose-edge-creation-mode"
                style="color:{$colors.nord0};background-color:{$mode === 5 ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickMode(5)}>
                Edit Edge Directions
                <svg class="node-demo-svg">
                    <polygon
                        points="55,14 60,28.5 75,15"
                        style="fill:{$colors.nord9}" />
                    <line
                        x1="25%"
                        y1="75%"
                        x2="75%"
                        y2="25%"
                        stroke={$colors.nord9}
                        stroke-width="5" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="25%"
                        cy="75%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="25%"
                        cy="75%" />
                </svg>
            </div>
        </div>
    </div>
    <div class="toolbar-section">
        <div class="toolbar-section-label">View</div>
        <div class="toolbar-row">
            <div
                class="toolbar-row-element"
                id="toolbar-choose-edge-creation-mode"
                style="color:{$colors.nord0};background-color:{$show_cn_weights ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickView(0)}>
                View Edge Weights
                <svg class="node-demo-svg">
                    <text x="47%" y="30%" style="font-size: 0.7rem">5</text>
                    <line
                        x1="25%"
                        y1="75%"
                        x2="75%"
                        y2="25%"
                        stroke={$colors.nord9}
                        stroke-width="5" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="25%"
                        cy="75%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="25%"
                        cy="75%" />
                </svg>
            </div>
            <div
                class="toolbar-row-element"
                id="toolbar-choose-edge-creation-mode"
                style="color:{$colors.nord0};background-color:{$show_cn_directions ? $colors.nord4 : $colors.nord5}"
                on:click={handleClickView(1)}>
                View Edge Directions
                <svg class="node-demo-svg">
                    <polygon
                        points="55,14 60,28.5 75,15"
                        style="fill:{$colors.nord9}" />
                    <line
                        x1="25%"
                        y1="75%"
                        x2="75%"
                        y2="25%"
                        stroke={$colors.nord9}
                        stroke-width="5" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="75%"
                        cy="25%" />
                    <circle
                        id="toolbar-end-node-outer"
                        fill={$colors.nord9}
                        r="10"
                        cx="25%"
                        cy="75%" />
                    <circle
                        id="toolbar-end-node-inner"
                        fill={$colors.nord8}
                        r="6.5"
                        cx="25%"
                        cy="75%" />
                </svg>
            </div>
        </div>
    </div>
    <div class="toolbar-section">
        <div class="toolbar-section-label">Settings</div>
        <div class="toolbar-row nohover">
            <div
                class="toolbar-row-element nohover toolbar-row-element-inline"
                style="color:{$colors.nord0};background-color:{$colors.nord5};">
                Show Text Editor
            </div>
            <input
                type="checkbox"
                style="margin:0 2.5rem;"
                bind:checked={$vte_show} />
        </div>
        <div class="toolbar-row nohover">
            <div
                class="toolbar-row-element nohover toolbar-row-element-inline"
                style="color:{$colors.nord0};background-color:{$colors.nord5};">
                Default Edge Weight
            </div>
            <input
                class="toolbar-settings-input"
                style="color:{$colors.nord0};background-color:{valid_default_cn_weight ? $colors.nord6 : $colors.nord13};
                width: 4.4rem; flex: 0;"
                bind:value={default_cn_weight_temp} />
        </div>
        <div class="toolbar-row">
            <div
                class="toolbar-row-element nohover toolbar-row-element-inline"
                style="color:{$colors.nord0};background-color:{$colors.nord5};">
                Direction Indicators
            </div>
            <input
                class="toolbar-settings-input"
                style="width:4.4rem;"
                type="range"
                min="1"
                max="15"
                step="1"
                on:change={_ => {
                    $show_cn_directions = true;
                }}
                bind:value={$orb_number} />
        </div>
        <div class="toolbar-row">
            <div
                class="toolbar-row-element nohover toolbar-row-element-inline"
                style="color:{$colors.nord0};background-color:{$colors.nord5};text-align:left;">
                Direction Indicator Speed
            </div>
            <input
                class="toolbar-settings-input"
                style="width:4.4rem;"
                type="range"
                min="0.00001"
                max="0.0005"
                step="0.000001"
                on:change={_ => {
                    $show_cn_directions = true;
                }}
                bind:value={$orb_speed} />
        </div>
        <div class="toolbar-row">
            <button
                class="toolbar-settings-input"
                style="width:100%;margin-top:.5rem;cursor:pointer;color:{$colors.nord0};background-color:{$colors.nord6};"
                on:click={_ => {
                    [...connections.getAll()].forEach(([_cnid, cn]) => {
                        cn.weight.set(Math.floor(Math.random() * 9) + 1);
                    });
                }}>
                Randomise All Edge Weights
            </button>
        </div>
        <div class="toolbar-row">
            <button
                class="toolbar-settings-input"
                style="width:100%;margin-top:.25rem;cursor:pointer;color:{$colors.nord0};background-color:{$colors.nord6};"
                on:click={_ => {
                    [...connections.getAll()].forEach(([_cnid, cn]) => {
                        cn.weight.set($default_cn_weight);
                    });
                }}>
                Reset All Edge Weights
            </button>
        </div>
    </div>
</div>
