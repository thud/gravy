import { writable, derived } from 'svelte/store'

export default class Node {
    constructor(
        id,
        posSpringA,
        posSpringB,
        sizeSpringA,
        sizeSpringB,
        top_rank = 1,
        direct_cn = new Set(),
        indirect_cn = new Set()
    ) {
        if (id === undefined) {
            console.error('No id param given')
        }
        this.id = id
        this.posSpringA = posSpringA
        this.posSpringB = posSpringB
        this.sizeSpringA = sizeSpringA
        this.sizeSpringB = sizeSpringB
        this.direct_cn = direct_cn
        this.indirect_cn = indirect_cn
        this.kill = false
        this.top_rank = top_rank

        this.processingStateTimeOffsets = writable([0, 2, 2]) // time offsets for state changes
        this.animationEvents = writable([])
    }
}
