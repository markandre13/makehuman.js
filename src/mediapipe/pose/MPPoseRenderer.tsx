import { Application } from "Application"
import { mat4 } from "gl-matrix"
import { RenderHandler, GLView } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import { RGBAShader } from "render/shader/RGBAShader"
import { prepareCanvas, prepareViewport, createProjectionMatrix, createNormalMatrix, createModelViewMatrix } from "render/util"


export class MPPoseRenderer extends RenderHandler {
    override paint(app: Application, view: GLView): void {
        if (app.frontend._poseLandmarks === undefined) {
            return
        }

        const canvas = view.canvas as HTMLCanvasElement
        const gl = view.gl
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)

        gl.disable(gl.CULL_FACE)
        gl.depthMask(true)

        const programRGBA = new RGBAShader(gl)

        const projectionMatrix = createProjectionMatrix(canvas)
        // const modelViewMatrix = mat4.create()
        const modelViewMatrix = createModelViewMatrix(view.ctx.rotateX, view.ctx.rotateY)

        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0, 10]) // obj file face centered
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        programRGBA.setColor([1.0, 1.0, 1.0, 1])

        const line = [
            11, 12, 12, 24, 24, 23, 23, 11, 11, 13, 13, 15, 12, 14, 14, 16, 24, 26, 26, 28, 23, 25, 25, 27,

            20, 18, 18, 16, 16, 20, 15, 19, 19, 17, 17, 15,

            28, 30, 30, 32, 32, 28, 27, 31, 31, 29, 29, 27,

            8, 7, 7, 0, 0, 8,
        ]
        const mesh0 = new RenderMesh(gl, app.frontend._poseLandmarks, line, undefined, undefined, false)

        mesh0.bind(programRGBA)
        gl.drawElements(gl.LINES, line.length, gl.UNSIGNED_SHORT, 0)
    }
}
