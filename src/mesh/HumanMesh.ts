import { Proxy, ProxyType } from "proxy/Proxy"
import { MorphManager } from "../modifier/MorphManager"
import { getTarget } from "../target/TargetFactory"
import { Skeleton } from "../skeleton/Skeleton"
import { WavefrontObj } from "./WavefrontObj"
import { BooleanModel } from "toad.js"

let epsilon = 0.000000001

export function isZero(a: number): boolean {
    return Math.abs(a) <= epsilon
}

export class HumanMesh {
    morphManager: MorphManager
    // data/3dobjs/base.obj
    baseMesh: WavefrontObj
    vertexMorphed: Float32Array
    vertexRigged: Float32Array
    skeleton!: Skeleton

    proxies = new Map<ProxyType, Proxy>()
    changedProxy: ProxyType | undefined
    wireframe = new BooleanModel(false, { label: "Wireframe" })

    constructor(morphManager: MorphManager, baseMesh: WavefrontObj) {
        this.morphManager = morphManager
        this.baseMesh = baseMesh
        this.vertexRigged = this.vertexMorphed = baseMesh.xyz
    }

    getVertexMorphed() {
        return this.vertexMorphed
    }

    /**
     * this.vertexMorphed := this.baseMesh.xyz + morph
     */
    calculateVertexMorphed() {
        // console.log(`HumanMesh.calculateVertexMorphed()`)
        this.vertexMorphed = new Float32Array(this.baseMesh.xyz)
        this.morphManager.targetsDetailStack.forEach((value, targetName) => {
            if (isNaN(value)) {
                // console.log(`HumanMesh.update(): ignoring target ${targetName} with value NaN`)
                return
            }

            if (isZero(value) || isNaN(value)) return
            // console.log(`    apply target ${targetName} with value ${value}`)
            const target = getTarget(targetName)
            target.apply(this.vertexMorphed, value)
        })
    }

    /**
     * this.vertexRigged := this.vertexMorphed + pose
     */
    calculateVertexRigged() {
        this.vertexRigged = this.skeleton.skinMesh(this.vertexMorphed, this.skeleton.vertexWeights!._data)
    }
}
