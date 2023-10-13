import { Proxy, ProxyType } from "proxy/Proxy"
import { Human } from "../modifier/Human"
import { getTarget } from "../target/TargetFactory"
import { Skeleton } from "../skeleton/Skeleton"
import { WavefrontObj } from "./WavefrontObj"
import { BooleanModel } from "toad.js"

let epsilon = 0.000000001

export function isZero(a: number): boolean {
    return Math.abs(a) <= epsilon
}

// FIXME: the name doesn't tell enough, alternatives(?): HowMuchToUpdate, WhatsChanged, ChangeType, ModelChangeExtend...
// the updates with higher numbers include all other updates with lower numbers
export enum Update {
    NONE,
    POSE,
    MORPH,
}

export class HumanMesh {
    human: Human
    baseMesh: WavefrontObj
    vertexMorphed: Float32Array
    vertexRigged: Float32Array
    skeleton!: Skeleton

    proxies = new Map<ProxyType, Proxy>()
    changedProxy: ProxyType | undefined
    wireframe = new BooleanModel(false, { label: "Wireframe" })

    constructor(human: Human, obj: WavefrontObj) {
        this.human = human
        this.baseMesh = obj
        this.vertexRigged = this.vertexMorphed = obj.vertex
    }

    getRestposeCoordinates() {
        return this.vertexMorphed
    }

    calculateVertexMorphed() {
        this.vertexMorphed = new Float32Array(this.baseMesh.vertex)
        this.human.targetsDetailStack.forEach((value, targetName) => {
            if (isNaN(value)) {
                // console.log(`HumanMesh.update(): ignoring target ${targetName} with value NaN`)
                return
            }

            if (isZero(value) || isNaN(value)) return
            // console.log(`HumanMesh.update(): apply target ${targetName} with value ${value}`)
            const target = getTarget(targetName)
            target.apply(this.vertexMorphed, value)
        })
    }

    calculateVertexRigged() {
        this.vertexRigged = this.skeleton.skinMesh(this.vertexMorphed, this.skeleton.vertexWeights!._data)
    }
}
