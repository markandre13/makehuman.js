import { Application } from "Application"
import { GLView, RenderHandler } from "GLView"
import { WavefrontObj } from "mesh/WavefrontObj"
import {
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { Frontend_impl } from "./Frontend_impl"
import { RGBAShader } from "render/shader/RGBAShader"
import { mat4 } from "gl-matrix"

/**
 * Render MediaPipe's 3d face landmarks
 */
export class FaceLandmarkRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    neutral: WavefrontObj

    constructor(frontend: Frontend_impl) {
        super()
        this.frontend = frontend
        this.neutral = new WavefrontObj("data/3dobjs/mediapipe_canonical_face_model.obj")
    }
    override paint(app: Application, view: GLView): void {
        if (this.frontend.landmarks === undefined) {
            return
        }

        const gl = (view.canvas.getContext('webgl2') || view.canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
        if (gl == null) {
            throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
        }
    
        const programRGBA = new RGBAShader(gl)
        prepareCanvas(view.canvas)
        prepareViewport(gl, view.canvas)
        const projectionMatrix = createProjectionMatrix(view.canvas)
        const modelViewMatrix = mat4.create()
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0, -0.5]) // obj file face centered
        const normalMatrix = createNormalMatrix(modelViewMatrix)
    
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        const xyz = this.frontend.landmarks
        const fxyz = this.neutral.fxyz
        center(xyz)
    
        programRGBA.setColor([1, 0.8, 0.7, 1])
        const mesh0 = new RenderMesh(gl, xyz, fxyz, undefined, undefined, false)
        mesh0.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, fxyz.length, gl.UNSIGNED_SHORT, 0)

    }
}

function center(xyz: Float32Array) {
    const originX = 0.5
    const originY = 0.5
    const originZ = -0.2

    for (let i = 0; i < xyz.length; i += 3) {
        xyz[i] -= originX
        xyz[i + 1] = (originY - xyz[i + 1]) * 0.8
        xyz[i + 2] = (originZ - xyz[i + 2])
    }
}
