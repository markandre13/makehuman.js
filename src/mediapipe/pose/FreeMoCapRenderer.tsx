import { Application } from "Application"
import { mat4, vec3 } from "gl-matrix"
import { ArrowMesh } from "mediapipe/ArrowMesh"
import { RenderHandler, GLView } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import { Blaze, BlazePoseConverter, BlazePoseLandmarks } from "./BlazePoseConverter"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { deg2rad, rad2deg } from "lib/calculateNormals"

let a = 0

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

        // this.debug()

        // adjust freemocap data to opengl screen space
        const s = 0.01
        const landmarks = app.frontend._poseLandmarks
        const data = new Float32Array(landmarks)

        // move blaze skeleton to origin to ease debugging
        this.bpl.data = landmarks
        // const root = vec3.add(vec3.create(), this.bpl.getVec(Blaze.LEFT_HIP), this.bpl.getVec(Blaze.RIGHT_HIP))
        // vec3.scale(root, root, 0.5)
        const root = vec3.create()

        for (let i = 0; i < data.length; i += 3) {
            const x = data[i] - root[0]
            const y = data[i + 1] - root[1]
            const z = data[i + 2] - root[2]

            data[i] = x * s
            data[i + 1] = z * s
            data[i + 2] = y * s
        }
        this.bpl.data = data

        if (this.mesh0 === undefined) {
            this.mesh0 = new RenderMesh(gl, data, this.line0, undefined, undefined, false)
        } else {
            this.mesh0.update(data)
        }

        // draw blaze
        programRGBA.setColor([1, 1, 1, 1])
        this.mesh0.bind(programRGBA)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)

/*
        // draw blaze model from which we calculate additional rotations
        // THERE'S JUMP FROM 160 to 161... looks like when upper & lower leg are almost in a straight line
        programRGBA.setColor([1, 0.5, 0, 1])
        const pose2 = this.bpl.clone()

        let leftUpperLeg = this.bpc.getLeftUpperLeg(this.bpl)
        const inv = mat4.create()
        mat4.invert(inv, leftUpperLeg)

        const t = mat4.create()
        // mat4.rotateX(t, t, deg2rad(-90))
        mat4.mul(t, t, inv)
        pose2.mul(t)

        this.mesh0.bind(programRGBA)
        this.mesh0.update(pose2.data)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)
*/
        // draw rotations
        this.bpl.data = data
        const shoulderLeft = this.bpl.getVec0(Blaze.LEFT_SHOULDER)
        const shoulderRight = this.bpl.getVec0(Blaze.RIGHT_SHOULDER)
        const hipLeft = this.bpl.getVec0(Blaze.LEFT_HIP)
        const hipRight = this.bpl.getVec0(Blaze.RIGHT_HIP)
        const kneeLeft = this.bpl.getVec0(Blaze.LEFT_KNEE)
        const kneeRight = this.bpl.getVec0(Blaze.RIGHT_KNEE)
        const ankleLeft = this.bpl.getVec0(Blaze.LEFT_ANKLE)

        const hipCenter = vec3.add(vec3.create(), hipLeft, hipRight)
        vec3.scale(hipCenter, hipCenter, 0.5)

        const shoulderCenter = vec3.add(vec3.create(), shoulderLeft, shoulderRight)
        vec3.scale(shoulderCenter, shoulderCenter, 0.5)

        programColor.init(projectionMatrix, modelViewMatrix, normalMatrix)

        // HIP
        const m = mat4.create()
        mat4.translate(m, modelViewMatrix, hipCenter)
        mat4.mul(m, m, this.bpc.getHip(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // SHOULDER
        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, shoulderCenter)
        mat4.mul(m, m, this.bpc.getShoulder(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // LEFT UPPER LEG
        const leftUpperLegCenter = vec3.create()
        vec3.sub(leftUpperLegCenter, kneeLeft, hipLeft)
        vec3.scale(leftUpperLegCenter, leftUpperLegCenter, 0.5)
        vec3.add(leftUpperLegCenter, leftUpperLegCenter, hipLeft)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, leftUpperLegCenter)
        mat4.mul(m, m, this.bpc.getLeftUpperLegWithAdjustment(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // LEFT LOWER LEG
        mat4.identity(m)

        const leftLowerLegCenter = vec3.create()
        vec3.sub(leftLowerLegCenter, ankleLeft, kneeLeft)
        vec3.scale(leftLowerLegCenter, leftLowerLegCenter, 0.5)
        vec3.add(leftLowerLegCenter, leftLowerLegCenter, kneeLeft)

        mat4.translate(m, modelViewMatrix, leftLowerLegCenter)
        mat4.mul(m, m, this.bpc.getLeftLowerLeg(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // * tracking with inert motion sensors starts with rotations.
        // * with video, we start with positions and the angle might not be accurate.
        //   i might be that using inverse kinematics along the process might be a
        //   better approach...

        // EXPERIMENTAL ZONE

        // this.mesh0.update(data)

        // draw blaze

        // let leftUpperLeg = this.bpc.getLeftUpperLeg(this.bpl)
        // const pose2 = this.bpl.clone()
        // const m0 = mat4.clone(modelViewMatrix)
        // // mat4.translate(m0, m0, kneeLeft)
        // // pose2.mul(m0)
        // // const inv = mat4.create()
        // // mat4.invert(inv, leftUpperLeg)
        // // pose2.mul(inv)

        // programRGBA.setColor([1, 0.5, 0, 1])
        // this.mesh0.update(pose2.data)
        // this.mesh0.bind(programRGBA)
        // gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)
    }

    debug() {
        const debug = document.getElementById("debug")
        if (debug != null) {
            const v = this.bpl.getVec(Blaze.LEFT_HIP)
            debug.innerHTML = `V (${v[0].toFixed(4)}, ${v[1].toFixed(4)}, ${v[2].toFixed(4)}`
        }
    }
}
