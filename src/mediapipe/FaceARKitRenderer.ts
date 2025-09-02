import { Application } from "Application"
import { RenderHandler } from 'render/glview/RenderHandler'
import { RenderMesh } from "render/RenderMesh"
import { FaceARKitLoader } from "./FaceARKitLoader"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { RenderView } from "render/glview/RenderView"
import { di } from "lib/di"

/**
 * Render MediaPipe's blendshape using Apples ARKit Mesh
 */
export class FaceARKitRenderer extends RenderHandler {
    mesh!: RenderMesh
    blendshapeModel: BlendshapeModel
    blendshapeSet?: FaceARKitLoader

    constructor(blendshapeModel: BlendshapeModel) {
        super()
        this.blendshapeModel = blendshapeModel
    }
    override defaultCamera() {
        return di.get(Application).headCamera()
    }
    override paint(app: Application, view: RenderView): void {
        if (this.blendshapeSet === undefined) {
            this.blendshapeSet = FaceARKitLoader.getInstance().preload()
        }
        const gl = view.gl
        const ctx = view.ctx
        const shaderShadedMono = view.shaderShadedMono

        const vertex = this.blendshapeSet.getVertex(this.blendshapeModel)
        const neutral = this.blendshapeSet.neutral!

        if (this.mesh) {
            this.mesh.update(vertex)
        } else {
            this.mesh = new RenderMesh(gl, vertex, neutral!.fxyz, undefined, undefined, false)
        }

        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()

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
        gl.drawElements(gl.TRIANGLES, neutral!.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}
