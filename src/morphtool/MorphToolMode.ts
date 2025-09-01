import { Application } from 'Application'
import { mat4, vec2, vec4 } from 'gl-matrix'
import { createModelViewMatrix, createProjectionMatrix } from 'render/util'
import { MorphRenderer } from './MorphRenderer'
import { MorphToolModel } from './MorphToolModel'
import { D } from 'render/glview/RenderView'
import { InputHandler } from 'gl/input/InputHandler'
import { ButtonVariant } from 'toad.js/view/Button'
import { MouseButton } from 'gl/input/MouseButton'
import { Projection } from 'gl/Projection'

// some notes on blender's mesh editor
// * Preferences > Viewport > Selection > GPU Depth Picking > yes
// * Preferences > Themes > 3D Viewport > Vertex Size: 3px
//   valid values are 1px to 32px, and it looks like they are drawn
//   as flat, filled circles, not spheres
//.  source/blender/gpu/GPU_shader_builtin.hh:  /** Draw round points with per vertex size and color. */
//.  GPU_SHADER_3D_POINT_VARYING_SIZE_VARYING_COLOR
//   gpu_shader_3D_point_varying_size_varying_color

class Selection {
    mhvertex = new Map<number, SVGCircleElement>()
    arvertex = new Map<number, SVGCircleElement>()

    clear(arkit: boolean) {
        if (arkit) {
            this.arvertex.forEach( element => element.remove())
            this.arvertex.clear()
        } else {
            this.mhvertex.forEach( element => element.remove())
            this.mhvertex.clear()
        }
    }
    add(arkit: boolean, index: number, overlay: SVGGElement) {
        if (this.has(arkit, index)) {
            return
        }
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        circle.setAttributeNS(null, 'r', `3`)
        circle.setAttributeNS(null, 'stroke', `#f80`)
        circle.setAttributeNS(null, 'fill', `#f80`)
        overlay.appendChild(circle)
        if (arkit) {
            this.arvertex.set(index, circle)
        } else {
            this.mhvertex.set(index, circle)
        }
    }
    remove(arkit: boolean, index: number) {
        if (arkit) {
            const element = this.arvertex.get(index)
            if (element) {
                element.remove()
                this.arvertex.delete(index)
            }
        } else {
            const element = this.mhvertex.get(index)
            if (element) {
                element.remove()
                this.arvertex.delete(index)
            }
        }
    }
    toggle(arkit: boolean, index: number, overlay: SVGGElement) {
        if (this.has(arkit, index)) {
            this.remove(arkit, index)
        } else {
            this.add(arkit, index, overlay)
        }
    }
    has(arkit: boolean, index: number) {
        if (arkit) {
            return this.arvertex.has(index)
        } else {
            return this.mhvertex.has(index)
        }
    }
}

export class MorphToolMode extends InputHandler {
    _app: Application
    _model: MorphToolModel
    _renderer: MorphRenderer

    _selection = new Selection()

    // for rotation
    _downX = 0
    _downY = 0
    _buttonDown = false
    _origCamera!: mat4

    _overlay: SVGGElement

    constructor(
        app: Application,
        model: MorphToolModel,
        renderer: MorphRenderer
    ) {
        super()
        this._app = app
        this._model = model
        this._renderer = renderer
        this._overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        this._app.glview.overlaySVG.appendChild(this._overlay)
    }
    override destructor(): void {
        this._app.glview.overlaySVG.removeChild(this._overlay)
    }
    override info(): string | undefined {
        return 'Select Vertex'
    }
    override pointerdown(ev: PointerEvent): void {
        ev.preventDefault()
        switch (ev.button) {
            case MouseButton.LEFT:
                this.selectVertex(ev)
                break
            case MouseButton.MIDDLE:
                this._buttonDown = true
                this._downX = ev.x
                this._downY = ev.y
                this._origCamera = mat4.clone(this._app.glview.ctx.camera)
                break
        }
    }
    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()
        if (this._buttonDown) {
            this.rotate(ev)
        }
    }
    override pointerup(ev: PointerEvent): void {
        ev.preventDefault()
        switch (ev.button) {
            case MouseButton.MIDDLE:
                if (this._buttonDown) {
                    this._buttonDown = false
                    this.rotate(ev)
                }
                break
        }
        // console.log(`pointerup`)
    }

    /**
     * select vertex at pointer position
     */
    selectVertex(ev: PointerEvent) {
        const canvas = this._app.glview.canvas as HTMLCanvasElement
        const ctx = this._app.glview.ctx
        let modelViewMatrix = createModelViewMatrix(ctx, true)
        const mesh = this._model.isARKitActive.value ? this._renderer.arflat : this._renderer.mhflat
        const index = mesh.findVertex(vec2.fromValues(ev.offsetX, ev.offsetY), canvas, modelViewMatrix)

        if (index !== undefined) {
            if (!ev.shiftKey) {
                this._selection.clear(this._model.isARKitActive.value)
            }
            this._selection.toggle(this._model.isARKitActive.value, index, this._overlay)
            this._app.glview.invalidate()
        }
    }

    /**
     * paint selected vertices
     */
    override paint() {
        // console.log(`MorphToolMode.paint()`)
        const canvas = this._app.glview.canvas
        const ctx = this._app.glview.ctx
        const projectionMatrix = createProjectionMatrix(
            canvas,
            ctx.projection === Projection.PERSPECTIVE
        )
        let modelViewMatrix = createModelViewMatrix(ctx, true)
        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)

        // update markers
        this._selection.mhvertex.forEach( (element, index) => {
            const pointInWorld = this._renderer.mhflat.getVec4(index)
            const pointInClipSpace = vec4.transformMat4(vec4.create(), pointInWorld, m0)
            // clipXY := point mapped to 2d??
            const clipX = pointInClipSpace[0] / pointInClipSpace[3]
            const clipY = pointInClipSpace[1] / pointInClipSpace[3]
            // pixelXY := clipspace mapped to canvas
            const pixelX = (clipX * 0.5 + 0.5) * canvas.width
            const pixelY = (clipY * -0.5 + 0.5) * canvas.height
            element.setAttributeNS(null, 'cx', `${pixelX}`)
            element.setAttributeNS(null, 'cy', `${pixelY}`)
        })

        this._selection.arvertex.forEach( (element, index) => {
            const pointInWorld = this._renderer.arflat.getVec4(index)
            const pointInClipSpace = vec4.transformMat4(vec4.create(), pointInWorld, m0)
            // clipXY := point mapped to 2d??
            const clipX = pointInClipSpace[0] / pointInClipSpace[3]
            const clipY = pointInClipSpace[1] / pointInClipSpace[3]
            // pixelXY := clipspace mapped to canvas
            const pixelX = (clipX * 0.5 + 0.5) * canvas.width
            const pixelY = (clipY * -0.5 + 0.5) * canvas.height
            element.setAttributeNS(null, 'cx', `${pixelX}`)
            element.setAttributeNS(null, 'cy', `${pixelY}`)
        })
    }

    /**
     *
     */
    rotate(ev: PointerEvent) {
        const x = ev.x - this._downX
        const y = ev.y - this._downY
        if (x !== 0 || y !== 0) {
            const cameraRotation = mat4.clone(this._origCamera)
            cameraRotation[12] = cameraRotation[13] = cameraRotation[14] = 0
            const invCameraRotation = mat4.invert(mat4.create(), cameraRotation)

            const moveToRotationCenter = mat4.create()
            mat4.translate(
                moveToRotationCenter,
                moveToRotationCenter,
                [0, 7, 0]
            )

            const backFromRotationCenter = mat4.invert(
                mat4.create(),
                moveToRotationCenter
            )

            const m = mat4.create()

            mat4.mul(m, m, moveToRotationCenter)
            mat4.mul(m, m, invCameraRotation)
            mat4.rotateX(m, m, y / D)
            mat4.mul(m, m, cameraRotation)
            mat4.rotateY(m, m, x / D)
            mat4.mul(m, m, backFromRotationCenter)

            mat4.mul(this._app.glview.ctx.camera, this._origCamera, m)

            this._app.glview.invalidate()
        }
    }
}
