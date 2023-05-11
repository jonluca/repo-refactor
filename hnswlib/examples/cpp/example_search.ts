import { L2Space, HierarchicalNSW } from "../../hnswlib/hnswlib";
import * as random from "seedrandom";

const main = () => {
  const dim = 16;
  const max_elements = 10000;
  const M = 16;
  const ef_construction = 200;
  
  const space = new L2Space(dim);
  let alg_hnsw = new HierarchicalNSW<float>(space, max_elements, M, ef_construction);

  const rng = random.xor4096("47");
  const data = new Float32Array(dim * max_elements);
  for (let i = 0; i < dim * max_elements; i++) {
    data[i] = rng();
  }

  for (let i = 0; i < max_elements; i++) {
    alg_hnsw.addPoint(data.subarray(i * dim, (i + 1) * dim), i);
  }

  let correct = 0;
  for (let i = 0; i < max_elements; i++) {
    const result = alg_hnsw.searchKnn(data.subarray(i * dim, (i + 1) * dim), 1);
    const label = result.top().second;
    if (label === i) correct++;
  }
  const recall = correct / max_elements;
  console.log("Recall: " + recall);

  const hnsw_path = "hnsw.bin";
  alg_hnsw.saveIndex(hnsw_path);
  alg_hnsw = null;
  
  alg_hnsw = new HierarchicalNSW<float>(space, hnsw_path);
  correct = 0;
  for (let i = 0; i < max_elements; i++) {
    const result = alg_hnsw.searchKnn(data.subarray(i * dim, (i + 1) * dim), 1);
    const label = result.top().second;
    if (label === i) correct++;
  }
  const deserializedRecall = correct / max_elements;
  console.log("Recall of deserialized index: " + deserializedRecall);
};

main();