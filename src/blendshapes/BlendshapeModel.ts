import { Signal } from "toad.js"

/**
 * I provide blendshape data from Frontend_impl to the application.
 */

export class BlendshapeModel {
    modified = new Signal();

    private blendshapeName2Index = new Map<string, number>();
    private blendshapeNames?: string[]
    private blendshapesWeights?: Float32Array

    transform!: Float32Array

    forEach(cb: (name: string, weight: number) => void) {
        if (this.blendshapeNames === undefined || this.blendshapesWeights === undefined) {
            return
        }
        this.blendshapeNames.forEach((name, index) => {
            cb(name, this.blendshapesWeights![index])
        })
    }

    getBlendshapeWeight(name: string): number {
        if (this.blendshapesWeights === undefined) {
            return 0
        }
        const index = this.blendshapeName2Index.get(name)
        if (index === undefined) {
            return 0
        }
        return this.blendshapesWeights[index]
    }

    setBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        this.blendshapeNames = faceBlendshapeNames
        this.blendshapeName2Index.clear()
        faceBlendshapeNames.forEach((name, index) => {
            this.blendshapeName2Index.set(name, index)
        })
    }

    setBlendshapeWeights(blendshapes: Float32Array, transform: Float32Array): void {
        this.blendshapesWeights = blendshapes
        this.transform = transform
        this.modified.trigger()
    }
}
