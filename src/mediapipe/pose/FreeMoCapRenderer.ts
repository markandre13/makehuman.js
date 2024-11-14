import { Application } from "Application"
import { vec3 } from "gl-matrix"
import { ArrowMesh } from "mediapipe/ArrowMesh"
import { RenderHandler, GLView } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import { BlazePoseConverter } from "./BlazePoseConverter"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"
import { Blaze } from "./Blaze"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { renderAxes } from "./renderAxes"
import { renderReconstructedBlaze } from "./renderReconstructedBlaze"

export class FreeMoCapRenderer extends RenderHandler {
    mesh0?: RenderMesh
    mesh1?: RenderMesh

    arrowMesh?: ArrowMesh
    bpl = new BlazePoseLandmarks()
    bpc = new BlazePoseConverter()

    line0 = [
        11, 12, 12, 24, 24, 23, 23, 11, 11, 13, 13, 15, 12, 14, 14, 16, 24, 26, 26, 28, 23, 25, 25, 27,

        20, 18, 18, 16, 16, 20, 15, 19, 19, 17, 17, 15,

        28, 30, 30, 32, 32, 28, 27, 31, 31, 29, 29, 27,

        8, 7, 7, 0, 0, 8,
    ]

    override paint(app: Application, view: GLView): void {
        if (view.overlay.children.length !== 0) {
            view.overlay.replaceChildren()
        }

        if (app.frontend._poseLandmarks === undefined) {
            return
        }

        if (this.arrowMesh === undefined) {
            this.arrowMesh = new ArrowMesh(view.gl, 1)
        }

        const canvas = view.canvas as HTMLCanvasElement
        const gl = view.gl
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)

        gl.disable(gl.CULL_FACE)
        gl.depthMask(true)

        const programRGBA = view.programRGBA
        const programColor = view.programColor

        const projectionMatrix = createProjectionMatrix(canvas)
        const modelViewMatrix = createModelViewMatrix(view.ctx.rotateX, view.ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        // adjust freemocap data to opengl screen space
        const landmarks = app.frontend._poseLandmarks
        const data = new Float32Array(landmarks)

        // move blaze skeleton to origin to ease debugging
        if (false) {
            this.bpl.data = landmarks
            const root = vec3.add(vec3.create(), this.bpl.getVec(Blaze.LEFT_HIP), this.bpl.getVec(Blaze.RIGHT_HIP))
            vec3.scale(root, root, 0.5)
            for (let i = 0; i < data.length; i += 3) {
                data[i] -= root[0]
                data[i + 1] -= root[1]
                data[i + 2] -= root[2]
            }
        }
        this.bpl.data = data

        if (this.mesh0 === undefined) {
            this.mesh0 = new RenderMesh(gl, data, this.line0, undefined, undefined, false)
        } else {
            this.mesh0.update(data)
        }

        // draw blaze
        programRGBA.setColor([0, 0.5, 1, 1])
        this.mesh0.bind(programRGBA)
        this.mesh0.draw(programRGBA, gl.LINES)

        // draw rotations
        programColor.init(projectionMatrix, modelViewMatrix, normalMatrix)
        renderAxes(programColor, this.arrowMesh, modelViewMatrix, this.bpl, this.bpc)

        renderReconstructedBlaze(this, view)
    }
}
