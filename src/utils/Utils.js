import { get } from 'svelte/store'
import {
    nodes,
    connections,
    recalculate_vis,
    visual_progress,
    moving_canvas,
    canvas_offsets,
    zoom,
} from '../model/State.js'

export function c2c(zm, cvo, { x, y }) {
    return {
        x: window.innerWidth / 2 + (x + cvo.x) * zm,
        y: window.innerHeight / 2 + (y + cvo.y) * zm,
    }
}

export function rc2c(zm, cvo, { x, y }) {
    return {
        x: (x - window.innerWidth / 2) / zm - cvo.x,
        y: (y - window.innerHeight / 2) / zm - cvo.y,
    }
}

export function getUsableBounds() {
    let canvas = document.getElementById('canvas')
    const zm = get(zoom),
        cvo = get(canvas_offsets)
    //const actualBounds = rc2c(get(zoom), get(canvas_offsets), { x:canvas.clientWidth, y: canvas.clientHeight });
    const leftUpper = rc2c(zm, cvo, {
        x: canvas.clientWidth / 20 + 50,
        y: canvas.clientWidth / 20 + 90,
    })
    const rightLower = rc2c(zm, cvo, {
        x: (canvas.clientWidth * 19) / 20 - 150,
        y: (canvas.clientHeight * 19) / 20 - 100,
    })

    return [
        [leftUpper.x, rightLower.x],
        [leftUpper.y, rightLower.y],
    ]
}

export function getDistance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

export function randomShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
    }
    return arr
}

export function sleepPromise(t) {
    return new Promise((_) => setTimeout(_, t))
}

export function waitForEmpty() {
    return new Promise((resolve, reject) => {
        ;(function check() {
            if (get(nodes).length === 0) return resolve()
            setTimeout(check, 100)
        })()
    })
}

export function waitForDoneMovingIfMoving() {
    return new Promise((resolve, reject) => {
        let moving = false
        const unsubscribemc = moving_canvas.subscribe((val) => (moving = val))
        ;(function check() {
            if (!moving) {
                unsubscribemc()
                return resolve()
            }
            setTimeout(check, 500)
        })()
    })
}

export function resetAnimations(resetvisprog = false) {
    nodes.update((ns) =>
        ns.map((node) => {
            node.animationEvents.set([])
            return node
        })
    )
    connections.update((cns) =>
        cns.map((cn) => {
            cn.animationEvents.set([])
            return cn
        })
    )
    if (resetvisprog) visual_progress.set(0, { duration: 0 })
}

export async function playVisualisation() {
    visual_progress.set(0, { duration: 500 })
    await sleepPromise(500)
    visual_progress.set(1, { duration: 7500 })
}

export function addNode(node) {
    nodes.update((arr) => [...arr, node])
    recalculate_vis.set(true)
}

export function addConnection(cn) {
    connections.update((arr) => [...arr, cn])
    recalculate_vis.set(true)
}

export function delNode(id) {
    nodes.update((arr) => arr.filter((node) => node.id !== id))
    recalculate_vis.set(true)
}

export function delConnection(id) {
    connections.update((arr) => arr.filter((cn) => cn.id !== id))
    recalculate_vis.set(true)
}
