import { writable, readable } from 'svelte/store'
import { tweened, spring } from 'svelte/motion'
import { expoInOut } from 'svelte/easing'
import Node from './Node'
import Connection from './Connection'

// nord colour scheme - https://www.nordtheme.com/
export let colors = readable({
    nord0: '#2e3440',
    nord1: '#3b4252',
    nord2: '#434c5e',
    nord3: '#4c566a',
    nord3_bright: '#616e88',
    nord4: '#d8dee9',
    nord5: '#e5e9f0',
    nord6: '#eceff4',
    nord7: '#8fbcbb',
    nord8: '#88c0d0',
    nord9: '#81a1c1',
    nord10: '#5e81ac',
    nord11: '#bf616a',
    nord12: '#d08770',
    nord13: '#ebcb8b',
    nord14: '#a3be8c',
    nord15: '#b48ead',
})

export let zoom = spring(1, { stiffness: 0.1, damping: 0.98 })
export let zoom_multiplier = readable(1 / 500)
export let canvas_offsets = spring({ x: 0, y: 0 })
export let moving_canvas = writable(false)
export let time_offset = writable(0)
export let selected_node = writable(-1)
export let nodes = writable([
    new Node(
        1,
        spring({ x: 100, y: -100 }),
        spring({ x: 100, y: -100 }),
        spring(0, { stiffness: 0.2, damping: 0.5 }),
        spring(0, { stiffness: 0.2, damping: 0.3 })
    ),
    new Node(
        2,
        spring({ x: -400, y: -100 }),
        spring({ x: -400, y: -100 }),
        spring(0, { stiffness: 0.2, damping: 0.5 }),
        spring(0, { stiffness: 0.2, damping: 0.3 })
    ),
    new Node(
        3,
        spring({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
        spring({ x: window.innerWidth / 2, y: window.innerHeight / 2 }),
        spring(0, { stiffness: 0.2, damping: 0.5 }),
        spring(0, { stiffness: 0.2, damping: 0.3 })
    ),
])
export let next_node_id = writable(4)
export let next_cn_id = writable(1)
export let connections = writable([
    new Connection(0, 1, 2, 5, 0, tweened(0, { easing: expoInOut })),
])
export let show_node_labels = writable(true)
export let show_cn_weights = writable(false)
export let show_cn_directions = writable(false)
export let default_cn_weight = writable(1)
export let selected_cn_weight = writable(-1)
export let toolbar_visible = writable(true)
export let orb_number = writable(5)
export let orb_speed = writable(0.00005)
export let create_start_node = writable(false)
export let create_end_node = writable(false)
export let start_node_id = writable(-1)
export let end_node_id = writable(-1)
export let mode = writable(0)

export let visualising = writable(false)
export let algo_to_visualise = writable(-1)
export let last_generated = writable(-1)
export let clearing_canvas = writable(false)
export let stop_visualising = writable(false)
export let visual_progress = tweened(0, { duration: 0 })
export let visual_progress_step_count = writable(1)
export let visual_queue = writable([])
export let recalculate_vis = writable(false)
