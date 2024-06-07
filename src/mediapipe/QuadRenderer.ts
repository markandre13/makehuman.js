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
import { drawHumanCore } from "render/RenderHuman"

/**
 * Renders 4 views: 2x MakeHuman Head, 2x Blendshape
 */
export class QuadRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    blendshapeSet?: FaceARKitLoader

    constructor(frontend: Frontend_impl) {
        super()
        this.frontend = frontend
    }

    override paint(app: Application, view: GLView): void {
        if (this.blendshapeSet === undefined) {
            this.blendshapeSet = FaceARKitLoader.getInstance().preload()
        }
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA
        const programTex = view.programTex
        const neutral = this.blendshapeSet.neutral!

        const vertex = this.blendshapeSet.getVertex(this.frontend)
        if (this.mesh) {
            this.mesh.update(vertex)
        } else {
            this.mesh = new RenderMesh(gl, vertex, neutral.fxyz, undefined, undefined, false)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        let modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programTex.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
       
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)

        const w = canvas.width/2
        const h = canvas.height/2

        gl.viewport(w, h, w,h)
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
        programRGBA.setModelViewMatrix(createModelViewMatrix(ctx.rotateX, ctx.rotateY - 45))

        app.updateManager.updateIt()

        gl.viewport(w, 0, w,h)
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)

        gl.viewport(0, 0, w,h)
        // gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)

        gl.viewport(0, h, w,h)
        modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY, true)
        programRGBA.setModelViewMatrix(modelViewMatrix)
        programTex.useProgram()
        programTex.setModelViewMatrix(modelViewMatrix)
        // programRGBA.useProgram()
        drawHumanCore(app, view)

        gl.viewport(0, 0, w,h)
        modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY - 45, true)
        // programTex.useProgram()
        programTex.setModelViewMatrix(modelViewMatrix)
        programRGBA.useProgram()
        programRGBA.setModelViewMatrix(modelViewMatrix)

        drawHumanCore(app, view)
    }
}