import { writable, derived } from 'svelte/store';
import { spring } from 'svelte/motion';
import type { AnyArrayWritable, PosSpring, NumSpring } from './Utils';

export default class Vertex {
    id: number;
    posSpringA: PosSpring;
    posSpringB: PosSpring;
    sizeSpringA: NumSpring;
    sizeSpringB: NumSpring;
    top_rank: number;
    direct_cn: Set<number>;
    indirect_cn: Set<number>;
    kill: boolean;
    animationEvents: AnyArrayWritable;

    constructor(
        id: number,
        posSpringA: PosSpring,
        posSpringB: PosSpring,
        sizeSpringA: NumSpring,
        sizeSpringB: NumSpring,
        top_rank: number = 1,
        direct_cn: Set<number> = new Set<number>(),
        indirect_cn: Set<number> = new Set<number>()
    ) {
        if (id === undefined) console.error('No id param given');
        this.id = id;
        this.posSpringA = posSpringA;
        this.posSpringB = posSpringB;
        this.sizeSpringA = sizeSpringA;
        this.sizeSpringB = sizeSpringB;
        this.direct_cn = direct_cn;
        this.indirect_cn = indirect_cn;
        this.kill = false;
        this.top_rank = top_rank;

        this.animationEvents = writable([]);
    }
}

function nodewritable() {
    return writable<Vertex>(undefined);
}
export type VertexWritable = ReturnType<typeof nodewritable>;
