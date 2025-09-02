// just how complicated can it be to write a KOIN like DI framework for typescript?
// => simple dependency injection inspired by KOIN

// missing
// * test: injecting subclass for super class
// * test: use method to permutate order of single calls in test
// * KOIN has
//     single() : returns one instance
//     factory(): always returns a new instance
// * KOIN as
//     get()    : resolve when get() is called
//     inject() : resolve lazy: when value returned by inject() is called
// * identify by name, not just type
// * lists: meaning multiple instance per type

export namespace di {

    const singleDB = new Map<any, any>()
    const instanceDB = new Map<any, any>()

    export class NoInstance<T> extends Error {
        clazz: new (...args: any[]) => T
        constructor(clazz: new (...args: any[]) => T) {
            super(`no instance for class ${clazz.name}`)
            this.clazz = clazz
        }
    }

    export function clear() {
        singleDB.clear()
        instanceDB.clear()
    }

    export function single<T extends object>(type: new (...args: any[]) => T, createInstance: () => T) {
        singleDB.set(type, createInstance)
    }

    export function get<T>(c: new (...args: any[]) => T): T {
        let instance = instanceDB.get(c)
        if (instance === undefined) {
            // console.log(`try to create instance for ${c.name}`)
            const createInstance = singleDB.get(c)
            if (createInstance === undefined) {
                throw Error(`can't create instance of ${c.name} because no singleton has been registered`)
            }
            while (true) {
                try {
                    instance = createInstance()
                    instanceDB.set(c, instance)
                }
                catch (error) {
                    if (error instanceof NoInstance) {
                        // IMPROVE: in case get fails, register the missing dependency to avoid calling createInstance again before the dependency is solved
                        get(error.clazz)
                        continue
                    } else {
                        throw error
                    }
                }
                break
            }
        }
        return instance
    }

}
