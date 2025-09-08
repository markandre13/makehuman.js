import { IndexedDB } from 'lib/IndexedDB'
import { MorphGroup } from './MorphGroup'

export const OBJECT_STORE_NAME = "morph"

export class MorphGroupDB extends IndexedDB {
    constructor() {
        super("morph", 1)
    }
    upgradeneeded(db: IDBDatabase, ev: IDBVersionChangeEvent) {
        for (let version = ev.oldVersion; version < ev.newVersion!; ++version) {
            switch (version) {
                case 0:
                    const store = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: "name" })
                    break
            }
        }
    }
    async set(value: MorphGroup): Promise<void> {
        const db = await this.db()
        return new Promise<void>((resolve, reject) => {
            let transaction = db.transaction(OBJECT_STORE_NAME, "readwrite")
            let store = transaction.objectStore(OBJECT_STORE_NAME)
            const getRequest = store.put(value)
            getRequest.onsuccess = () => resolve()
            getRequest.onerror = reject
        })
    }
    async get(key: string): Promise<MorphGroup> {
        const db = await this.db()
        return new Promise<any>((resolve, reject) => {
            let transaction = db.transaction(OBJECT_STORE_NAME, "readwrite")
            let store = transaction.objectStore(OBJECT_STORE_NAME)
            const getRequest = store.get(key)
            getRequest.onsuccess = () => { resolve(getRequest.result) }
            getRequest.onerror = reject
        })
    }
    async all(): Promise<MorphGroup[]> {
        const db = await this.db()
        return new Promise<any>((resolve, reject) => {
            let transaction = db.transaction(OBJECT_STORE_NAME, "readwrite")
            let store = transaction.objectStore(OBJECT_STORE_NAME)
            const getRequest = store.getAll()
            getRequest.onsuccess = () => { resolve(getRequest.result) }
            getRequest.onerror = reject
        })
    }
}
