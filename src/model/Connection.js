import { tweened } from 'svelte/motion'
import { expoInOut } from 'svelte/easing'
import { writable } from 'svelte/store'

export default class Connection {
    constructor(
        id,
        idA,
        idB,
        weight = 1,
        directionCounter = 0,
        lengthTween = tweened(0, { easing: expoInOut, duration: 500 })
    ) {
        this.id = id
        this.idA = idA
        this.idB = idB
        this.lengthTween = lengthTween
        this.weight = weight
        this.kill = false
        this.centerX = 0
        this.centerY = 0
        this.settingDirection = true
        this.directionCounter = directionCounter

        this.animationEvents = writable([])
        this.progressFlipped = writable(false)
    }
}
