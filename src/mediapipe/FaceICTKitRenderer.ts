import { Application } from "Application"
import { RenderHandler } from 'render/glview/RenderHandler'
// import {
//     createModelViewMatrix,
//     createNormalMatrix,
//     createProjectionMatrix,
//     prepareCanvas,
//     prepareViewport,
// } from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { isZero } from "mesh/HumanMesh"
import { blendshapeNames } from "./blendshapeNames"
import { FaceICTKitLoader } from "./FaceICTKitLoader"
import { mat4, vec3 } from "gl-matrix"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { RenderView } from "render/glview/RenderView"
import { Projection } from "gl/Projection"

/**
 * Render MediaPipe's blendshape using ICT's FaceKit Mesh
 */
export class FaceICTKitRenderer extends RenderHandler {
    mesh!: RenderMesh
    blendshapeModel: BlendshapeModel
    blendshapeSet?: FaceICTKitLoader

    constructor(blendshapeModel: BlendshapeModel) {
        super()
        this.blendshapeModel = blendshapeModel
    }

    override paint(app: Application, view: RenderView): void {
        if (this.blendshapeSet === undefined) {
            this.blendshapeSet = FaceICTKitLoader.getInstance() // .preload()
        }

        const gl = view.gl
        const ctx = view.ctx
        const shaderShadedMono = view.shaderShadedMono

        const vertex = new Float32Array(this.blendshapeSet.neutral.xyz.length)
        vertex.set(this.blendshapeSet.neutral!.xyz)
        for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const weight = this.blendshapeModel.getBlendshapeWeight(blendshapeNames[blendshape])
            if (isZero(weight)) {
                continue
            }
            this.blendshapeSet.targets[blendshape].apply(vertex, weight)
        }

        // BEGIN COPY'N PASTE FROM FACEARKIT RENDERER
        // scale and rotate
        const t = this.blendshapeModel.transform!!
        // prettier-ignore
        const m = mat4.fromValues(
            t[0], t[1], t[2], 0,
            t[4], t[5], t[6], 0,
            t[8], t[9], t[10], 0,
            0, 0, 0, 1
        )

        const s = 0.5
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
        // END COPY'N PASTE FROM FACEARKIT RENDERER

        if (this.mesh) {
            this.mesh.update(vertex)
        } else {
            this.mesh = new RenderMesh(gl, vertex, this.blendshapeSet.neutral.fxyz, undefined, undefined, true)
        }

        view.prepareCanvas()
        const {projectionMatrix, modelViewMatrix, normalMatrix} = view.prepare()

        // const canvas = app.glview.canvas as HTMLCanvasElement
        // prepareCanvas(canvas)
        // prepareViewport(gl, canvas)
        // const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        // const modelViewMatrix = createModelViewMatrix(ctx)
        // const normalMatrix = createNormalMatrix(modelViewMatrix)

        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])
        this.mesh.bind(shaderShadedMono)
        // const length = this.neutral.fxyz.length
        const length = 11144 * 6 // head and neck
        gl.drawElements(gl.TRIANGLES, length, gl.UNSIGNED_SHORT, 0)
    }
}
