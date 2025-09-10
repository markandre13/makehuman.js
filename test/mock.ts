// indexedDB = new IDBFactory();
/**
 * This is similar to the Proxy class, only that it takes a type and let's
 * undefined methods throw an exception so that one can see what's missing.
 *
 * @param target The type to mock.
 * @param handler Methods to use in the mock object.
 * @returns
 */
export function mock<T>(target: new (...args: any[]) => T, handler?: Partial<T>): T {
    const mock = {} as any;
    for (const methodName of Object.getOwnPropertyNames(target.prototype)) {
        if (methodName === "constructor") {
            continue;
        }
        let methodImplementation: (() => any) | undefined;
        if (handler) {
            methodImplementation = (handler as any)[methodName];
        }
        if (methodImplementation === undefined) {
            methodImplementation = () => { throw Error(`mock(${target.name}): method ${methodName} not implemented`); };
        }
        mock[methodName] = methodImplementation;
    }
    return mock as T;
}
