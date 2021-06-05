
export class StringToLineIterator implements Iterator<string> {
    private data: string
    private index: number

    constructor(data: string) {
        this.data = data
        this.index = 0
    }

    next(): IteratorResult<string> {
        if (this.data.length === 0 || this.index === -1)
            return { value: undefined, done: true }
        const nextIndex = this.data.indexOf('\n', this.index)
        let length: number | undefined
        if (nextIndex === -1) {
            length = undefined
        } else {
            length = nextIndex - this.index
        }
        const result = this.data.substr(this.index, length)
        if (nextIndex === -1) {
            this.index = -1
        } else {
            this.index = nextIndex + 1
        }
        return { value: result, done: false }
    }

}
