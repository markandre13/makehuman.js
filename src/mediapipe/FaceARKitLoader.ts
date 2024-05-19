import { WavefrontObj } from "mesh/WavefrontObj"
import { Target } from "target/Target"
import { blendshapeNames } from "./blendshapeNames"

/**
 * Load and cache ARKit Face Blendshapes
 */

export class FaceARKitLoader {
    private static _instance?: FaceARKitLoader
    static getInstance() {
        if (FaceARKitLoader._instance === undefined) {
            FaceARKitLoader._instance = new FaceARKitLoader()
        }
        return FaceARKitLoader._instance
    }

    private scale = 80;
    private targets: Target[]
    neutral: WavefrontObj

    constructor() {
        this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
        this.targets = new Array<Target>(blendshapeNames.length)
        for (let i = 0; i < this.neutral.xyz.length; ++i) {
            this.neutral.xyz[i] = this.neutral.xyz[i] * this.scale
        }
    }

    /**
     * Load all blendshapes. Useful when doing live animation.
     */
    preload(): FaceARKitLoader {
        for (let blendshape = 1; blendshape < blendshapeNames.length; ++blendshape) {
            this.getTarget(blendshape)
        }
        return this
    }

    getTarget(blendshape: number): Target {
        if (this.targets[blendshape] !== undefined) {
            return this.targets[blendshape]
        }
        const name = blendshapeNames[blendshape]
        const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
        for (let i = 0; i < this.neutral.xyz.length; ++i) {
            dst.xyz[i] = dst.xyz[i] * this.scale
        }
        const target = new Target()
        target.diff(this.neutral.xyz, dst.xyz)
        this.targets[blendshape] = target
        return target
    }
}
