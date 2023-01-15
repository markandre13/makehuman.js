import { Mode } from 'Mode'
import { Human } from '../Human'
import { getTarget } from '../target/TargetFactory'
import { Mesh, Group } from './Mesh'
import { WavefrontObj } from './WavefrontObj'

let epsilon = 0.000000001

export function isZero(a: number): boolean {
    return Math.abs(a) <= epsilon
}

export enum Update {
    NONE,
    MORPH,
    POSE
}

export class HumanMesh {
    human: Human
    obj: Mesh
    origVertex: number[]
    vertex: number[]
    indices: number[]
    groups: Group[]
    mode!: Mode

    updateRequired = Update.NONE

    constructor(human: Human, obj: WavefrontObj) {
        this.human = human
        this.obj = obj
        this.vertex = this.origVertex = obj.vertex
        this.indices = obj.indices
        this.groups = obj.groups

        human.meshData = obj // UGLY
    }

    update(): void {
        if (this.updateRequired === Update.NONE) {
            return
        }

        // if (this.updateRequired === Update.MORPH) {
            // morph
            this.vertex = [...this.origVertex]
            this.human.targetsDetailStack.forEach((value, targetName) => {
                if (isNaN(value)) {
                    // console.log(`HumanMesh.update(): ignoring target ${targetName} with value NaN`)
                    return
                }

                if (isZero(value) || isNaN(value))
                    return
                // console.log(`HumanMesh.update(): apply target ${targetName} with value ${value}`)
                const target = getTarget(targetName)
                target.apply(this.vertex, value)
            })

            const tmp = this.obj.vertex
            this.obj.vertex = this.vertex

            this.human.__skeleton.updateJoints(this.human)
            this.human.__skeleton.build()
            this.human.__skeleton.update()

            this.obj.vertex = tmp
        // }

        // skin
        this.vertex = this.human.__skeleton.skinMesh(this.vertex, this.human.__skeleton.vertexWeights!._data)

        this.updateRequired = Update.NONE
    }
}
