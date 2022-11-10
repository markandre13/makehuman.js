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

export abstract class Mesh {
    abstract vertex: number[]
    abstract indices: number[]
    abstract groups: Group[]
    abstract getFaceGroup(name: string): Group | undefined
}

// core/module3d.py
// line 940: createFaceGroup
// line 1084: getFaceGroup

// line 47
export interface FaceGroup {
    // object
    name: string
    idx: number
    // color
    // colorID
}