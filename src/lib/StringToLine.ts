import { StringToLineIterator } from './StringToLineIterator'

export class StringToLine implements Iterable<string> {
    data: string;
    constructor(data: string) {
        this.data = data
    }

    [Symbol.iterator](): Iterator<string> {
        return new StringToLineIterator(this.data)
    }
}
