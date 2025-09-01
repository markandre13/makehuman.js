import { mat4, vec3 } from 'gl-matrix'
import { deg2rad } from './Context'
import { Projection } from "../Projection"
import { type GLView } from "../GLView"
import { FlyMode } from './FlyMode'
import { InputHandler } from './InputHandler'
import { MouseButton } from './MouseButton'

interface Point {
    x: number,
    y: number
}

export class BasicMode extends InputHandler {
    private _view: GLView
    constructor(view: GLView) {
        super()
        this._view = view
    }
    override info() {
        return "Basic: `: FlyMode"
    }
    override keydown(ev: KeyboardEvent): void {
        const ctx = this._view.ctx
        switch (ev.code) {
            case 'Numpad1': // front orthographic
                if (ev.ctrlKey) {
                    // back
                    ctx.rotateCameraTo(0, 180, 0)
                } else {
                    // front
                    ctx.rotateCameraTo(0, 0, 0)
                }
                ctx.projection = Projection.ORTHOGONAL
                this._view.invalidate()
                break
            case 'Numpad7': // top orthographic
                if (ev.ctrlKey) {
                    // bottom
                    ctx.rotateCameraTo(-90, 0, 0)
                } else {
                    // top
                    ctx.rotateCameraTo(90, 0, 0)
                }
                ctx.projection = Projection.ORTHOGONAL
                this._view.invalidate()
                break
            case 'Numpad3':
                if (ev.ctrlKey) {
                    // left
                    ctx.rotateCameraTo(0, 90, 0)
                } else {
                    // right
                    ctx.rotateCameraTo(0, -90, 0)
                }
                ctx.projection = Projection.ORTHOGONAL
                this._view.invalidate()
                break
            case 'Numpad4':
                mat4.rotateY(ctx.camera, ctx.camera, deg2rad(11.25))
                this._view.invalidate()
                break
            case 'Numpad6':
                mat4.rotateY(ctx.camera, ctx.camera, deg2rad(-11.25))
                this._view.invalidate()
                break
            case 'Numpad8':
                mat4.rotateX(ctx.camera, ctx.camera, deg2rad(11.25))
                this._view.invalidate()
                break
            case 'Numpad2':
                mat4.rotateX(ctx.camera, ctx.camera, deg2rad(-11.25))
                this._view.invalidate()
                break
            case 'Numpad5': // toggle orthographic/perspective
                if (ctx.projection === Projection.ORTHOGONAL) {
                    ctx.projection = Projection.PERSPECTIVE
                } else {
                    ctx.projection = Projection.ORTHOGONAL
                }
                this._view.invalidate()
                break
            case 'Numpad0':
                // camera view
                mat4.identity(ctx.camera)
                mat4.translate(ctx.camera, ctx.camera, [0.0, 0.0, -6.0])
                this._view.invalidate()
                break
            case 'NumpadDecimal':
                // focus selected
                break
            case 'Backquote':
                if (ev.shiftKey) {
                    this._view.pushInputHandler(new FlyMode(this._view))
                }
                break
            default:
            // console.log(ev)
        }
    }

    private _down: Point | undefined
    private _camera: mat4 | undefined
    private _center: vec3 | undefined

    override pointerdown(ev: PointerEvent): void {
        if (ev.button !== MouseButton.MIDDLE) {
            return
        }
        this._view.canvas.setPointerCapture(ev.pointerId)
        this._down = { x: ev.x, y: ev.y }
        this._camera = mat4.clone(this._view.ctx.camera)
        this._center = this._view.selectionCenter()
        ev.preventDefault()
    }
    override pointermove(ev: PointerEvent): void {
        if (this._down === undefined) {
            return
        }
        ev.preventDefault()

        const x = ev.x - this._down.x
        const y = ev.y - this._down.y

        const cameraRotation = mat4.clone(this._camera!)
        cameraRotation[12] = cameraRotation[13] = cameraRotation[14] = 0
        const invCameraRotation = mat4.invert(mat4.create(), cameraRotation)

        const moveToRotationCenter = mat4.create()
        mat4.translate(
            moveToRotationCenter,
            moveToRotationCenter,
            this._center!
        )

        const backFromRotationCenter = mat4.invert(mat4.create(), moveToRotationCenter)

        const m = mat4.create()
        mat4.mul(m, m, moveToRotationCenter)
        mat4.mul(m, m, invCameraRotation)
        mat4.rotateX(m, m, deg2rad(y))
        mat4.mul(m, m, cameraRotation)
        mat4.rotateY(m, m, deg2rad(x))
        mat4.mul(m, m, backFromRotationCenter)

        mat4.mul(this._view.ctx.camera, this._camera!, m)

        this._view.invalidate()
    }

    override pointerup(ev: PointerEvent): void {
        if (this._down === undefined) {
            return
        }
        ev.preventDefault()
        this._down = undefined
        this._camera = undefined
    }
}
