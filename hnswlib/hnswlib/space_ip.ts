export type DistFunc<T> = (v1: voidPtr, v2: voidPtr, qty_ptr: voidPtr) => T;
type voidPtr = any;

export class InnerProductSpace {
  private fstdistfunc: DistFunc<float>;
  private data_size: number;
  private dim: number;

  constructor(dim: number) {
    this.fstdistfunc = InnerProductDistance;
    this.dim = dim;
    this.data_size = dim * Float32Array.BYTES_PER_ELEMENT;
  }

  get_data_size(): number {
    return this.data_size;
  }

  get_dist_func(): DistFunc<float> {
    return this.fstdistfunc;
  }

  get_dist_func_param(): voidPtr {
    return this.dim;
  }

  static innerProduct(pVect1: voidPtr, pVect2: voidPtr, qty_ptr: voidPtr): float {
    const qty: number = qty_ptr as number;
    let res: float = 0;
    for (let i = 0; i < qty; i++) {
      res += (pVect1 as Float32Array)[i] * (pVect2 as Float32Array)[i];
    }
    return res;
  }

  static innerProductDistance(pVect1: voidPtr, pVect2: voidPtr, qty_ptr: voidPtr): float {
    return 1.0 - InnerProductSpace.innerProduct(pVect1, pVect2, qty_ptr);
  }

  // If more SIMD capabilities are needed, additional methods and conditions can be added here, similar to the C++ code.
}
