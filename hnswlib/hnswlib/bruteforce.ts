import { SpaceInterface, DISTFUNC, labeltype, BaseFilterFunctor } from './hnswlib';
import fs from 'fs';

class BruteforceSearch<dist_t> implements AlgorithmInterface<dist_t> {
    data_: Buffer;
    maxelements_: number;
    cur_element_count: number;
    size_per_element_: number;

    data_size_: number;
    fstdistfunc_: DISTFUNC<dist_t>;
    dist_func_param_: any;
    index_lock: Mutex;

    dict_external_to_internal: Map<labeltype, number>;

    constructor(s: SpaceInterface<dist_t>);
    constructor(s: SpaceInterface<dist_t>, location: string);
    constructor(s: SpaceInterface<dist_t>, maxElements: number);
    constructor(s: SpaceInterface<dist_t>, param?: string | number) {
        this.dict_external_to_internal = new Map<labeltype, number>();
        this.index_lock = new Mutex();

        if (typeof param === 'string') {
            this.loadIndex(param, s);
        } else {
            this.maxelements_ = param || 0;
            this.data_size_ = s.get_data_size();
            this.fstdistfunc_ = s.get_dist_func();
            this.dist_func_param_ = s.get_dist_func_param();
            this.size_per_element_ = this.data_size_ + labeltype.size;
            this.data_ = Buffer.alloc(this.maxelements_ * this.size_per_element_);

            if (!this.data_) {
                throw new Error("Not enough memory: BruteforceSearch failed to allocate data");
            }
            this.cur_element_count = 0;
        }
    }

    addPoint(datapoint: any, label: labeltype, replace_deleted = false): void {
        let idx: number;
        {
            const lock = this.index_lock.acquire();

            const search = this.dict_external_to_internal.get(label);
            if (search !== undefined) {
                idx = search;
            } else {
                if (this.cur_element_count >= this.maxelements_) {
                    throw new Error("The number of elements exceeds the specified limit");
                }
                idx = this.cur_element_count;
                this.dict_external_to_internal.set(label, idx);
                this.cur_element_count++;
            }

            lock.release();
        }
        this.data_.write(datapoint, this.size_per_element_ * idx, this.data_size_, 'utf8');
        this.data_.write(label, this.size_per_element_ * idx + this.data_size_, labeltype.size, 'utf8');
    }

    removePoint(cur_external: labeltype): void {
        let cur_c = this.dict_external_to_internal.get(cur_external);

        this.dict_external_to_internal.delete(cur_external);

        let label = this.data_.slice(this.size_per_element_ * (this.cur_element_count - 1) + this.data_size_, labeltype.size);
        this.dict_external_to_internal.set(label, cur_c);
        this.data_.copy(this.data_, this.size_per_element_ * cur_c, this.size_per_element_ * (this.cur_element_count - 1), this.data_size_ + labeltype.size);
        this.cur_element_count--;
    }

    searchKnn(query_data: any, k: number, isIdAllowed?: BaseFilterFunctor): PriorityQueue<[dist_t, labeltype]> {
        if (k > this.cur_element_count) {
            throw new RangeError("k must be less than or equal to the current element count");
        }
        let topResults = new PriorityQueue<[dist_t, labeltype]>();
        if (this.cur_element_count === 0) return topResults;
        for (let i = 0; i < k; i++) {
            let dist = this.fstdistfunc_(query_data, this.data_.slice(this.size_per_element_ * i, this.data_size_), this.dist_func_param_);
            let label = this.data_.readIntLE(this.size_per_element_ * i + this.data_size_, labeltype.size);
            if ((!isIdAllowed) || (isIdAllowed(label))) {
                topResults.push([dist, label]);
            }
        }
        let lastdist = topResults.empty() ? Number.MAX_VALUE : topResults.top()[0];
        for (let i = k; i < this.cur_element_count; i++) {
            let dist = this.fstdistfunc_(query_data, this.data_.slice(this.size_per_element_ * i, this.data_size_), this.dist_func_param_);
            if (dist <= lastdist) {
                let label = this.data_.readIntLE(this.size_per_element_ * i + this.data_size_, labeltype.size);
                if ((!isIdAllowed) || (isIdAllowed(label))) {
                    topResults.push([dist, label]);
                }
                if (topResults.size() > k)
                    topResults.pop();

                if (!topResults.empty()) {
                    lastdist = topResults.top()[0];
                }
            }
        }
        return topResults;
    }

    saveIndex(location: string): void {
        let output = fs.createWriteStream(location, { flags: 'w' });

        output.write(Buffer.alloc(this.maxelements_ * 4).writeInt32LE(this.maxelements_, 0), 'binary');
        output.write(Buffer.alloc(this.size_per_element_ * 4).writeInt32LE(this.size_per_element_, 0), 'binary');
        output.write(Buffer.alloc(this.cur_element_count * 4).writeInt32LE(this.cur_element_count, 0), 'binary');

        output.write(this.data_.toString('binary'), 0, this.maxelements_ * this.size_per_element_, 'binary');

        output.close();
    }

    loadIndex(location: string, s: SpaceInterface<dist_t>): void {
        let input = fs.createReadStream(location);

        input.on('readable', () => {
            this.maxelements_ = input.read(4).readInt32LE(0);
            this.size_per_element_ = input.read(4).readInt32LE(0);
            this.cur_element_count = input.read(4).readInt32LE(0);

            this.data_size_ = s.get_data_size();
            this.fstdistfunc_ = s.get_dist_func();
            this.dist_func_param_ = s.get_dist_func_param();
            this.size_per_element_ = this.data_size_ + labeltype.size;
            this.data_ = Buffer.alloc(this.maxelements_ * this.size_per_element_);

            if (!this.data_) {
                throw new Error("Not enough memory: loadIndex failed to allocate data");
            }

            input.read(this.data_, 0, this.maxelements_ * this.size_per_element_);

            input.close();
        });
    }
}