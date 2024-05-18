import { Application } from "Application"
import { GLView, Projection, RenderHandler } from "GLView"
import { WavefrontObj } from "mesh/WavefrontObj"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { Frontend_impl } from "./Frontend_impl"
import { Target } from "target/Target"
import { isZero } from "mesh/HumanMesh"
import { blendshapeNames } from "./blendshapeNames"

/**
 * Render MediaPipe's blendshape using Apples ARKit Mesh
 */
export class FaceARKitRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    neutral: WavefrontObj
    targets = new Array<Target>(blendshapeNames.length)

    constructor(frontend: Frontend_impl) {
        super()
        this.frontend = frontend

        const scale = 80
        this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
        for (let i = 0; i < this.neutral.xyz.length; ++i) {
            this.neutral.xyz[i] = this.neutral.xyz[i] * scale
        }
        for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const name = blendshapeNames[blendshape]
            const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
            for (let i = 0; i < this.neutral.xyz.length; ++i) {
                dst.xyz[i] = dst.xyz[i] * scale
            }
            const target = new Target()
            target.diff(this.neutral.xyz, dst.xyz)
            this.targets[blendshape] = target
        }
    }

    override paint(app: Application, view: GLView): void {
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        const vertex = new Float32Array(this.neutral.xyz.length)
        vertex.set(this.neutral!.xyz)
        for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const weight = this.frontend.getBlendshapeWeight(blendshapeNames[blendshape])
            if (isZero(weight)) {
                continue
            }
            this.targets[blendshape].apply(vertex, weight)
        }
        if (this.mesh) {
            this.mesh.update(vertex)
        } else {
            this.mesh = new RenderMesh(gl, vertex, this.neutral.fxyz, undefined, undefined, false)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, this.neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}
