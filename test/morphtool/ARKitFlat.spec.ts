import { expect, use } from "chai"
import { chaiAlmost } from "../chai/chaiAlmost"

import { ARKitFlat } from "../../src/morphtool/ARKitFlat"
import { di } from "../../src/lib/di"
import { mock } from "../mock"
import { WavefrontObj } from "../../src/mesh/WavefrontObj"
import { Blendshape } from "../../src/blendshapes/BlendShape"
import { MorphTarget } from "../../src/target/MorphTarget"
import { ARKitBlendshapeMesh } from "morphtool/ARKitBlendshapeMesh"

use(chaiAlmost())

describe("ARKitFlat", function () {
    beforeEach(() => {
        const neutral = mock(WavefrontObj)
        neutral.xyz = new Float32Array([
            -1, 1, 0,
            1, 1, 0,
            1, -1, 0,
            -1, -1, 0
        ])
        neutral.fxyz = [
            0, 1, 2,
            0, 2, 3,
        ]
        const target = new MorphTarget()
        target.indices = new Uint16Array([
            0, 3
        ])
        target.dxyz = new Float32Array([
            1, 2, 3,
            4, 5, 6
        ])
        const loader: ARKitBlendshapeMesh = mock(ARKitBlendshapeMesh, {
            preload: () => loader,
            getNeutral: () => neutral,
            getMorphTarget: (blendshape: Blendshape) => target
        })
        loader._neutral = neutral
        di.clear()
        di.single(ARKitBlendshapeMesh, () => loader)
    })
    it("contains a mesh with triangles that share no vertices", () => {
        const gl = {} as WebGL2RenderingContext
        const flat = new ARKitFlat(gl)
        // since arkit uses triangles, the size of indices should be the same as neutral
        // but without duplicate indices
        expect(Array.from(flat.indices.data)).to.deep.equal([0, 1, 2, 3, 4, 5])
        expect(Array.from(flat.vertices.data)).to.deep.almost.equal([
            -10.800000190734863, 17.831199645996094, 0.9300000071525574, // 0 <- 0
            10.800000190734863, 17.831199645996094, 0.9300000071525574,  // 1 <- 1
            10.800000190734863, -3.7688002586364746, 0.9300000071525574, // 2 <- 2

            -10.800000190734863, 17.831199645996094, 0.9300000071525574, // 3 <- 0
            10.800000190734863, -3.7688002586364746, 0.9300000071525574, // 4 <- 2
            -10.800000190734863, -3.7688002586364746, 0.9300000071525574 // 5 <- 3
        ])
    })
})