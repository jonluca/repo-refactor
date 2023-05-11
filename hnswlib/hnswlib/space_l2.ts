export function L2Sqr(pVect1v: Float32Array, pVect2v: Float32Array, qty: number): number {
    let pVect1 = pVect1v;
    let pVect2 = pVect2v;
    let res = 0;
    for (let i = 0; i < qty; i++) {
        let t = pVect1[i] - pVect2[i];
        res += t * t;
    }
    return res;
}

export class L2Space {
    fstdistfunc_: (a: Float32Array, b: Float32Array, c: number) => number;
    data_size_: number;
    dim_: number;

    constructor(dim: number) {
        this.fstdistfunc_ = L2Sqr;
        this.dim_ = dim;
        this.data_size_ = dim * Float32Array.BYTES_PER_ELEMENT;
    }

    get_data_size() {
        return this.data_size_;
    }

    get_dist_func() {
        return this.fstdistfunc_;
    }

    get_dist_func_param() {
        return this.dim_;
    }
}

export function L2SqrI(pVect1v: Uint8Array, pVect2v: Uint8Array, qty: number): number {
    let res = 0;
    for (let i = 0; i < qty; i++) {
        let t = pVect1v[i] - pVect2v[i];
        res += t * t;
    }
    return res;
}

export function L2SqrI4x(pVect1v: Uint8Array, pVect2v: Uint8Array, qty: number): number {
    let res = 0;
    qty = qty >> 2;
    for (let i = 0; i < qty; i++) {

        for (let j = 0; j < 4; j++) {
            let t = pVect1v[i * 4 + j] - pVect2v[i * 4 + j];
            res += t * t;
        }
    }
    return res;
}

export class L2SpaceI {
    fstdistfunc_: (a: Uint8Array, b: Uint8Array, c: number) => number;
    data_size_: number;
    dim_: number;

    constructor(dim: number) {
        if (dim % 4 === 0) {
            this.fstdistfunc_ = L2SqrI4x;
        } else {
            this.fstdistfunc_ = L2SqrI;
        }
        this.dim_ = dim;
        this.data_size_ = dim;
    }

    get_data_size() {
        return this.data_size_;
    }

    get_dist_func() {
        return this.fstdistfunc_;
    }

    get_dist_func_param() {
        return this.dim_;
    }
}