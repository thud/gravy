import { writable, readable } from 'svelte/store';
import { tweened, spring } from 'svelte/motion';
import { expoInOut } from 'svelte/easing';
import StoreMap from './StoreMap';
import type Vertex from './Vertex';
import type Connection from './Connection';
import type {
    NumSpring,
    NumReadable,
    PosSpring,
    BooleanWritable,
    StrWritable,
    NumWritable,
    NumTweened,
} from './Utils';

const noop = () => {};

// nord colour scheme - https://www.nordtheme.com/
export let colors: any = readable(
    {
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
    },
    noop
);

export let zoom: NumSpring = spring(1, { stiffness: 0.1, damping: 0.98 });
export let zoom_multiplier: NumReadable = readable(1 / 500, noop);
export let canvas_offsets: PosSpring = spring({ x: 0, y: 0 });
export let moving_canvas: BooleanWritable = writable(false);
export let time_offset: NumWritable = writable(0);
export let selected_node: NumWritable = writable(-1);
export let nodes: StoreMap<number, Vertex> = new StoreMap([]);
export let connections: StoreMap<number, Connection> = new StoreMap([]);
export let next_node_id: NumWritable = writable(3);
export let next_cn_id: NumWritable = writable(1);
export let show_node_labels: BooleanWritable = writable(true);
export let show_cn_weights: BooleanWritable = writable(true);
export let show_cn_directions: BooleanWritable = writable(false);
export let default_cn_weight: NumWritable = writable(1);
export let selected_cn_weight: NumWritable = writable(-1);
export let toolbar_visible: BooleanWritable = writable(true);
export let orb_number: NumWritable = writable(5);
export let orb_speed: NumWritable = writable(0.00005);
export let start_node_id: NumWritable = writable(-1);
export let end_node_id: NumWritable = writable(-1);
export let mode: NumWritable = writable(0);
export let tutorial_open: BooleanWritable = writable(true);

export let visualising: BooleanWritable = writable(false);
export let algo_to_visualise: NumWritable = writable(-1);
export let last_generated: NumWritable = writable(-1);
export let clearing_canvas: BooleanWritable = writable(false);
export let stop_visualising: BooleanWritable = writable(false);
export let visual_progress: NumTweened = tweened(0, { duration: 0 });
export let visual_progress_step_count: NumWritable = writable(1);
export let recalculate_vis: BooleanWritable = writable(false);

export let vte_show: BooleanWritable = writable(true);
export let vte_text: StrWritable = writable('');
export let vte_temp_nnodes: StrWritable = writable('');
export let vte_nnodes: NumWritable = writable(0);
export let vte_textvalid: BooleanWritable = writable(false);
export let vte_directed: BooleanWritable = writable(false);
export let vte_livemode: BooleanWritable = writable(false);
export let vte_outdated: BooleanWritable = writable(false);
