export class Group {
    name: string
    startIndex: number
    length: number
    constructor(name: string, start: number) {
        this.name = name
        this.startIndex = start
        this.length = 0
    }
}

export interface Mesh {
    vertex: number[]
    indices: number[]
    groups: Group[]
}
