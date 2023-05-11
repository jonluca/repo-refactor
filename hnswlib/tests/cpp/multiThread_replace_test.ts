import * as hnswlib from "../../hnswlib/hnswlib";
import { performance } from "perf_hooks";

function parallelFor<T>(
  start: number,
  end: number,
  numThreads: number,
  fn: (row: number, threadId: number) => T
): void {
  if (numThreads <= 0) {
    numThreads = navigator.hardwareConcurrency;
  }

  if (numThreads === 1) {
    for (let id = start; id < end; id++) {
      fn(id, 0);
    }
  } else {
    const threads: Promise<T>[] = [];
    let current = start;

    for (let threadId = 0; threadId < numThreads; ++threadId) {
      threads.push(
        new Promise((resolve, reject) => {
          while (true) {
            const id = current++;

            if (id >= end) {
              break;
            }

            try {
              const result = fn(id, threadId);
              resolve(result);
            } catch (error) {
              reject(error);
              current = end;
              break;
            }
          }
        })
      );
    }

    Promise.all(threads).catch((error) => {
      throw error;
    });
  }
}

(async function main() {
  console.log("Running multithread load test");
  const d = 16;
  const num_elements = 1000;
  const max_elements = 2 * num_elements;
  const num_threads = 50;

  const rng = new Math.seedrandom("47");
  const distrib_real = () => rng();

  const space = new hnswlib.L2Space(d);

  const batch1 = new Float32Array(d * max_elements);
  for (let i = 0; i < d * max_elements; i++) {
    batch1[i] = distrib_real();
  }
  const batch2 = new Float32Array(d * num_elements);
  for (let i = 0; i < d * num_elements; i++) {
    batch2[i] = distrib_real();
  }

  const rand_labels = Array.from({ length: max_elements }, (_, i) => i);
  for (let i = rand_labels.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rand_labels[i], rand_labels[j]] = [rand_labels[j], rand_labels[i]];
  }

  let iter = 0;
  while (iter < 200) {
    const alg_hnsw = new hnswlib.HierarchicalNSW(space, max_elements, 16, 200, 123, true);

    parallelFor(0, max_elements, num_threads, (row) => {
      alg_hnsw.addPoint(batch1.subarray(d * row, d * (row + 1)), row);
    });

    for (let i = 0; i < num_elements; i++) {
      alg_hnsw.markDelete(rand_labels[i]);
    }

    parallelFor(0, num_elements, num_threads, (row) => {
      const label = rand_labels[row] + max_elements;
      alg_hnsw.addPoint(batch2.subarray(d * row, d * (row + 1)), label, true);
    });

    iter += 1;
  }

  console.log("Finish");
})();