import { Application } from 'Application'
import { mat4, vec4 } from 'gl-matrix'
import { GLView } from 'render/glview/GLView'
import { RenderHandler } from 'render/glview/RenderHandler'
import { Projection } from 'render/glview/Projection'
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from 'render/util'
import { span, text } from 'toad.js'
import { ARKitFlat } from './ARKitFlat'
import { MorphToolModel } from './MorphToolModel'
import { MHFlat } from './MHFlat'

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    private app: Application
    private model: MorphToolModel
    
    indexOfSelectedVertex: number = 0
    
    arflat!: ARKitFlat
    mhflat!: MHFlat

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

    override paint(app: Application, view: GLView): void {
        // prepare
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA       
        if (this.arflat === undefined) {
            this.mhflat = new MHFlat(app, gl)
            this.arflat = new ARKitFlat(app, gl)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(
            canvas,
            ctx.projection === Projection.PERSPECTIVE
        )
        let modelViewMatrix = createModelViewMatrix(ctx, true)
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
            this.mhflat.bind(programRGBA)
            this.mhflat.draw(gl)

            // draw arkit neutral
            if (this.model.showBothMeshes.value) {
                gl.disable(gl.CULL_FACE)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

                programRGBA.setColor([0, 0.5, 1, alpha])
                this.arflat.bind(programRGBA)
                this.arflat.draw(gl)
            }
        } else {
            // draw arkit neutral
            gl.disable(gl.CULL_FACE)
            gl.cullFace(gl.BACK)
            gl.disable(gl.BLEND)

            programRGBA.setColor([0, 0.5, 1, 1])
            this.arflat.bind(programRGBA)
            this.arflat.draw(gl)

            // draw makehuman
            if (this.model.showBothMeshes.value) {
                gl.enable(gl.CULL_FACE)
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

                programRGBA.setColor([1, 0.8, 0.7, alpha])
                this.mhflat.bind(programRGBA)
                this.mhflat.draw(gl)
            }
        }

        // add text label
        // ---------------
        const vertexIdx = this.indexOfSelectedVertex
        let pointInWorld
        if (this.model.isARKitActive.value) {
            pointInWorld = this.arflat.getVec4(vertexIdx)
        } else {
            pointInWorld = this.mhflat.getVec4(vertexIdx)
        }
        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)
        const pointInClipSpace = vec4.transformMat4(vec4.create(), pointInWorld, m0)

        // clipXY := point mapped to 2d??
        const clipX = pointInClipSpace[0] / pointInClipSpace[3]
        const clipY = pointInClipSpace[1] / pointInClipSpace[3]
        // pixelXY := clipspace mapped to canvas
        const pixelX = (clipX * 0.5 + 0.5) * gl.canvas.width
        const pixelY = (clipY * -0.5 + 0.5) * gl.canvas.height
     
        // overlay text
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

        // overlay svg circle
        const overlaySVG = view.overlaySVG
        let circle: SVGCircleElement
        if (overlaySVG.children.length === 0) {
            circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
            circle.setAttributeNS(null, 'r', `3`)
            circle.setAttributeNS(null, 'stroke', `#f80`)
            circle.setAttributeNS(null, 'fill', `#f80`)
            overlaySVG.appendChild(circle)
        } else {
            circle = overlaySVG.children[0] as SVGCircleElement
        }
        circle.setAttributeNS(null, 'cx', `${pixelX}`)
        circle.setAttributeNS(null, 'cy', `${pixelY}`)
    }
}
