import hnswlib from '../../hnswlib/hnswlib';

type idx_t = hnswlib.labeltype;

function test() {
    const d = 4;
    const n = 100;
    const nq = 10;
    const k = 10;

    const data: number[] = new Array(n * d);
    const query: number[] = new Array(nq * d);

    const rng = new Math.seedrandom('47');
    const distrib = (rng: () => number) => rng() * (1 - 0) + 0;

    for (let i = 0; i < n * d; ++i) {
        data[i] = distrib(rng);
    }
    for (let i = 0; i < nq * d; ++i) {
        query[i] = distrib(rng);
    }

    const space = new hnswlib.L2Space(d);
    const alg_brute = new hnswlib.BruteforceSearch(space, 2 * n);
    const alg_hnsw = new hnswlib.HierarchicalNSW(space, 2 * n);

    for (let i = 0; i < n; ++i) {
        alg_brute.addPoint(data.slice(d * i), i);
        alg_hnsw.addPoint(data.slice(d * i), i);
    }

    for (let j = 0; j < nq; ++j) {
        const p = query.slice(j * d);
        const gd = alg_brute.searchKnnCloserFirst(p, k);
        const res = alg_brute.searchKnnCloserFirst(p, k);
        const length = gd.length;
        gd.forEach((_value, index) => {
            if (gd[index] !== res[length - 1 - index])
                throw new Error('Assertion Error');
        });
    }
    for (let j = 0; j < nq; ++j) {
        const p = query.slice(j * d);
        const gd = alg_hnsw.searchKnnCloserFirst(p, k);
        const res = alg_hnsw.searchKnnCloserFirst(p, k);
        const length = gd.length;
        gd.forEach((_value, index) => {
            if (gd[index] !== res[length - 1 - index])
                throw new Error('Assertion Error');
        });
    }
}

console.log("Testing ...");
test();
console.log("Test ok");