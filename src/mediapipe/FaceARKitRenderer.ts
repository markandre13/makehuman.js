import { Application } from "Application"
import { GLView, Projection, RenderHandler } from "render/GLView"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { Frontend_impl } from "../net/Frontend_impl"
import { isZero } from "mesh/HumanMesh"
import { blendshapeNames } from "./blendshapeNames"
import { FaceARKitLoader } from "./FaceARKitLoader"
import { mat4, vec3 } from "gl-matrix"

/**
 * Render MediaPipe's blendshape using Apples ARKit Mesh
 */
export class FaceARKitRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    blendshapeSet: FaceARKitLoader
    // neutral: WavefrontObj
    // targets = new Array<Target>(blendshapeNames.length)

    constructor(frontend: Frontend_impl) {
        super()
        this.blendshapeSet = FaceARKitLoader.getInstance().preload()
        this.frontend = frontend
    }

    override paint(app: Application, view: GLView): void {
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA
        const neutral = this.blendshapeSet.neutral

        const vertex = new Float32Array(neutral.xyz.length)
        vertex.set(this.blendshapeSet.neutral!.xyz)
        // apply blendshapes
        for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const weight = this.frontend.getBlendshapeWeight(blendshapeNames[blendshape])
            if (isZero(weight)) {
                continue
            }
            this.blendshapeSet.getTarget(blendshape)?.apply(vertex, weight)
        }

        // scale and rotate
        const t = this.frontend.transform!!
        // prettier-ignore
        const m = mat4.fromValues(
             t[0],  t[1],  t[2],  t[3],
             t[4],  t[5],  t[6],  t[7],
             t[8],  t[9], t[10], t[11],
            t[12], t[13], t[14], t[15]
        )
        const s = 160
        mat4.scale(m, m, vec3.fromValues(s, s, s))

        const v = vec3.create()
        for (let i = 0; i < vertex.length; i += 3) {
            v[0] = vertex[i]
            v[1] = vertex[i + 1]
            v[2] = vertex[i + 2]
            vec3.transformMat4(v, v, m)
            vertex[i] = v[0]
            vertex[i + 1] = v[1]
            vertex[i + 2] = v[2]
        }

        if (this.mesh) {
            this.mesh.update(vertex)
        } else {
            this.mesh = new RenderMesh(gl, vertex, neutral.fxyz, undefined, undefined, false)
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
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}
