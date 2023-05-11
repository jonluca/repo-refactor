import * as hnswlib from "../../hnswlib/hnswlib";
import { performance } from "perf_hooks";

function parallelFor<T>(
  start: number,
  end: number,
  numThreads: number,
  fn: (id: number, threadId: number) => T
): T[] {
  if (numThreads <= 0) {
    numThreads = navigator.hardwareConcurrency || 1;
  }

  if (numThreads === 1) {
    const results: T[] = [];
    for (let id = start; id < end; id++) {
      results.push(fn(id, 0));
    }
    return results;
  } else {
    return Promise.all(
      new Array(numThreads).fill(null).map(async (_, threadId) => {
        const results: T[] = [];
        while (true) {
          const id = start++;

          if (id >= end) {
            break;
          }
          const result = await fn(id, threadId);
          results.push(result);
        }
        return results;
      })
    ).then((res) => res.flat());
  }
}

(async () => {
  const dim = 16;
  const max_elements = 10000;
  const M = 16;
  const ef_construction = 200;
  const num_threads = 20;

  const space = new hnswlib.L2Space(dim);
  const alg_hnsw = new hnswlib.HierarchicalNSW<float>(space, max_elements, M, ef_construction);

  const rng = new Math.seedrandom("47");
  const data = Float32Array.from({ length: dim * max_elements }, () => rng());

  await parallelFor(0, max_elements, num_threads, (row) => {
    alg_hnsw.addPoint(data.subarray(dim * row, dim * (row + 1)), row);
  });

  const neighbors = (await parallelFor(0, max_elements, num_threads, (row) => {
    const result = alg_hnsw.searchKnn(data.subarray(dim * row, dim * (row + 1)), 1);
    return result.top().second as hnswlib.Labeltype;
  })) as hnswlib.Labeltype[];

  const correct = neighbors.reduce((acc, label, i) => (label === i ? acc + 1 : acc), 0);
  const recall = correct / max_elements;
  console.log("Recall:", recall);
})();