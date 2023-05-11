import { SpaceInterface } from "./hnswlib";
import { VisitedList, VisitedListPool } from "./visited_list_pool";

export type tableint = number;
export type linklistsizeint = number;

export class HierarchicalNSW<dist_t> implements AlgorithmInterface<dist_t> {
  static readonly MAX_LABEL_OPERATION_LOCKS = 65536;
  static readonly DELETE_MARK = 0x01;

  max_elements_: number;
  cur_element_count: number;
  size_data_per_element_: number;
  size_links_per_element_: number;
  num_deleted_: number;
  M_: number;
  maxM_: number;
  maxM0_: number;
  ef_construction_: number;
  ef_: number;
  mult_: number;
  revSize_: number;
  maxlevel_: number;
  visited_list_pool_: VisitedListPool | null;
  label_op_locks_: Array<Mutex>;
  global: Mutex;
  link_list_locks_: Array<Mutex>;
  enterpoint_node_: tableint;
  size_links_level0_: number;
  offsetData_: number;
  offsetLevel0_: number;
  label_offset_: number;
  data_level0_memory_: ArrayBufferLike | null;
  linkLists_: Array<ArrayBufferLike> | null;
  element_levels_: Array<number>;
  data_size_: number;
  fstdistfunc_: DISTFUNC<dist_t>;
  dist_func_param_: any;
  label_lookup_lock: Mutex;
  label_lookup_: Map<labeltype, tableint>;
  level_generator_: () => number;
  update_probability_generator_: () => number;
  metric_distance_computations: number;
  metric_hops: number;
  allow_replace_deleted_: boolean;
  deleted_elements_lock: Mutex;
  deleted_elements: Set<tableint>;

  constructor(space?: SpaceInterface<dist_t>) {}

  init(
    space: SpaceInterface<dist_t>, 
    max_elements: number, 
    M = 16, 
    ef_construction = 200, 
    random_seed = 100, 
    allow_replace_deleted = false
  ) {
    this.label_op_locks_ = Array.from({ length: HierarchicalNSW.MAX_LABEL_OPERATION_LOCKS }, () => new Mutex());
    this.element_levels_ = Array(max_elements).fill(-1);
    this.allow_replace_deleted_ = allow_replace_deleted;
    this.max_elements_ = max_elements;
    this.num_deleted_ = 0;
    this.data_size_ = space.get_data_size();
    this.fstdistfunc_ = space.get_dist_func();
    this.dist_func_param_ = space.get_dist_func_param();
    this.M_ = M;
    this.maxM_ = M;
    this.maxM0_ = M * 2;
    this.ef_construction_ = Math.max(ef_construction, M);
    this.ef_ = 10;closest.set(-topCandidates.top().first, topCandidates.top().second);
topCandidates.pop();
}

while (queueClosest.size()) {
    if (returnList.length >= M)
        break;
    const curentPair: [dist_t, tableint] = queueClosest.top();
    const distToQuery = -curentPair[0];
    queueClosest.pop();
    let good = true;

    for (const secondPair of returnList) {
        const curdist =
            fstdistfunc_(getDataByInternalId(secondPair[1]),
                getDataByInternalId(curentPair[1]),
                dist_func_param_);
        if (curdist < distToQuery) {
            good = false;
            break;
        }
    }
    if (good) {
        returnList.push(curentPair);
    }
}

for (const curentPair of returnList) {
    topCandidates.set(-curentPair[0], curentPair[1]);
}
}

getLinkList0(internal_id: tableint): linklistsizeint[] {
    return data_level0_memory_.subarray(internal_id * size_data_per_element_ + offsetLevel0_) as linklistsizeint[];
}

getLinkList0(internal_id: tableint, data_level0_memory_: Int8Array): linklistsizeint[] {
    return data_level0_memory_.subarray(internal_id * size_data_per_element_ + offsetLevel0_) as linklistsizeint[];
}

getLinkList(internal_id: tableint, level: number): linklistsizeint[] {
    return linkLists_[internal_id].subarray((level - 1) * size_links_per_element_) as linklistsizeint[];
}

get_linklist_at_level(internal_id: tableint, level: number): linklistsizeint[] {
    return level === 0 ? getLinkList0(internal_id) : getLinkList(internal_id, level);
}        } + cur_c * size_data_per_element_ + offsetLevel0_, 0, maxM0offset_ - offsetLevel0_);

        memcpy(getDataByInternalId(cur_c), data_point, data_size_);

        insert_element_to_storage_vec(cur_c, label);

        if (curlevel > maxlevelcopy) {
            for (int i = maxlevelcopy + 1; i <= curlevel; i++) {
                enterpoint_node_ = cur_c;
            }
            maxlevel_ = curlevel;
        }

        dist_t curdist = fstdistfunc_(data_point, getDataByInternalId(currObj), dist_func_param_);

        for (int level = maxlevelcopy; level >= 0; level--) {
            bool changed = true;
            while (changed) {
                changed = false;
                unsigned int *data;
                {
                    std::unique_lock <std::mutex> lock(link_list_locks_[currObj]);
                    data = get_linklist_at_level(currObj, level);
                    int size = getListCount(data);
                    tableint *datal = (tableint *) (data + 1);
#ifdef USE_SSE
                    _mm_prefetch(getDataByInternalId(*datal), _MM_HINT_T0);
#endif
                    for (int i = 0; i < size; i++) {
#ifdef USE_SSE
                        _mm_prefetch(getDataByInternalId(*(datal + i + 1)), _MM_HINT_T0);
#endif
                        tableint candidate = datal[i];
                        dist_t d = fstdistfunc_(data_point, getDataByInternalId(candidate), dist_func_param_);
                        if (d < curdist) {
                            curdist = d;
                            currObj = candidate;
                            changed = true;
                        }
                    }
                }
            }
        }

        std::priority_queue<std::pair<dist_t, tableint>, std::vector<std::pair<dist_t, tableint>>, CompareByFirst> resultSet;
        searchAtLayer(data_point, currObj, resultSet, efConstruction_);

        mutuallyConnectNewElement(data_point, cur_c, resultSet, 0);

        for (int level = 1; level <= curlevel; level++) {
            resultSet.swap(std::priority_queue<std::pair<dist_t, tableint>, std::vector<std::pair<dist_t, tableint>>, CompareByFirst>());

            resultSet.emplace(fstdistfunc_(data_point, getDataByInternalId(enterpoint_copy), dist_func_param_), enterpoint_copy);

            searchAtLayer(data_point, enterpoint_copy, resultSet, 1, level);

            mutuallyConnectNewElement(data_point, cur_c, resultSet, level);
        }

        _mm_free(tmp_mem_alloc);
        searchAlgo_.reset();
        return cur_c;
    }import { FastDistFunc, BaseFilterFunctor, LabelType, SpaceInterface } from './hnswlib_interfaces';

export class HNSW {
    private curElementCount: number;
    private enterPointNode: number;
    private maxLevel: number;
    private maxElements: number;
    private maxSize: number;
    private sizeDataPerElement: number;
    private sizeLinksPerElement: number;
    private level0Memory: ArrayBuffer;
    private linkLists: ArrayBuffer[];
    private distFunc: FastDistFunc;
    private enterpointLock: boolean;
    private elementLevels: Uint8Array;
    private levelListLocks: Array<Mutex>;

    public addPoint(dataPoint: Float32Array, label: LabelType, level: number): void {
        const curC = this.curElementCount++;

        if (curC > this.maxElements) {
            throw new Error("Maximum number of elements exceeded");
        }

        if (level == 0) {
            level = this.randomLevel();
        }

        if (level > this.maxLevel) {
            this.enterpointLock = true;
            this.maxLevel = level;
        }

        this.elementLevels[curC] = level;

        this.level0Memory.set(dataPoint, curC * this.sizeDataPerElement);
        this.linkLists[curC] = new ArrayBuffer(this.sizeLinksPerElement * level + 1);
        this.searchKnn(dataPoint, label, curC);
    }

    public searchKnn(queryData: ArrayBuffer, k: number, filterFunc?: BaseFilterFunctor): Array<{ dist: number; label: LabelType }> {
        const result: Array<{ dist: number; label: LabelType }> = [];
        if (this.curElementCount === 0) {
            return result;
        }

        let currObj = this.enterPointNode;
        let curDist = this.distFunc(queryData, this.getDataByInternalId(currObj));

        while (currObj < 0 || currObj > this.maxElements) {
            const data = this.getLinkList(currObj);

            let changed = true;
            while (changed) {
                changed = false;
                const size = this.getListCount(data);
                const dataIds = this.convertLinkListToTableInt(data);

                for (const id of dataIds) {
                    const dist = this.distFunc(queryData, this.getDataByInternalId(id));
                    if (dist < curDist) {
                        currObj = id;
                        curDist = dist;
                        changed = true;
                    }
                }
            }
        }
      
        const topCandidates = this.searchBaseLayerST<false, true>(currObj, queryData, Math.max(this.ef, k), filterFunc);

        while (topCandidates.length > k) {
            topCandidates.pop();
        }

        while (topCandidates.length > 0) {
            const item = topCandidates.shift()!;
            result.push({ dist: item.dist, label: this.getExternalLabel(item.id) });
        }

        return result;
    }
}