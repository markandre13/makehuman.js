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
import { NumberModel, span, text } from 'toad.js'

// i'm not sure if i should go with the webgl classes i've created so far...

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    app: Application
    mesh!: RenderMesh
    indexOfSelectedVertex: number = 0
    
    vertexOrig!: Float32Array
    vertex!: Float32Array
    faces!: number[]
    constructor(app: Application) {
        super()
        this.app = app
    }

    override onpointerdown(ev: PointerEvent): boolean  {       
        const canvas = this.app.glview.canvas as HTMLCanvasElement
        const ctx = this.app.glview.ctx
        let modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const index = findVertex(vec2.fromValues(ev.offsetX, ev.offsetY), this.vertex, canvas, modelViewMatrix)
        if (index === undefined) {
            return true
        }
        this.indexOfSelectedVertex = index
        this.app.updateManager.invalidateView()
        return false
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
        if (this.mesh === undefined) {
            this.initialize(app, gl)
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

        // draw makehuman
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)
      
        programRGBA.setColor([1, 0.8, 0.7, 1])
        const WORD_LENGTH = 2
        let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        view.renderList.base.bind(programRGBA)
        view.renderList.base.drawSubset(gl.TRIANGLES, offset, length)

        // draw arkit neutral
        gl.depthMask(true)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        const alpha = 0.5

        programRGBA.setColor([0, 0.5, 1, alpha])

        this.mesh.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, this.faces.length, gl.UNSIGNED_SHORT, 0)


        // const WORD_LENGTH = 2
        // let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        // let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        // view.renderList.base.bind(programRGBA)
        // view.renderList.base.drawSubset(gl.TRIANGLES, offset, length)

        // add text label
        // ---------------
        const vertexIdx = this.indexOfSelectedVertex
        const pointInWorld = vec4.fromValues(this.vertex[vertexIdx], this.vertex[vertexIdx+1], this.vertex[vertexIdx+2], 1)
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

    private initialize(app: Application, gl: WebGL2RenderingContext): void {
        const arkit = FaceARKitLoader.getInstance().preload()

        this.faces = arkit.neutral!.fxyz
        this.vertexOrig = this.vertex = arkit.getVertex(
            app.updateManager.getBlendshapeModel()!
        )

        const scale = new NumberModel(0.18, { min: 9, max: 11, step: 0.1, label: "scale" });
        const dy = new NumberModel(7.12, { min: 0, max: 7.4, step: 0.01, label: "dy" });
        const dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" });
    
        const xyz = new Float32Array(this.vertex)
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
        this.vertexOrig = this.vertex = xyz

        // duplicate triangles to achieve flat shading
        const v2 = new Float32Array(this.faces.length * 3)
        const f2 = new Array<number>(this.faces.length * 3)
        for(let i=0, vo=0, fo=0; i<this.faces.length;) {    
            let i0 = this.faces[i++] * 3
            let i1 = this.faces[i++] * 3
            let i2 = this.faces[i++] * 3
            v2[vo++] = this.vertex[i0++]
            v2[vo++] = this.vertex[i0++]
            v2[vo++] = this.vertex[i0++]
            v2[vo++] = this.vertex[i1++]
            v2[vo++] = this.vertex[i1++]
            v2[vo++] = this.vertex[i1++]
            v2[vo++] = this.vertex[i2++]
            v2[vo++] = this.vertex[i2++]
            v2[vo++] = this.vertex[i2++]
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
        }
        this.faces = f2
        this.vertex = v2

        this.mesh = new RenderMesh(
            gl,
            this.vertex,
            this.faces,
            undefined,
            undefined,
            false
        )
    }
}
