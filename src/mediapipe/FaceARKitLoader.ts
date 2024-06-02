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

    // private scale = 1;
    private targets: Target[]
    private name2index: Map<string, number>
    neutral?: WavefrontObj

    constructor() {
        this.targets = new Array<Target>(blendshapeNames.length)
        this.name2index = new Map<string, number>()
        blendshapeNames.forEach((name, index) => this.name2index.set(name, index))
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

    getNeutral(): WavefrontObj {
        if (this.neutral === undefined) {
            this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
        }
        return this.neutral
    }

    getTarget(blendshape: number | string): Target | undefined {
        this.getNeutral()
        if (typeof blendshape === "string") {
            blendshape = this.name2index.get(blendshape)!
        }
        if (blendshape === 0) {
            return undefined
        }
        if (this.targets[blendshape] !== undefined) {
            return this.targets[blendshape]
        }
        const name = blendshapeNames[blendshape]
        const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
        // for (let i = 0; i < this.neutral.xyz.length; ++i) {
        //     dst.xyz[i] = dst.xyz[i] * this.scale
        // }
        const target = new Target()
        target.diff(this.neutral!.xyz, dst.xyz)
        this.targets[blendshape] = target
        return target
    }
}
