import { HierarchicalNSW, L2Space } from "../../hnswlib/hnswlib";
import * as seedRandom from "seeded-rng";

const main = (): void => {
  const dim = 16;
  const max_elements = 10000;
  const M = 16;
  const ef_construction = 200;

  const seed = 100;
  const space = new L2Space(dim);
  const alg_hnsw = new HierarchicalNSW<float>(space, max_elements, M, ef_construction, seed, true);

  const rng = new seedRandom(47);
  const data = new Float32Array(dim * max_elements);
  for (let i = 0; i < dim * max_elements; i++) {
    data[i] = rng.random();
  }

  for (let i = 0; i < max_elements; i++) {
    alg_hnsw.addPoint(data.subarray(i * dim, (i + 1) * dim), i);
  }

  const num_deleted = max_elements / 2;
  for (let i = 0; i < num_deleted; i++) {
    alg_hnsw.markDelete(i);
  }

  const add_data = new Float32Array(dim * num_deleted);
  for (let i = 0; i < dim * num_deleted; i++) {
    add_data[i] = rng.random();
  }

  for (let i = 0; i < num_deleted; i++) {
    const label = max_elements + i;
    alg_hnsw.addPoint(add_data.subarray(i * dim, (i + 1) * dim), label, true);
  }
};

main();