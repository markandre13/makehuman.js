import { WavefrontObj } from "mesh/WavefrontObj"
import { Target } from "target/Target"
import { blendshapeNames } from "./blendshapeNames"

export class FaceICTKitLoader {
    private static _instance?: FaceICTKitLoader
    static getInstance() {
        if (FaceICTKitLoader._instance === undefined) {
            FaceICTKitLoader._instance = new FaceICTKitLoader()
        }
        return FaceICTKitLoader._instance
    }

    neutral: WavefrontObj
    targets = new Array<Target>(blendshapeNames.length);

    constructor() {
        this.neutral = new WavefrontObj("data/blendshapes/ict/_neutral.obj")
        const indices = 11247
        for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            let name = blendshapeNames[blendshape]
            switch (name) {
                case "browInnerUp":
                    name = "browInnerUp_L"
                    break
                case "cheekPuff":
                    name = "cheekPuff_L"
                    break
            }
            let dst = new WavefrontObj(`data/blendshapes/ict/${name}.obj`)
            const target = new Target()
            target.diff(this.neutral.xyz, dst.xyz, indices)
            if (name === "browInnerUp_L") {
                dst = new WavefrontObj(`data/blendshapes/ict/browInnerUp_R.obj`)
                target.apply(dst.xyz, 1)
                target.diff(this.neutral.xyz, dst.xyz, indices)
            }
            if (name === "cheekPuff_L") {
                dst = new WavefrontObj(`data/blendshapes/ict/cheekPuff_R.obj`)
                target.apply(dst.xyz, 1)
                target.diff(this.neutral.xyz, dst.xyz, indices)
            }
            this.targets[blendshape] = target
        }
    }
}
