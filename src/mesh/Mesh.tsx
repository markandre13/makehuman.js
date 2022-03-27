export class Group {
    name: string
    start: number
    length: number
    constructor(name: string, start: number) {
        this.name = name
        this.start = start
        this.length = 0
    }
}

export interface Mesh {
    vertex: number[]
    indices: number[]
    groups: Group[]
}
