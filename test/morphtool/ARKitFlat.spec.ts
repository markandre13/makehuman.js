import { ARKitFlat } from "../../src/morphtool/ARKitFlat"
import { di } from "../../src/lib/di"
import { FaceARKitLoader } from "../../src/mediapipe/FaceARKitLoader"
import { mock } from "../mock"
import { WavefrontObj } from "../../src/mesh/WavefrontObj"

describe("ARKitFlat", function() {
    beforeEach(() => {
        const neutral = mock(WavefrontObj)
        neutral.fxyz = []
        const loader: FaceARKitLoader = mock(FaceARKitLoader, {
            preload: () => loader,
            getNeutral: () => neutral
        })
        loader.neutral = neutral
        di.clear()
        di.single(FaceARKitLoader, () => loader)
    })
    it("xxx", () => {
        const gl = {} as WebGL2RenderingContext
        const flat = new ARKitFlat(gl)
        // const t = flat.getTarget(Blendshape.jawOpen)
    })
})