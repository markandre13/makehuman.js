import { Signal } from "toad.js"

/**
 * I provide blendshape data from Frontend_impl to the application.
 */

export class BlendshapeModel {
    signal = new Signal();

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
        this.signal.emit()
    }

    reset() {
        if (this.blendshapesWeights === undefined) {
            this.blendshapesWeights = new Float32Array(this.blendshapeNames!.length!)
        }
        this.blendshapesWeights.fill(0)
    }

    setBlendshapeWeight(name: string, weight: number) {
        if (this.blendshapesWeights === undefined) {
            return
        }
        const index = this.blendshapeName2Index.get(name)!
        if (this.blendshapesWeights[index] == weight) {
            return
        }
        this.blendshapesWeights[index] = weight
        // console.log(`BlendshapeModel.setBlendshapeWeight('${name}', ${weight}})`)
        this.signal.emit()
    }
}
