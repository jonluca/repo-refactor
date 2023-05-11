import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { L2, HNSW } from '@datastructures-js/hierarchical-nsw';

class StopW {
  constructor() {
    this.timeBegin = performance.now();
  }

  getElapsedTimeMicro() {
    const timeEnd = performance.now();
    return (timeEnd - this.timeBegin) * 1000;
  }

  reset() {
    this.timeBegin = performance.now();
  }
}

async function loadBatch(filePath, size) {
  const data = await fs.promises.readFile(filePath);
  const batch = [];
  for (let i = 0; i < size; i++) {
    batch[i] = data.readFloatLE(i * 4);
  }
  return batch;
}

function testApprox(queries, qsize, apprAlg, vecdim, answers, K) {
  let correct = 0;
  let total = 0;

  for (let i = 0; i < qsize; i++) {
    const query = queries.slice(vecdim * i, vecdim * (i + 1));
    const result = apprAlg.search(query, K);
    total += K;
    for (const item of result) {
      if (answers[i].has(item.label)) {
        correct++;
      }
    }
  }
  return 1.0 * correct / total;
}

function testVsRecall(queries, qsize, apprAlg, vecdim, answers, K) {
  const efs = [1, ...Array.from({ length: 29 }, (_, i) => i + K), ...Array.from({ length: 37 }, (_, i) => 30 + i * 10), ...Array.from({ length: 20 }, (_, i) => 1000 + i * 5000)];
  console.log('ef\trecall\ttime\thops\tdistcomp');
  let testPassed = false;
  for (const ef of efs) {
    apprAlg.ef = ef;

    const stopw = new StopW();

    const recall = testApprox(queries, qsize, apprAlg, vecdim, answers, K);

    const timeUsPerQuery = stopw.getElapsedTimeMicro() / qsize;

    console.log(`${ef}\t${recall}\t${timeUsPerQuery}us`);

    if (recall > 0.99) {
      testPassed = true;
      console.log(`Recall is over 0.99! ${recall}\t${timeUsPerQuery}us`);
      break;
    }
  }
  if (!testPassed) {
    console.error('Test failed');
    process.exit(1);
  }
}

(async function main() {
  const M = 16;
  const efConstruction = 200;

  const update = process.argv[2] === 'update';

  const testPath = path.join(__dirname, '..', 'tests', 'cpp', 'data');

  const [N, dummyDataMultiplier, N_queries, d, K] =
    fs.readFileSync(path.join(testPath, 'config.txt'), 'utf-8').split(/\s+/).map(Number);

  const l2space = new L2(d);
  const apprAlg = new HNSW(l2space, { M, efConstruction, capacity: N + 1 });

  const dummyBatch = await loadBatch(path.join(testPath, 'batch_dummy_00.bin'), N * d);

  apprAlg.addDataPoints(dummyBatch, Array.from({ length: N }, (_, i) => i));
  const stopw = new StopW();

  if (update) {
    for (let b = 1; b < dummyDataMultiplier; b++) {
      const dummyBatchb = await loadBatch(path.join(testPath, `batch_dummy_${String(b).padStart(2, '0')}.bin`), N * d);
      apprAlg.addDataPoints(dummyBatchb, Array.from({ length: N }, (_, i) => i));
    }
  }

  const finalBatch = await loadBatch(path.join(testPath, 'batch_final.bin'), N * d);

  stopw.reset();
  apprAlg.addDataPoints(finalBatch, Array.from({ length: N }, (_, i) => i));
  console.log(`Finished. Time taken:${stopw.getElapsedTimeMicro() * 1e-6} s`);
  console.log('Running tests');

  const queriesBatch = await loadBatch(path.join(testPath, 'queries.bin'), N_queries * d);

  const gt = await loadBatch(path.join(testPath, 'gt.bin'), N_queries * K);

  const answers = Array.from({ length: N_queries }, () => new Set());

  for (let i = 0; i < N_queries; i++) {
    for (let j = 0; j < K; j++) {
      answers[i].add(gt[i * K + j]);
    }
  }

  for (let i = 0; i < 3; i++) {
    console.log(`Test iteration ${i}`);
    testVsRecall(queriesBatch, N_queries, apprAlg, d, answers, K);
  }
})()
.catch(err => {
  console.error(err);
  process.exit(1);
});