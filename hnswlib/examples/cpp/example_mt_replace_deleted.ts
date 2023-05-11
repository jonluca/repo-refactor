import hnswlib from "hnswlib";
import { range } from "lodash";

const main = () => {
  const dim = 16;
  const max_elements = 10000;
  const M = 16;
  const ef_construction = 200;
  const num_threads = 20;

  const seed = 100;
  const space = new hnswlib.L2Space(dim);
  const alg_hnsw = new hnswlib.HierarchicalNSW(
    space,
    max_elements,
    M,
    ef_construction,
    seed,
    true
  );

  const rng = new Math.seedrandom("47");
  const data = new Float32Array(dim * max_elements).map(_ => rng());

  const addDataToIndex = (row: number) => {
    alg_hnsw.addPoint(data.subarray(dim * row, dim * (row + 1)), row);
  };
  range(0, max_elements).forEach(addDataToIndex);

  const num_deleted = max_elements / 2;
  const markDelete = (row: number) => {
    alg_hnsw.markDelete(row);
  };
  range(0, num_deleted).forEach(markDelete);

  const add_data = new Float32Array(dim * num_deleted).map(_ => rng());

  const replaceDeletedData = (row: number) => {
    const label = max_elements + row;
    alg_hnsw.addPoint(
      add_data.subarray(dim * row, dim * (row + 1)),
      label,
      true
    );
  };
  range(0, num_deleted).forEach(replaceDeletedData);
};

main();