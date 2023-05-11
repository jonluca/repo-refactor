import hnswlib from "hnswlib";
import { L2Space, BruteforceSearch, HierarchicalNSW } from "../../hnswlib/hnswlib";
import assert from "assert";

type Idx = number;

class PickDivisibleIds {
  divisor: number;

  constructor(divisor: number) {
    assert(divisor !== 0);
    this.divisor = divisor;
  }

  isAllowed(label_id: Idx) {
    return label_id % this.divisor === 0;
  }
}

class PickNothing {
  isAllowed(_: Idx) {
    return false;
  }
}

function test_some_filtering(filter_func: { isAllowed(id: Idx): boolean }, div_num: number, label_id_start: number) {
  const d = 4;
  const n = 100;
  const nq = 10;
  const k = 10;

  const data = new Float32Array(n * d);
  const query = new Float32Array(nq * d);

  const rng = new Uint32Array(1);
  rng[0] = 47;
  const distrib = () => Math.random();

  for (let i = 0; i < n * d; ++i) {
    data[i] = distrib();
  }
  for (let i = 0; i < nq * d; ++i) {
    query[i] = distrib();
  }

  const space = new L2Space(d);
  const alg_brute = new BruteforceSearch(space, 2 * n);
  const alg_hnsw = new HierarchicalNSW(space, 2 * n);

  for (let i = 0; i < n; ++i) {
    alg_brute.addPoint(data.subarray(d * i, d * (i + 1)), label_id_start + i);
    alg_hnsw.addPoint(data.subarray(d * i, d * (i + 1)), label_id_start + i);
  }

  for (let j = 0; j < nq; ++j) {
    const p = query.subarray(j * d, j * d + d);
    const gd = alg_brute.searchKnn(p, k, filter_func.isAllowed.bind(filter_func));
    const res = alg_brute.searchKnnCloserFirst(p, k, filter_func.isAllowed.bind(filter_func));
    assert(gd.length === res.length);
    let t = gd.length;
    while (gd.length > 0) {
      assert(gd[gd.length - 1].equals(res[t - 1]));
      assert((gd[gd.length - 1][1] % div_num) === 0);
      gd.pop();
    }
  }

  for (let j = 0; j < nq; ++j) {
    const p = query.subarray(j * d, j * d + d);
    const gd = alg_hnsw.searchKnn(p, k, filter_func.isAllowed.bind(filter_func));
    const res = alg_hnsw.searchKnnCloserFirst(p, k, filter_func.isAllowed.bind(filter_func));
    assert(gd.length === res.length);
    let t = gd.length;
    while (gd.length > 0) {
      assert(gd[gd.length - 1].equals(res[t - 1]));
      assert((gd[gd.length - 1][1] % div_num) === 0);
      gd.pop();
    }
  }
}

function test_none_filtering(filter_func: { isAllowed(id: Idx): boolean }, label_id_start: number) {
  const d = 4;
  const n = 100;
  const nq = 10;
  const k = 10;

  const data = new Float32Array(n * d);
  const query = new Float32Array(nq * d);

  const rng = new Uint32Array(1);
  rng[0] = 47;
  const distrib = () => Math.random();

  for (let i = 0; i < n * d; ++i) {
    data[i] = distrib();
  }
  for (let i = 0; i < nq * d; ++i) {
    query[i] = distrib();
  }

  const space = new L2Space(d);
  const alg_brute = new BruteforceSearch(space, 2 * n);
  const alg_hnsw = new HierarchicalNSW(space, 2 * n);

  for (let i = 0; i < n; ++i) {
    alg_brute.addPoint(data.subarray(d * i, d * (i + 1)), label_id_start + i);
    alg_hnsw.addPoint(data.subarray(d * i, d * (i + 1)), label_id_start + i);
  }

  for (let j = 0; j < nq; ++j) {
    const p = query.subarray(j * d, j * d + d);
    const gd = alg_brute.searchKnn(p, k, filter_func.isAllowed.bind(filter_func));
    const res = alg_brute.searchKnnCloserFirst(p, k, filter_func.isAllowed.bind(filter_func));
    assert(gd.length === res.length);
    assert(0 === gd.length);
  }

  for (let j = 0; j < nq; ++j) {
    const p = query.subarray(j * d, j * d + d);
    const gd = alg_hnsw.searchKnn(p, k, filter_func.isAllowed.bind(filter_func));
    const res = alg_hnsw.searchKnnCloserFirst(p, k, filter_func.isAllowed.bind(filter_func));
    assert(gd.length === res.length);
    assert(0 === gd.length);
  }
}

class CustomFilterFunctor {
  allowed_values: Set<Idx>;

  constructor(values: ReadonlyArray<Idx>) {
    this.allowed_values = new Set(values);
  }

  isAllowed(id: Idx) {
    return this.allowed_values.has(id);
  }
}

console.log("Testing ...");

const pickIdsDivisibleByThree = new PickDivisibleIds(3);
test_some_filtering(pickIdsDivisibleByThree, 3, 17);
const pickIdsDivisibleBySeven = new PickDivisibleIds(7);
test_some_filtering(pickIdsDivisibleBySeven, 7, 17);

const pickNothing = new PickNothing();
test_none_filtering(pickNothing, 17);

const pickIdsDivisibleByThirteen = new CustomFilterFunctor([26, 39, 52, 65]);
test_some_filtering(pickIdsDivisibleByThirteen, 13, 21);

console.log("Test ok");
