"size_data_per_element"_a = appr_alg->size_data_per_element_,
            "max_elements"_a = appr_alg->max_elements_,
            "cur_element_count"_a = appr_alg->cur_element_count,
            "size_links_per_element"_a = appr_alg->size_links_per_element_,
            "label_lookup_key"_a = py::array_t<hnswlib::labeltype>({appr_alg->label_lookup_.size()}, { sizeof(hnswlib::labeltype) }, label_lookup_key_npy, free_when_done_lb),
            "label_lookup_val"_a = py::array_t<hnswlib::tableint> ({appr_alg->label_lookup_.size()}, { sizeof(hnswlib::tableint) }, label_lookup_val_npy, free_when_done_id),
            "element_levels"_a = py::array_t<int>({appr_alg->element_levels_.size()}, { sizeof(int) }, element_levels_npy, free_when_done_lvl),
            "link_list_data"_a = py::array_t<char>({ link_npy_size }, { sizeof(char)}, link_list_npy, free_when_done_ll),
            "link_list_offsets"_a = py::array(link_npy_offsets),
            "data_level0"_a = py::array_t<char>({ appr_alg->cur_element_count, appr_alg->size_data_per_element_ }, { appr_alg->size_data_per_element_,sizeof(char)}, data_level0_npy, free_when_done_l0),
            "M"_a = appr_alg->M_,
            "ef_construction"_a = appr_alg->ef_construction_,
            "has_deletions"_a = appr_alg->has_deletions_, 
            "allow_replace_deleted"_a = appr_alg->allow_replace_deleted_,
            "data_d"_a = dim,
            "space_name"_a = space_name,
            "seed"_a = seed
        );
    }


    static Index* createFromParams(py::dict d) {
        std::string space_name = d["space_name"].cast<std::string>();
        int data_d = d["data_d"].cast<int>();
        Index* res = new Index(space_name, data_d);

        size_t M = d["M"].cast<size_t>();
        size_t efConstruction = d["ef_construction"].cast<size_t>();
        size_t random_seed = d["seed"].cast<size_t>();

        py::array_t<char> data_level0 = d["data_level0"].cast<py::array_t<char>>();
        py::array_t<char> link_list_data = d["link_list_data"].cast<py::array_t<char>>();
        py::array elem_levels_ = d["element_levels"].cast<py::array>();
        py::array label_lookup_key_ = d["label_lookup_key"].cast<py::array_t<hnswlib::labeltype>>();
        py::array label_lookup_val_ = d["label_lookup_val"].cast<py::array>();
        std::vector<size_t> link_list_offsets = d["link_list_offsets"].cast<std::vector<size_t>>();

        assert_true(data_level0.ndim() == 2, std::string("Dimension of 'data_level0' should be 2"));
        size_t max_elements = d["max_elements"].cast<size_t>();
        size_t cur_element_count = d["cur_element_count"].cast<size_t>();
        bool allow_replace_deleted = d["allow_replace_deleted"].cast<bool>();

        res->init_new_index(max_elements, M, efConstruction, random_seed, allow_replace_deleted);

        res->appr_alg->offsetLevel0_ = d["offset_level0"].cast<size_t>();
        res->appr_alg->size_links_per_element_= d["size_links_per_element"].cast<size_t>();
        res->appr_alg->max_elements_ = max_elements;
        res->appr_alg->cur_element_count = cur_element_count;
        res->cur_l = cur_element_count;

        res->appr_alg->element_levels_.resize(cur_element_count);
        memcpy(res->appr_alg->element_levels_.data(), (int*)elem_levels_.request().ptr, sizeof(int) * cur_element_count);

        res->appr_alg->label_lookup_.resize(cur_element_count);
        hnswlib::labeltype* p_key = (hnswlib::labeltype*)label_lookup_key_.request().ptr;
        hnswlib::tableint* p_val = (hnswlib::tableint*)label_lookup_val_.request().ptr;

        for (size_t i = 0; i < cur_element_count; i++) {
            res->appr_alg->label_lookup_[p_key[i]] = p_val[i];
        }

        res->appr_alg->has_deletions_ = d["has_deletions"].cast<bool>();
        res->appr_alg->allow_replace_deleted_ = allow_replace_deleted;
        size_t size_data_per_element_ = d["size_data_per_element"].cast<size_t>();

        memcpy(res->appr_alg->data_level0_memory_, data_level0.request().ptr,
               cur_element_count * size_data_per_element_);

        // allocating link storage:
        for (size_t i = 0; i < cur_element_count; i++) {
            if (res->appr_alg->element_levels_[i] > 0) {
                size_t link_size = res->appr_alg->size_links_per_element_ * res->appr_alg->element_levels_[i];
                char* list_adr = (char*)malloc(link_size);
                memcpy(list_adr,
                        (char*)link_list_data.request().ptr + link_list_offsets[i],
                        link_size);
                res->appr_alg->linkLists_[i] = list_adr;
            }
        }

        return res;
    }
};import { HNSW, HierarchicalNSW, LabelType, TableInt } from "hnswlib";
import * as np from "numpy";

export class Index {
  private appr_alg: HierarchicalNSW;
  private cur_l: number;
  private index_inited: boolean;
  private ep_added: boolean;
  private seed: number;
  private num_threads_default: number;
  private default_ef: number;
  private normalize: boolean;
  static readonly ser_version: number;

  constructor(space_name: string, dim: number) {
    // Constructor implementation
  }

  getIndexParams(): object {
    // getIndexParams implementation
  }

  static createFromParams(params: object): Index {
    // createFromParams implementation
  }

  static createFromIndex(index: Index): Index {
    // createFromIndex implementation
  }

  setAnnData(data: object): void {
    // setAnnData implementation
  }

  knnQuery_return_numpy(
    input: np.Array,
    k = 1,
    num_threads = -1,
    filter: (label: LabelType) => boolean = null
  ): np.Array {
    // knnQuery_return_numpy implementation
  }

  markDeleted(label: number): void {
    this.appr_alg.markDelete(label);
  }

  unmarkDeleted(label: number): void {
    this.appr_alg.unmarkDelete(label);
  }

  resizeIndex(new_size: number): void {
    this.appr_alg.resizeIndex(new_size);
  }

  getMaxElements(): number {
    return this.appr_alg.max_elements;
  }

  getCurrentCount(): number {
    return this.appr_alg.cur_element_count;
  }
}
import * as hnswlib from 'hnswlib';

class BFIndex<dist_t, data_t = number> {
    public static ser_version = 1;  // serialization version

    space_name: string;
    dim: number;
    index_inited: boolean;
    normalize: boolean;

    cur_l: hnswlib.labeltype;
    alg: hnswlib.BruteforceSearch<dist_t>;
    space: hnswlib.SpaceInterface<data_t>;

    constructor(space_name: string, dim: number) {
        this.space_name = space_name;
        this.dim = dim;
        this.normalize = false;
        if (space_name === 'l2') {
            this.space = new hnswlib.L2Space(dim);
        } else if (space_name === 'ip') {
            this.space = new hnswlib.InnerProductSpace(dim);
        } else if (space_name === 'cosine') {
            this.space = new hnswlib.InnerProductSpace(dim);
            this.normalize = true;
        } else {
            throw new Error('Space name must be one of l2, ip, or cosine.');
        }
        this.alg = null;
        this.index_inited = false;
    }

    init_new_index(maxElements: number) {
        if (this.alg) {
            throw new Error('The index is already initiated.');
        }
        this.cur_l = 0;
        this.alg = new hnswlib.BruteforceSearch<dist_t>(this.space, maxElements);
        this.index_inited = true;
    }

    normalize_vector(data: number[], norm_array: number[]) {
        let norm = 0.0;
        for (let i = 0; i < this.dim; i++) {
            norm += data[i] * data[i];
        }
        norm = 1.0 / (Math.sqrt(norm) + 1e-30);
        for (let i = 0; i < this.dim; i++) {
            norm_array[i] = data[i] * norm;
        }
    }

    addItems(input: any, ids_ = null) {
        const items: any = input;
        const buffer = items.buffer;
        const rows = items.shape[0];
        const features = items.shape[1];

        if (features !== this.dim) {
            throw new Error('Wrong dimensionality of the vectors');
        }

        const ids = ids_ !== null ? ids_ : [];

        for (let row = 0; row < rows; row++) {
            const id = ids.length ? ids[row] : this.cur_l + row;
            if (!this.normalize) {
                this.alg.addPoint(items.data[row], id as number);
            } else {
                const normalized_vector: number[] = new Array(this.dim);
                this.normalize_vector(items.data[row], normalized_vector);
                this.alg.addPoint(normalized_vector, id as number);
            }
        }
        this.cur_l += rows;
    }

    deleteVector(label: number) {
        this.alg.removePoint(label);
    }

    saveIndex(path_to_index: string) {
        this.alg.saveIndex(path_to_index);
    }

    loadIndex(path_to_index: string, max_elements: number) {
        if (this.alg) {
            console.warn('Warning: Calling load_index for an already inited index. Old index is being deallocated.');
            this.alg = null;
        }
        this.alg = new hnswlib.BruteforceSearch<dist_t>(this.space, path_to_index);
        this.cur_l = this.alg.cur_element_count;
        this.index_inited = true;
    }

    knnQuery_return_numpy(input: any, k = 1, filter = null) {
        const items: any = input;
        const buffer = items.buffer;
        const rows = items.shape[0];
        const features = items.shape[1];

        const data_numpy_l = new Array(rows * k);
        const data_numpy_d = new Array(rows * k);

        for (let row = 0; row < rows; row++) {
            const result = this.alg.searchKnn(items.data[row], k, filter)
            for (let i = k - 1; i >= 0; i--) {
                const result_tuple = result.top();
                data_numpy_d[row * k + i] = result_tuple[0];
                data_numpy_l[row * k + i] = result_tuple[1];
                result.pop();
            }
        }

        return [data_numpy_l, data_numpy_d];
    }
}