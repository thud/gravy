<script>
    import {
        colors,
        toolbar_visible,
        show_cn_weights,
        show_cn_directions,
        default_cn_weight,
        create_start_node,
        create_end_node,
        start_node_id,
        end_node_id,
        orb_number,
        orb_speed,
        visual_progress,
        mode,
    } from '../model/State.js'
    import { tweened } from 'svelte/motion'
    import { cubicInOut } from 'svelte/easing'

    import { playVisualisation } from '../utils/Utils.js'

    let maxheight = 50

    let heightTween = tweened(maxheight, { duration: 400, easing: cubicInOut })

    let toolbar_div
    function onClickToggleToolbar(e) {
        $toolbar_visible = !$toolbar_visible

        if ($toolbar_visible) {
            heightTween.update(($heightTween) => maxheight)
        } else {
            heightTween.update(($heightTween) => 0)
            toolbar_div.scrollTop = 0
        }
    }

    function handleClickMode(m) {
        return () => {
            $mode = m
        }
    }

    function handleClickView(m) {
        switch (m) {
            case 0:
                return () => {
                    $show_cn_weights = !$show_cn_weights
                }
            case 1:
                return () => {
                    $show_cn_directions = !$show_cn_directions
                }
        }
    }

    let default_cn_weight_temp = $default_cn_weight
    let valid_default_cn_weight = true
    $: if (parseFloat(default_cn_weight_temp)) {
        valid_default_cn_weight = true
        $default_cn_weight = parseFloat(default_cn_weight_temp)
    } else {
        valid_default_cn_weight = false
    }
</script>

<style>
    .toolbar-container {
        position: fixed;
        left: calc(95% - 300px);
        width: 300px;
        border-radius: 10px;
        padding: 10px;
        box-sizing: border-box;
        margin: 0;
        overflow: hidden;
        text-align: center;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
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
        font-size: 25px;
        text-align: left;
        margin: 5px;
        cursor: pointer;
    }

    .dropdown-icon {
        width: 30px;
        float: right;
        -webkit-transition: -webkit-transform 0.3s ease-in-out;
        transition: transform 0.3s ease-in-out;
    }

    .toolbar-section {
        width: 100%;
        display: flex;
        flex-direction: column;
        margin: 10px 0;
    }

    .toolbar-section-label {
        margin: 10px 0;
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
        padding: 10px;
        border-radius: 7px;
        cursor: pointer;
        box-sizing: border-box;
    }

    .toolbar-row-element:not(.nohover):hover {
        background-color: #d8dee9 !important;
    }

    .toolbar-row-element-inline {
        padding: 10px;
        border-radius: 7px;
        cursor: unset !important;
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        width: 100%;
    }

    .node-demo-svg {
        width: 100%;
        box-sizing: border-box;
        height: 40px;
        margin: 10px 0;
    }

    .toolbar-settings-input {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        font-size: 14px;
        text-align: center;
        box-sizing: border-box;
        margin: 0 10px;
        padding: 5px 1px;
        border-radius: 15px;
        border: 1px solid #4c566a grey;
        transition: border-radius 0.3s ease-in-out;
    }

    textarea:focus,
    input:focus {
        outline: none;
        border-radius: 5px;
    }
</style>

<div
    bind:this={toolbar_div}
    style="background-color:{$colors.nord5}; height:calc(60px + {$heightTween}%);
    top: calc(95% - {$heightTween}% - 60px);overflow:{$toolbar_visible ? 'scroll' : 'hidden'}"
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
                on:click={(_) => {
                    $create_start_node = true
                }}
                class="toolbar-row-element"
                id="toolbar-create-start-node"
                style="color:{$colors.nord0}">
                Create Start Node
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
                on:click={(_) => {
                    $create_end_node = true
                }}
                class="toolbar-row-element"
                id="toolbar-create-start-node"
                style="color:{$colors.nord0}">
                Create End Node
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
                Node Creation
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
                Node Deletion
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
                    <text x="47%" y="30%" style="font-size: 12px">5</text>
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
                    <text x="47%" y="30%" style="font-size: 12px">5</text>
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
                Default Edge Weight
            </div>
            <input
                class="toolbar-settings-input"
                style="color:{$colors.nord0};background-color:{valid_default_cn_weight ? $colors.nord5 : $colors.nord13};
                width: 70px; flex: 0;"
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
                style="color:{$colors.nord0};background-color:{valid_default_cn_weight ? $colors.nord5 : $colors.nord13};width:70px;"
                type="range"
                min="1"
                max="15"
                step="1"
                on:change={(_) => {
                    $show_cn_directions = true
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
                style="color:{$colors.nord0};background-color:{valid_default_cn_weight ? $colors.nord5 : $colors.nord13};width:70px;"
                type="range"
                min="0.00001"
                max="0.0005"
                step="0.000001"
                on:change={(_) => {
                    $show_cn_directions = true
                }}
                bind:value={$orb_speed} />
        </div>
    </div>
</div>
