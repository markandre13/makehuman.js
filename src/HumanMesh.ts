import { Human } from "../src/Human"
import { Mesh, Group } from './fileformats/Mesh'

export class HumanMesh {
    human: Human
    obj: Mesh
    origVertex: number[]
    vertex: number[]
    indices: number[]
    groups: Group[]

    updateRequired = false

    constructor(human: Human, obj: Mesh) {
        this.human = human
        this.obj = obj
        this.vertex = this.origVertex = obj.vertex
        this.indices = obj.indices
        this.groups = obj.groups
    }

    update(): void {
        this.updateRequired = false
        this.vertex = [...this.origVertex]
        
    }
}
