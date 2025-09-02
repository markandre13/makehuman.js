import { mat4, vec2, vec3 } from 'gl-matrix'
import { InputHandler } from './InputHandler'
import type { GLView } from "../GLView"
import { euler_matrix } from '../lib/euler'

export const D = 180 / Math.PI

/**
 * Fly Mode similar to Blender
 */

export class FlyMode extends InputHandler {
    // private _ctx!: Context
    private _view: GLView
    // private _osd?: FlyModeOnScreenDisplay

    /**
     *  initial camera
     */
    private _initial: mat4
    /**
     * translation
     */
    private _translate: mat4
    /**
     * _rotate0 * _rotate1
     */
    private _rotate: mat4
    /**
     * rotation given by pointer position
     */
    private _rotate0 = vec2.create();
    /**
     * rotation while pointer is close to view border
     */
    private _rotate1 = vec2.create();
    /**
     * timer based movement via keys
     */
    private _move = vec3.create();
    /**
     * timer based drift while the pointer is near the view border
     */
    private _drift = vec2.create();

    private _rotateInitial?: vec2

    /**
     *
     */
    private _lastUpdate?: number

    constructor(view: GLView) {
        super()
        // this._ctx = context
        this._view = view
        const ctx = this._view.ctx
        this._initial = mat4.clone(ctx.camera)
        this._translate = mat4.create()
        this._rotate = mat4.create()
        // this._cartet .setAttributeNS(null, 'cx', `${pixelX}`)
        // this._cartet .setAttributeNS(null, 'cy', `${pixelY}`)
    }
    override info() {
        return "FlyMode: ◧ Confirm ◨/␛ Cancel 🅆🄰🅂🄳 Move 🄴🅀 Up/Down 🅁🄵 Local Up/Down ⇧ Fast ⌥ Slow +− Acceleration 🅉 Z Axis Correction"
    }
    override pointerdown(ev: PointerEvent): void {
        ev.preventDefault()
        switch (ev.button) {
            case 0:
                this.confirm()
                break
            case 2:
                this.cancel()
                break
        }
    }
    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()

        const canvas = this._view.canvas

        const marginX = Math.round(((canvas.width / 2) * 8) / 10)
        const marginY = Math.round(((canvas.height / 2) * 8) / 10)

        const x = canvas.width / 2 - ev.offsetX
        const y = canvas.height / 2 - ev.offsetY
        if (this._rotateInitial === undefined) {
            this._rotateInitial = vec2.fromValues(x, y)
        }

        if (x < -marginX) {
            this._drift[0] = (x + marginX) / 10
        } else if (x > marginX) {
            this._drift[0] = (x - marginX) / 10
        } else {
            this._drift[0] = 0
            this._rotate0[0] = -x + this._rotateInitial[0]
        }

        if (y < -marginY) {
            this._drift[1] = (y + marginY) / 10
        } else if (y > marginY) {
            this._drift[1] = (y - marginY) / 10
        } else {
            this._drift[1] = 0
            this._rotate0[1] = -y + this._rotateInitial[1]
        }

        this.invalidate()
    }
    override keyup(ev: KeyboardEvent): void {
        ev.preventDefault()
        switch (ev.code) {
            case 'KeyW': // forward
                if (this._move[2] > 0) {
                    this._move[2] = 0
                }
                break
            case 'KeyS': // backward
                if (this._move[2] < 0) {
                    this._move[2] = 0
                }
                break
            case 'KeyA': // left
                if (this._move[0] > 0) {
                    this._move[0] = 0
                }
                break
            case 'KeyD': // right
                if (this._move[0] < 0) {
                    this._move[0] = 0
                }
                break
            case 'KeyQ': // down
                if (this._move[1] > 0) {
                    this._move[1] = 0
                }
                break
            case 'KeyE': // up
                if (this._move[1] < 0) {
                    this._move[1] = 0
                }
                break
        }
    }
    override keydown(ev: KeyboardEvent): void {
        ev.preventDefault()
        if (ev.repeat) {
            return
        }

        const ctx = this._view.ctx

        const cameraRotation = mat4.clone(ctx.camera)
        mat4.mul(cameraRotation, cameraRotation, this._rotate)
        cameraRotation[12] = cameraRotation[13] = cameraRotation[14] = 0
        mat4.invert(cameraRotation, cameraRotation)

        switch (ev.code) {
            case 'KeyW': // forward
                this._move[2] = 1
                break
            case 'KeyS': // backward
                this._move[2] = -1
                break
            case 'KeyA': // left
                this._move[0] = 1
                break
            case 'KeyD': // right
                this._move[0] = -1
                break
            case 'KeyQ': // down
                this._move[1] = 1
                break
            case 'KeyE': // up
                this._move[1] = -1
                break
            case 'KeyR': // local down
                // mat4.translate(this._translate, this._translate, dirY)
                // mat4.translate(this._translate, this._translate, dirY)
                break
            case 'KeyF': // local up
                // vec3.negate(dirY, dirY)
                // mat4.translate(this._translate, this._translate, dirY)
                break
            case 'Escape':
                this.cancel()
                break
            default:
                return
        }
        this.invalidate()
    }
    confirm() {
        this._view.popInputHandler()
        // this._osd?.destructor()
        this._view.invalidate()
    }
    cancel() {
        this._view.ctx.camera = this._initial
        this.confirm()
    }
    private invalidate() {
        if (this._lastUpdate === undefined) {
            this._lastUpdate = Date.now()
        }
        this._view.invalidate()
    }
    override paint() {
        this.update()
        if (this._move[0] ||
            this._move[1] ||
            this._move[2] ||
            this._drift[0] ||
            this._drift[1]) {
            this.invalidate()
        } else {
            this._lastUpdate = undefined
        }
    }
    private update() {
        const now = Date.now()

        const acceleration = (2.5 / 500) * (now - this._lastUpdate!)

        if (this._move[0] !== 0 || this._move[1] !== 0 || this._move[2] !== 0) {
            const dir = vec3.clone(this._move)
            vec3.scale(dir, dir, acceleration)
            const d = mat4.create()
            mat4.translate(d, d, dir)

            const iM = mat4.invert(mat4.create(), this._rotate)!

            const j = mat4.create()
            mat4.mul(j, j, iM)
            mat4.mul(j, j, d)
            mat4.mul(j, j, this._rotate)

            mat4.mul(this._translate, this._translate, j)
        }

        vec2.sub(this._rotate1, this._rotate1, this._drift)

        this._rotate = euler_matrix(
            (this._rotate0[0] + this._rotate1[0]) / D / 10,
            (this._rotate0[1] + this._rotate1[1]) / D / 10,
            0,
            'syxz'
        )
        mat4.identity(this._view.ctx.camera)
        mat4.mul(this._view.ctx.camera, this._view.ctx.camera, this._rotate)
        mat4.mul(this._view.ctx.camera, this._view.ctx.camera, this._translate)
        mat4.mul(this._view.ctx.camera, this._view.ctx.camera, this._initial)

        this._lastUpdate = now

        // if (this._osd) {
        //     this._osd.update()
        // } else {
        //     this._osd = new FlyModeOnScreenDisplay(this._view)
        // }
    }
}
