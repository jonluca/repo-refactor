export type labelType = number;

export class BaseFilterFunctor {
    operator(id: labelType): boolean {
        return true;
    }
}

interface PairGreater<T> {
    (a: T, b: T): boolean;
}

const pairGreater = <T>(a: T, b: T) => a[0] > b[0];

export function writeBinaryPOD<T>(out: DataView, offset: number, podRef: T): number {
    const byteLength = ArrayBuffer.byteLength(podRef);
    new DataView(out.buffer).set(podRef, offset, true);
    return byteLength;
}

export function readBinaryPOD<T>(inp: DataView, offset: number, byteLength: number): [T, number] {
    const podRef: T = inp.get(offset, true);
    return [podRef, byteLength];
}

export type DistFunc<MType> = (a: MType, b: MType, param: any) => MType;

export abstract class SpaceInterface<MType> {
    abstract get_data_size(): number;
    abstract get_dist_func(): DistFunc<MType>;
    abstract get_dist_func_param(): any;
}

export abstract class AlgorithmInterface<DistType> {
    abstract addPoint(datapoint: any, label: labelType, replace_deleted?: boolean): void;
    abstract searchKnn(queryPoint: any, size: number, isIdAllowed?: BaseFilterFunctor): Array<[DistType, labelType]>;

    searchKnnCloserFirst(queryData: any, k: number, isIdAllowed?: BaseFilterFunctor): Array<[DistType, labelType]> {
        const result: Array<[DistType, labelType]> = [];

        const ret = this.searchKnn(queryData, k, isIdAllowed);
        const sz = ret.size;
        result.resize(sz);
        ret.forEach((value: [DistType, labelType]) => {
            result[--sz] = value;
        });

        return result;
    }

    abstract saveIndex(location: string): void;
}

export * from "./space_l2";
export * from "./space_ip";
export * from "./bruteforce";
export * from "./hnswalg";