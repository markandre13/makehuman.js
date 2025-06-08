import { Application } from 'Application'
import { mat4, vec2 } from 'gl-matrix'
import { findVertex } from 'lib/distance'
import { InputHandler } from 'render/glview/InputHandler'
import { createModelViewMatrix } from 'render/util'
import { MorphRenderer, MorphToolModel } from './MorphRenderer'
import { D } from 'render/glview/GLView'

const BUTTON_LEFT = 0
const BUTTON_MIDDLE = 1
const BUTTON_RIGHT = 2

export class MorphToolMode extends InputHandler {
    _app: Application
    _model: MorphToolModel
    _renderer: MorphRenderer

    // for rotation
    _downX = 0
    _downY = 0
    _buttonDown = false
    _origCamera!: mat4

    constructor(
        app: Application,
        model: MorphToolModel,
        renderer: MorphRenderer
    ) {
        super()
        this._app = app
        this._model = model
        this._renderer = renderer
    }
    override info(): string | undefined {
        return 'Select Vertex'
    }
    override pointerdown(ev: PointerEvent): void {
        ev.preventDefault()
        switch (ev.button) {
            case BUTTON_LEFT:
                this.selectVertex(ev)
                break
            case BUTTON_MIDDLE:
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
            case BUTTON_MIDDLE:
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
        const index = findVertex(
            vec2.fromValues(ev.offsetX, ev.offsetY),
            this._model.isARKitActive.value
                ? this._renderer.arflat.vertexARKitOrig
                : this._renderer.mhflat.vertexMHOrig,
            canvas,
            modelViewMatrix
        )
        if (index !== undefined) {
            this._renderer.indexOfSelectedVertex = index
            this._app.glview.invalidate()
        }
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
