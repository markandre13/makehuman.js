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
import { mat4, vec3 } from "gl-matrix"
import { drawArrow } from "chordata/renderChordata"
import { BlendShapeEditor } from "BlendShapeEditor"

/**
 * Renders 4 views: 2x MakeHuman Head, 2x Blendshape
 */
export class QuadRenderer extends RenderHandler {
    frontend: Frontend_impl
    editor: BlendShapeEditor

    blendshapeSet?: FaceARKitLoader
    mesh!: RenderMesh

    constructor(frontend: Frontend_impl, editor: BlendShapeEditor) {
        super()
        this.frontend = frontend
        this.editor = editor
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

        const w = canvas.width / 2
        const h = canvas.height / 2

        gl.viewport(w, h, w, h)
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
        programRGBA.setModelViewMatrix(createModelViewMatrix(ctx.rotateX, ctx.rotateY - 45))

        app.updateManager.updateIt()

        gl.viewport(w, 0, w, h)
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)

        gl.viewport(0, 0, w, h)
        // gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)

        gl.viewport(0, h, w, h)
        modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY, true)
        programRGBA.setModelViewMatrix(modelViewMatrix)
        programTex.useProgram()
        programTex.setModelViewMatrix(modelViewMatrix)
        // programRGBA.useProgram()
        app.updateManager.updateIt()
        drawHumanCore(app, view)

        gl.viewport(0, 0, w, h)
        modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY - 45, true)
        // programTex.useProgram()
        programTex.setModelViewMatrix(modelViewMatrix)
        programRGBA.useProgram()
        programRGBA.setModelViewMatrix(modelViewMatrix)

        drawHumanCore(app, view)

        // 

        if (app.skeleton.hasBone(this.editor.currentBone.value)) {
            const bone = app.skeleton.getBone(this.editor.currentBone.value)

            let m = mat4.create()

            mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(bone.headPos[0], bone.headPos[1], bone.headPos[2]))
            const s = 0.4
            mat4.scale(m, m, vec3.fromValues(s,s,s))

            const vertex: number[] = []
            const fvertex: number[] = []
            const color: number[] = []
            const index: number[] = []

            mat4.rotateY(m, m, (2 * Math.PI) / 4)
            drawArrow(m, [1, 0, 0], vertex, fvertex, color, index)
            mat4.rotateY(m, m, (2 * Math.PI) / 4)
            drawArrow(m, [0, 1, 0], vertex, fvertex, color, index)
            mat4.rotateX(m, m, (-2 * Math.PI) / 4)
            drawArrow(m, [0, 0, 1], vertex, fvertex, color, index)

            const glVertex = gl.createBuffer()!
            gl.bindBuffer(gl.ARRAY_BUFFER, glVertex)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW)

            const glNormal = gl.createBuffer()!
            gl.bindBuffer(gl.ARRAY_BUFFER, glNormal)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fvertex), gl.STATIC_DRAW)

            const glColor = gl.createBuffer()!
            gl.bindBuffer(gl.ARRAY_BUFFER, glColor)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW)

            const glIndices = gl.createBuffer()!
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glIndices)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW)

            const colorShader = view.programColor
            colorShader.init(projectionMatrix, modelViewMatrix, normalMatrix)

            colorShader.bind(glIndices, glVertex, glNormal, glColor)
            gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
        }
    }
}
