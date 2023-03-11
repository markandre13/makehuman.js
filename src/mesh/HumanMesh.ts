import { Mode } from 'Mode'
import { Proxy } from 'proxy/Proxy'
import { Human } from '../Human'
import { getTarget } from '../target/TargetFactory'
import { Group } from './Mesh'
import { Skeleton } from '../skeleton/Skeleton'
import { WavefrontObj } from './WavefrontObj'

let epsilon = 0.000000001

export function isZero(a: number): boolean {
    return Math.abs(a) <= epsilon
}

// FIXME: the name doesn't tell enough, alternatives(?): HowMuchToUpdate, WhatsChanged, ChangeType, ModelChangeExtend...
export enum Update {
    NONE,
    MORPH,
    POSE
}

export class HumanMesh {
    human: Human
    baseMesh: WavefrontObj
    skeleton!: Skeleton
    origVertex: number[]
    vertex: number[]
    indices: number[]
    groups: Group[]
    mode!: Mode

    proxy?: Proxy

    updateRequired = Update.NONE

    constructor(human: Human) {
        this.human = human

        const obj = new WavefrontObj()
        obj.load('data/3dobjs/base.obj.z')

        this.baseMesh = obj
        this.vertex = this.origVertex = obj.vertex
        this.indices = obj.indices
        this.groups = obj.groups
    }

    getRestposeCoordinates() {
        return this.origVertex
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

            const tmp = this.baseMesh.vertex
            this.baseMesh.vertex = this.vertex

            this.skeleton.updateJoints()
            this.skeleton.build()
            this.skeleton.update()

            this.baseMesh.vertex = tmp
        // }

        // skin/pose
        this.vertex = this.skeleton.skinMesh(this.vertex, this.skeleton.vertexWeights!._data)
        console.log(`HumanMesh.update(): skinMesh, ${this.vertex.length}`)

        // if (this.proxy !== undefined) {
            // this.vertex = this.proxy.getCoords(this.vertex)
            // this.vertex = this.proxyMesh!.vertex
            // this.indices = this.proxyMesh!.indices
        //     console.log(`HumanMesh.update(): proxy, ${this.vertex.length}`)
        // }

        this.updateRequired = Update.NONE
    }
}
