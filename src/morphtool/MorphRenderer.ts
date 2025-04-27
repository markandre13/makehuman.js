import { Application } from 'Application'
import { mat4, vec2, vec4 } from 'gl-matrix'
import { findVertex } from 'lib/distance'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'
import { BaseMeshGroup } from 'mesh/BaseMeshGroup'
import { GLView, Projection, RenderHandler } from 'render/GLView'
import { RenderMesh } from 'render/RenderMesh'
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from 'render/util'
import { BooleanModel, NumberModel, span, text } from 'toad.js'

// i'm not sure if i should go with the webgl classes i've created so far...

export class MorphToolModel {
    isARKitActive = new BooleanModel(false, {label: "MH / ARKit"})
    showBothMeshes = new BooleanModel(true, {label: "Show both meshes"})
}

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    private app: Application
    private model: MorphToolModel
    
    private indexOfSelectedVertex: number = 0
    
    private vertexARKitOrig!: Float32Array
    private vertexARKitFlat!: Float32Array
    private facesARKitFlat!: number[]
    private meshARKitFlat!: RenderMesh

    private vertexMHOrig!: Float32Array
    private vertexMHFlat!: Float32Array
    private facesMHFlat!: number[]
    private meshMHFlat!: RenderMesh

    constructor(app: Application, model: MorphToolModel) {
        super()
        this.app = app
        this.model = model
        this.model.isARKitActive.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
        this.model.showBothMeshes.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
    }

    override onpointerdown(ev: PointerEvent): boolean  {       
        return true
        // const canvas = this.app.glview.canvas as HTMLCanvasElement
        // const ctx = this.app.glview.ctx
        // let modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY, true)
        // const index = findVertex(vec2.fromValues(ev.offsetX, ev.offsetY), this.vertexARKitFlat, canvas, modelViewMatrix)
        // if (index === undefined) {
        //     return true
        // }
        // this.indexOfSelectedVertex = index
        // this.app.updateManager.invalidateView()
        // return false
    }
    // override onpointermove(ev: PointerEvent): boolean  {
    //     console.log(`pointermove`)
    //     return false
    // }
    // override onpointerup(ev: PointerEvent): boolean  {
    //     console.log(`pointerup`)
    //     return false
    // }

    override paint(app: Application, view: GLView): void {
        // prepare
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA       
        if (this.meshARKitFlat === undefined) {
            this.initializeMHFlat(app, gl)
            this.initializeARKit(app, gl)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(
            canvas,
            ctx.projection === Projection.PERSPECTIVE
        )
        let modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY, true)
        const normalMatrix = createNormalMatrix(modelViewMatrix)
  
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        gl.depthMask(true)
        const alpha = 0.5

        if (!this.model.isARKitActive.value) {
            // draw makehuman
            gl.enable(gl.CULL_FACE)
            gl.cullFace(gl.BACK)
            gl.disable(gl.BLEND)

            programRGBA.setColor([1, 0.8, 0.7, 1])
            this.meshMHFlat.bind(programRGBA)
            gl.drawElements(gl.TRIANGLES, this.facesMHFlat.length, gl.UNSIGNED_SHORT, 0)

            // draw arkit neutral
            if (this.model.showBothMeshes.value) {
                gl.disable(gl.CULL_FACE)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

                programRGBA.setColor([0, 0.5, 1, alpha])
                this.meshARKitFlat.bind(programRGBA)
                gl.drawElements(gl.TRIANGLES, this.facesARKitFlat.length, gl.UNSIGNED_SHORT, 0)
            }
        } else {
            
            // draw arkit neutral
            gl.disable(gl.CULL_FACE)
            gl.cullFace(gl.BACK)
            gl.disable(gl.BLEND)

            programRGBA.setColor([0, 0.5, 1, 1])
            this.meshARKitFlat.bind(programRGBA)
            gl.drawElements(gl.TRIANGLES, this.facesARKitFlat.length, gl.UNSIGNED_SHORT, 0)

            // draw makehuman
            if (this.model.showBothMeshes.value) {
                gl.enable(gl.CULL_FACE)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

                programRGBA.setColor([1, 0.8, 0.7, alpha])
                this.meshMHFlat.bind(programRGBA)
                gl.drawElements(gl.TRIANGLES, this.facesMHFlat.length, gl.UNSIGNED_SHORT, 0)
            }
        }

        // add text label
        // ---------------
        const vertexIdx = this.indexOfSelectedVertex
        const pointInWorld = vec4.fromValues(this.vertexARKitFlat[vertexIdx], this.vertexARKitFlat[vertexIdx+1], this.vertexARKitFlat[vertexIdx+2], 1)
        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)
        const pointInClipSpace = vec4.transformMat4(vec4.create(), pointInWorld, m0)

        // clipXY := point mapped to 2d??
        const clipX = pointInClipSpace[0] / pointInClipSpace[3]
        const clipY = pointInClipSpace[1] / pointInClipSpace[3]
        // pixelXY := clipspace mapped to canvas
        const pixelX = (clipX * 0.5 + 0.5) * gl.canvas.width
        const pixelY = (clipY * -0.5 + 0.5) * gl.canvas.height
     
        // overlay is a div, not an svg...
        const overlay = view.overlay
        let label: HTMLElement
        if (overlay.children.length === 0) {
            label = span(text("BOO"))
            label.style.position = "absolute"
            label.style.color = "#f00"
            overlay.appendChild(label)
        } else {
            label = overlay.children[0] as HTMLElement
        }
        label.style.left = `${pixelX}px`
        label.style.top = `${pixelY}px`

        // console.log(`canvas := ${canvas.width} x ${canvas.height}, rotation=${ctx.rotateX}, ${ctx.rotateY}, pointInWorld := ${vec4.str(pointInWorld)}, screen = ${pixelX}, ${pixelY}`)

        // calculate (pixelX, pixelY) back to vertexIdx
        // --------------------------------------------
        // const mi = mat4.invert(mat4.create(), m0)

        // let clipspaceX = (pixelX / gl.canvas.width - 0.5 ) / 0.5
        // let clipspaceY = (pixelY / gl.canvas.height - 0.5 ) / -0.5
        // // console.log(`${clipX} == ${clipspaceX} && ${clipY} == ${clipspaceY}`)
        // const v = vec4.fromValues(clipspaceX * pointInClipSpace[3], clipspaceY * pointInClipSpace[3], pointInClipSpace[2], pointInClipSpace[3])
        // vec4.transformMat4(v, v, mi)

        // // console.log(`${vec4.str(v)} =? ${vec4.str(clipspace)}`)


        // const l0 = vec3.create()
        // const l1 = v as vec3

        // console.log(distancePointToLine(pointInWorld as vec3, l0, l1))
        // console.log(distancePointToLine(v as vec3, l0, l1))
    }

    private initializeMHFlat(app: Application, gl: WebGL2RenderingContext) {
        const xyz = app.humanMesh.baseMesh.xyz
        const fxyz = app.humanMesh.baseMesh.fxyz

        const WORD_LENGTH = 2
        let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length

        const f2 = new Array<number>(length * 4) // same number of faces
        const v2 = new Float32Array(length * 4 * 3) // four times the number of vertices
        for(let i=offset, vo=0, fo=0; i<length+offset;) {    
            let i0 = fxyz[i++] * 3
            let i1 = fxyz[i++] * 3
            let i2 = fxyz[i++] * 3
            let i3 = fxyz[i++] * 3
            v2[vo++] = xyz[i0++]
            v2[vo++] = xyz[i0++]
            v2[vo++] = xyz[i0++]

            v2[vo++] = xyz[i1++]
            v2[vo++] = xyz[i1++]
            v2[vo++] = xyz[i1++]

            v2[vo++] = xyz[i2++]
            v2[vo++] = xyz[i2++]
            v2[vo++] = xyz[i2++]

            v2[vo++] = xyz[i3++]
            v2[vo++] = xyz[i3++]
            v2[vo++] = xyz[i3++]

            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
        }
        this.vertexMHFlat = v2
        this.facesMHFlat = f2
        // this.vertexMHFlat = xyz
        // this.facesMHFlat = fxyz
        this.meshMHFlat = new RenderMesh(gl, v2, f2)
    }

    private initializeARKit(app: Application, gl: WebGL2RenderingContext): void {
        const arkit = FaceARKitLoader.getInstance().preload()

        this.facesARKitFlat = arkit.neutral!.fxyz
        this.vertexARKitOrig = this.vertexARKitFlat = arkit.getVertex(
            app.updateManager.getBlendshapeModel()!
        )

        const scale = new NumberModel(0.18, { min: 9, max: 11, step: 0.1, label: "scale" });
        const dy = new NumberModel(7.0312, { min: 0, max: 7.4, step: 0.01, label: "dy" });
        const dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" });
    
        const xyz = new Float32Array(this.vertexARKitFlat)
        // this.blendshapeSet.getTarget(this.blendshape.value)?.apply(this.xyz, 1)
        for (let i = 0; i < xyz.length; ++i) {
            xyz[i] *= scale.value
        }
        for (let i = 1; i < xyz.length; i += 3) {
            xyz[i] += dy.value
        }
        for (let i = 2; i < xyz.length; i += 3) {
            xyz[i] += dz.value
        }
        this.vertexARKitOrig = this.vertexARKitFlat = xyz

        // duplicate triangles to achieve flat shading
        const v2 = new Float32Array(this.facesARKitFlat.length * 3)
        const f2 = new Array<number>(this.facesARKitFlat.length * 3)
        for(let i=0, vo=0, fo=0; i<this.facesARKitFlat.length;) {    
            let i0 = this.facesARKitFlat[i++] * 3
            let i1 = this.facesARKitFlat[i++] * 3
            let i2 = this.facesARKitFlat[i++] * 3
            v2[vo++] = this.vertexARKitFlat[i0++]
            v2[vo++] = this.vertexARKitFlat[i0++]
            v2[vo++] = this.vertexARKitFlat[i0++]
            v2[vo++] = this.vertexARKitFlat[i1++]
            v2[vo++] = this.vertexARKitFlat[i1++]
            v2[vo++] = this.vertexARKitFlat[i1++]
            v2[vo++] = this.vertexARKitFlat[i2++]
            v2[vo++] = this.vertexARKitFlat[i2++]
            v2[vo++] = this.vertexARKitFlat[i2++]
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
        }
        this.facesARKitFlat = f2
        this.vertexARKitFlat = v2

        this.meshARKitFlat = new RenderMesh(
            gl,
            this.vertexARKitFlat,
            this.facesARKitFlat,
            undefined,
            undefined,
            false
        )
    }
}
