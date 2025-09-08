class PromiseHandler {
    constructor(resolve: (database: IDBDatabase) => void, reject: (reason?: any) => void) {
        this.resolve = resolve
        this.reject = reject
    }
    resolve: (database: IDBDatabase) => void
    reject: (reason?: any) => void
}

export abstract class IndexedDB {
    private _db?: IDBDatabase
    private _pending: PromiseHandler[] = [];

    constructor(dbname: string, dbversion?: number) {
        const openRequest = indexedDB.open(dbname, dbversion)
        openRequest.onupgradeneeded = (ev) => {
            if (ev.newVersion === null) {
                return
            }
            this.upgradeneeded(openRequest.result, ev)
        }
        openRequest.onsuccess = (event) => {
            this._db = openRequest.result
            if (this._pending) {
                for (const h of this._pending) {
                    h.resolve(openRequest.result)
                }
                this._pending.length = 0
            }
        }
    }
    protected async db(): Promise<IDBDatabase> {
        if (this._db !== undefined) {
            return this._db
        }
        return new Promise((resolve, reject) => {
            if (this._db) {
                resolve(this._db)
            }
            this._pending.push(new PromiseHandler(resolve, reject))
        })
    }
    abstract upgradeneeded(db: IDBDatabase, ev: IDBVersionChangeEvent): void
}
