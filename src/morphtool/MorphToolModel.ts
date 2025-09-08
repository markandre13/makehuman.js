import { Action, BooleanModel, OptionModel, TextModel } from 'toad.js'
import { MorphRenderer } from './MorphRenderer'

interface MorphGroup {
    name: string
    mh: number[]
    extern: number[]
}

class PromiseHandler {
    constructor(resolve: (database: IDBDatabase) => void, reject: (reason?: any) => void) {
        this.resolve = resolve
        this.reject = reject
    }
    resolve: (database: IDBDatabase) => void
    reject: (reason?: any) => void
}

const OBJECT_STORE_NAME = "morph"

class IndexedDB {
    private _db?: IDBDatabase
    private _pending: PromiseHandler[] = []

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

export class MorphToolModel {
    renderer?: MorphRenderer
    isARKitActive = new BooleanModel(false, { label: "MH / ARKit" })
    isTransparentActiveMesh = new BooleanModel(false, { label: "Transparent active mesh" })
    showBothMeshes = new BooleanModel(true, { label: "Show both meshes" })

    // morphGroupData = new Map<string, { mh: number[], extern: number[] }>()
    morphGroupData = new IndexedDB("morph", 1)

    private lastgroup = "none"
    private mapping = ["none"]
    morphGroups = new OptionModel("none", this.mapping, { label: "Morph Groups" })
    newMorphGroup = new TextModel("none")
    addMorphGroup = new Action(() => {
        this.mapping.push(this.newMorphGroup.value.trim())
        this.mapping = this.mapping.sort()
        this.morphGroups.setMapping(this.mapping)
        this.morphGroups.value = this.newMorphGroup.value
    }, { label: "+" })
    deleteMorphGroup = new Action(() => {
        this.mapping = this.mapping.filter(it => it !== this.newMorphGroup.value.trim())
        this.morphGroups.setMapping(this.mapping)
        this.morphGroups.value = this.mapping[0]
    }, { label: "-" })
    deleteEnabled = () => {
        if (["", "none"].includes(this.morphGroups.value.trim())) {
            this.deleteMorphGroup.enabled = false
            return
        }
        this.deleteMorphGroup.enabled = this.mapping.find(it => it === this.morphGroups.value.trim()) !== undefined
    }
    addEnabled = () => {
        if (["", "none"].includes(this.morphGroups.value.trim())) {
            this.addMorphGroup.enabled = false
            return
        }
        this.addMorphGroup.enabled = this.mapping.find(it => it === this.morphGroups.value.trim()) === undefined
    }
    store = async () => {
        if (this.mapping.find(it => it === this.morphGroups.value.trim())) {
            const nextgroup = this.morphGroups.value.trim()
            if (this.renderer) {
                if (this.lastgroup !== "none") {
                    const old = this.renderer.selection
                    this.morphGroupData.set({
                        name: this.lastgroup,
                        ...old!
                    })
                }
                this.renderer.selection = await this.morphGroupData.get(nextgroup)
            }
            this.lastgroup = nextgroup
        }
    }
    private visibilitychange() {
        if (document.visibilityState === "hidden" && this.renderer) {
            const old = this.renderer.selection
            this.morphGroupData.set({
                name: this.lastgroup,
                ...old!
            })
        }
    }
    constructor() {
        this.visibilitychange = this.visibilitychange.bind(this)
        document.addEventListener("visibilitychange", this.visibilitychange)

        this.morphGroups.signal.add(this.store)
        this.morphGroups.signal.add(this.deleteEnabled)
        this.morphGroups.signal.add(this.addEnabled)
        this.addEnabled()
        this.deleteEnabled()

        this.morphGroupData.all().then( data => {
            const x = data.map(it => it.name)
            console.log(`restored groups %o`, x)
            this.mapping = ["none", ...x]
            this.morphGroups.setMapping(this.mapping)
        })
    }
}
