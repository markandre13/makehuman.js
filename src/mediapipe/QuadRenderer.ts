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
import { FaceARKitLoader } from "./FaceARKitLoader"
import { drawHumanCore } from "render/RenderHuman"
import { mat4 } from "gl-matrix"
import { BlendShapeEditor } from "blendshapes/BlendShapeEditor"
import { ArrowMesh } from "./ArrowMesh"

/**
 * Renders 4 views: 2x MakeHuman Head, 2x Blendshape
 */
export class QuadRenderer extends RenderHandler {
    editor: BlendShapeEditor

    arkit?: FaceARKitLoader
    mesh!: RenderMesh
    arrowMesh!: ArrowMesh

    constructor(editor: BlendShapeEditor) {
        super()
        this.editor = editor
    }

    override paint(app: Application, view: GLView): void {
        if (this.arkit === undefined) {
            this.arkit = FaceARKitLoader.getInstance().preload()
        }
        if (this.arrowMesh === undefined) {
            this.arrowMesh = new ArrowMesh(view.gl)
        }
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA
        const programTex = view.programTex
        const neutral = this.arkit.neutral!

        const vertex = this.arkit.getVertex(app.updateManager.getBlendshapeModel()!)
        if (this.mesh === undefined) {
            this.mesh = new RenderMesh(gl, vertex, neutral.fxyz, undefined, undefined, false)
        } else {
            this.mesh.update(vertex)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        let modelViewMatrix = createModelViewMatrix(ctx)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programTex.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)

        const w = canvas.width / 2
        const h = canvas.height / 2

        // draw arkit blendshape
        gl.viewport(w, h, w, h)
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)

        gl.viewport(w, 0, w, h)
        ctx.rotateY -= 45
        programRGBA.setModelViewMatrix(createModelViewMatrix(ctx))
        ctx.rotateY += 45
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)

        // draw makehuman
        app.updateManager.updateIt()

        gl.viewport(0, h, w, h)
        modelViewMatrix = createModelViewMatrix(ctx, true)
        programRGBA.setModelViewMatrix(modelViewMatrix)
        programTex.useProgram()
        programTex.setModelViewMatrix(modelViewMatrix)
        // programRGBA.useProgram()
        app.updateManager.updateIt()
        drawHumanCore(app, view)

        gl.viewport(0, 0, w, h)
        ctx.rotateY -= 45
        modelViewMatrix = createModelViewMatrix(ctx, true)
        ctx.rotateY += 45
        // programTex.useProgram()
        programTex.setModelViewMatrix(modelViewMatrix)
        programRGBA.useProgram()
        programRGBA.setModelViewMatrix(modelViewMatrix)

        drawHumanCore(app, view)

        // draw arrow
        if (app.skeleton.hasBone(this.editor.currentBone.value)) {
            gl.enable(gl.CULL_FACE)
            gl.cullFace(gl.BACK)
            gl.depthMask(true)
            gl.disable(gl.BLEND)

            const bone = app.skeleton.getBone(this.editor.currentBone.value)
            mat4.mul(modelViewMatrix, modelViewMatrix, bone.matPoseGlobal!)

            const colorShader = view.programColor
            colorShader.init(projectionMatrix, modelViewMatrix, normalMatrix)
            this.arrowMesh.draw(view.programColor)
        }
    }
}

