export function assert(value: boolean, message?: string | Error): asserts value {
    if (!value) {
        if (message === undefined) {
            throw Error('assertion failed')
        }
        if (message instanceof Error) {
            throw message
        }
        throw Error(message)
    }
}