import { Proxy } from 'proxy/Proxy'
import { Human } from '../modifier/Human'
import { getTarget } from '../target/TargetFactory'
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
    vertexMorphed: Float32Array
    vertexRigged: Float32Array
    skeleton!: Skeleton

    proxies = new Map<string, Proxy>

    updateRequired = Update.NONE

    constructor(human: Human, obj: WavefrontObj) {
        this.human = human
        this.baseMesh = obj
        this.vertexRigged = this.vertexMorphed = obj.vertex
    }

    getRestposeCoordinates() {
        return this.vertexMorphed
    }

    update(): void {
        if (this.updateRequired === Update.NONE) {
            return
        }

        if (this.updateRequired === Update.MORPH) {
            // morph
            this.vertexMorphed = new Float32Array(this.baseMesh.vertex)
            this.human.targetsDetailStack.forEach((value, targetName) => {
                if (isNaN(value)) {
                    // console.log(`HumanMesh.update(): ignoring target ${targetName} with value NaN`)
                    return
                }

                if (isZero(value) || isNaN(value))
                    return
                // console.log(`HumanMesh.update(): apply target ${targetName} with value ${value}`)
                const target = getTarget(targetName)
                target.apply(this.vertexMorphed, value)
            })
            this.skeleton.updateJoints()
            this.skeleton.build()
            this.skeleton.update()
        }

        // skin/pose
        this.vertexRigged = this.skeleton.skinMesh(this.vertexMorphed, this.skeleton.vertexWeights!._data)

        this.updateRequired = Update.NONE
    }
}
