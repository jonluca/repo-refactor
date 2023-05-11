export type VlType = number;

export class VisitedList {
    public curV: VlType;
    public mass: VlType[];
    public numelements: number;

    constructor(numelements1: number) {
        this.curV = -1;
        this.numelements = numelements1;
        this.mass = new Array<VlType>(numelements1).fill(0);
    }

    reset(): void {
        this.curV++;
        if (this.curV === 0) {
            this.mass.fill(0);
            this.curV++;
        }
    }
}
///////////////////////////////////////////////////////////
//
// Class for multi-threaded pool-management of VisitedLists
//
/////////////////////////////////////////////////////////

export class VisitedListPool {
    private pool: VisitedList[];
    private poolguard: Mutex;
    private numelements: number;

    constructor(initmaxpools: number, numelements1: number) {
        this.numelements = numelements1;
        this.pool = [];
        this.poolguard = new Mutex();
        for (let i = 0; i < initmaxpools; i++) {
            this.pool.push(new VisitedList(numelements));
        }
    }

    async getFreeVisitedList(): Promise<VisitedList> {
        let rez: VisitedList;
        {
            await this.poolguard.acquire();
            try {
                if (this.pool.length > 0) {
                    rez = this.pool.shift()!;
                } else {
                    rez = new VisitedList(this.numelements);
                }
            } finally {
                this.poolguard.release();
            }
        }
        rez.reset();
        return rez;
    }

    async releaseVisitedList(vl: VisitedList): Promise<void> {
        await this.poolguard.acquire();
        try {
            this.pool.unshift(vl);
        } finally {
            this.poolguard.release();
        }
    }
}

class Mutex {
    private mutex = new Promise<void>((resolve) => resolve());
    
    async acquire(): Promise<void> {
        let nextResolve: () => void;
        const nextPromise = new Promise<void>((resolve) => {
            nextResolve = resolve;
        });
        const prevPromise = this.mutex;
        this.mutex = nextPromise;
        await prevPromise;
        return nextResolve!;
    }
    
    release(): void {
        // Mutex is automatically released when control returns to the event loop
    }
}