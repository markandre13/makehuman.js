import { Proxy, ProxyType } from "proxy/Proxy"
import { MorphManager } from "../modifier/MorphManager"
import { getTarget } from "../target/TargetFactory"
import { Skeleton } from "../skeleton/Skeleton"
import { WavefrontObj } from "./WavefrontObj"
import { BooleanModel } from "toad.js"
import { isZero } from "gl/algorithms/isZero"

export class HumanMesh {
    morphManager: MorphManager
    skeleton!: Skeleton

    // data/3dobjs/base.obj
    baseMesh: WavefrontObj
    vertexMorphed: Float32Array
    vertexRigged: Float32Array

    proxies = new Map<ProxyType, Proxy>()
    changedProxy?: ProxyType
  
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
        if (this.vertexMorphed === this.baseMesh.xyz) {
            this.vertexMorphed = new Float32Array(this.baseMesh.xyz)
        } else {
            this.vertexMorphed.set(this.baseMesh.xyz)
        }
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
