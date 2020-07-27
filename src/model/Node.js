export default class Node {
    constructor(id, posSpringA, posSpringB, sizeSpringA, sizeSpringB, direct_cn = new Set(), indirect_cn = new Set()) {
        if (id === undefined) {
            console.error("No id param given");
        }
        this.id = id;
        this.posSpringA = posSpringA;
        this.posSpringB = posSpringB;
        this.sizeSpringA = sizeSpringA;
        this.sizeSpringB = sizeSpringB;
		this.direct_cn = direct_cn;
		this.indirect_cn = indirect_cn;
		this.kill = false;
    }
}
