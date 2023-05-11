import * as hnswlib from "../../hnswlib/hnswlib";
import { performance } from "perf_hooks";

class MultiThreadLoadTest {
  private static d = 16;
  private static max_elements = 1000;

  public static main() {
    console.log("Running multithread load test");
    const d = MultiThreadLoadTest.d;
    const max_elements = MultiThreadLoadTest.max_elements;

    const rng = new Math.seedrandom("47");
    const distrib_real = () => rng();

    const space = new hnswlib.L2Space(d);
    const alg_hnsw = new hnswlib.HierarchicalNSW<float>(space, 2 * max_elements);

    console.log("Building index");
    const num_threads = 40;
    const num_labels = 10;

    const num_iterations = 10;
    let start_label = 0;

    while (true) {
      const distrib_int = (start_label, start_label + num_labels - 1);
      const threads = [];

      for (let thread_id = 0; thread_id < num_threads; thread_id++) {
        threads.push(
          new Promise<void>((resolve) => {
            for (let iter = 0; iter < num_iterations; iter++) {
              const data: number[] = Array.from({ length: d }, () => distrib_real());
              const label = distrib_int(rng);
              alg_hnsw.addPoint(data, label);
            }
            resolve();
          })
        );
      }
      Promise.all(threads);

      if (alg_hnsw.cur_element_count > max_elements - num_labels) {
        break;
      }
      start_label += num_labels;
    }

    for (let label = 0; label < max_elements; label++) {
      const search = alg_hnsw.label_lookup.find((entry) => entry.label === label);
      if (!search) {
        console.log("Adding " + label);
        const data: number[] = Array.from({ length: d }, () => distrib_real());
        alg_hnsw.addPoint(data, label);
      }
    }

    console.log("Index is created");

    let stop_threads = false;
    let threads = [];

    console.log("Starting markDeleted and unmarkDeleted threads");
    const chunk_size = max_elements / num_threads;
    for (let thread_id = 0; thread_id < num_threads; thread_id++) {
      threads.push(
        new Promise<void>((resolve) => {
          const distrib_int = chunk_size + thread_id * chunk_size - 1;
          const marked_deleted: boolean[] = new Array(chunk_size).fill(false);

          while (!stop_threads) {
            const id = Math.floor(distrib_int(rng));

            if (marked_deleted[id]) {
              alg_hnsw.unmarkDelete(id);
              marked_deleted[id] = false;
            } else {
              alg_hnsw.markDelete(id);
              marked_deleted[id] = true;
            }
          }
          resolve();
        })
      );
    }

    console.log("Starting add and update elements threads");
    const distrib_int_add = (max_elements + 1, 2 * max_elements - 1);
    for (let thread_id = 0; thread_id < num_threads; thread_id++) {
      threads.push(
        new Promise<void>((resolve) => {
          while (!stop_threads) {
            const label = distrib_int_add(rng);
            const data: number[] = Array.from({ length: d }, () => distrib_real());

            alg_hnsw.addPoint(data, label);
            const data_ = alg_hnsw.getDataByLabel<float>(label);
            const max_val = Math.max(...data_);

            if (max_val > 10) {
              throw new Error("Unexpected value in data");
            }
          }
          resolve();
        })
      );
    }

    console.log("Sleep and continue operations with index");
    const sleep_ms = 60 * 1000;
    setTimeout(() => {
      stop_threads = true;
      Promise.all(threads);
      console.log("Finish");
    }, sleep_ms);
  }
}

MultiThreadLoadTest.main();