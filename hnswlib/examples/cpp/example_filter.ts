import { HierarchicalNSW, L2Space, labeltype, BaseFilterFunctor } from "../../hnswlib/hnswlib";

class PickDivisibleIds implements BaseFilterFunctor {
    constructor(private divisor: number) {
        if (divisor === 0) {
            throw new Error("Divisor should not be 0");
        }
    }

    operator(label_id: labeltype): boolean {
        return label_id % this.divisor === 0;
    }
}

function main() {
    const dim = 16;
    const max_elements = 10000;
    const M = 16;
    const ef_construction = 200;

    const space = new L2Space(dim);
    const alg_hnsw = new HierarchicalNSW(space, max_elements, M, ef_construction);

    const rng = Math.random;
    const distrib_real = () => Math.random();
    const data = new Float32Array(dim * max_elements);
    for (let i = 0; i < dim * max_elements; i++) {
        data[i] = distrib_real() as number;
    }

    for (let i = 0; i < max_elements; i++) {
        alg_hnsw.addPoint(data.subarray(i * dim, (i + 1) * dim), i);
    }

    const pickIdsDivisibleByTwo = new PickDivisibleIds(2);

    const k = 10;
    for (let i = 0; i < max_elements; i++) {
        const result = alg_hnsw.searchKnnCloserFirst(data.subarray(i * dim, (i + 1) * dim), k, pickIdsDivisibleByTwo);
        for (const item of result) {
            if (item.second % 2 === 1) console.log("Error: found odd label");
        }
    }
}

main();