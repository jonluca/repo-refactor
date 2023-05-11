import HNSW from "hnswlib";
import { L2Space } from "hnswlib";
import { BaseFilterFunctor } from "hnswlib";
import { performance } from "perf_hooks";

class PickDivisibleIds extends BaseFilterFunctor {
  divisor: number = 1;

  constructor(divisor: number) {
    super();
    this.divisor = divisor;
  }

  apply(label_id: number) {
    return label_id % this.divisor === 0;
  }
}

const main = async () => {
  const dim = 16; // Dimension of the elements
  const max_elements = 10000; // Maximum number of elements, should be known beforehand
  const M = 16; // Tightly connected with internal dimensionality of the data
  // strongly affects the memory consumption
  const ef_construction = 200; // Controls index search speed/build speed tradeoff
  const numThreads = 20; // Number of threads for operations with index

  // Initing index
  const space = new L2Space(dim);
  const alg_hnsw = new HNSW(space, max_elements, M, ef_construction);

  // Generate random data
  const data: number[] = Array.from({ length: dim * max_elements }, () => Math.random());

  // Add data to index
  await Promise.all(
    Array.from({ length: max_elements }, (_, i) => i).map(async index => {
      await alg_hnsw.addPoint(data.slice(dim * index, dim * (index + 1)), index);
    })
  );

  // Create filter that allows only even labels
  const pickIdsDivisibleByTwo = new PickDivisibleIds(2);

  // Query the elements for themselves with filter and check returned labels
  const k = 10;
  const neighbors: number[] = [];

  await Promise.all(
    Array.from({ length: max_elements }, (_, i) => i).map(async row => {
      const result = await alg_hnsw.searchKnn(data.slice(dim * row, dim * (row + 1)), k, pickIdsDivisibleByTwo);
      for (let i = 0; i < k; i++) {
        neighbors[row * k + i] = result[i].label_id;
      }
    })
  );

  for (const label of neighbors) {
    if (label % 2 === 1) console.log("Error: found odd label");
  }
};

main();