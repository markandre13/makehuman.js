import { FlyMode } from './FlyMode'
import { GLView } from './GLView'
import { InputHandler } from './InputHandler'
import { Projection } from './Projection'

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
                    ctx.rotateX = 0
                    ctx.rotateY = 180
                } else {
                    // front
                    ctx.rotateY = 0
                    ctx.rotateX = 0
                }
                ctx.projection = Projection.ORTHOGONAL
                this._view.invalidate()
                break
            case 'Numpad7': // top orthographic
                if (ev.ctrlKey) {
                    // bottom
                    ctx.rotateX = -90
                    ctx.rotateY = 0
                } else {
                    // top
                    ctx.rotateX = 90
                    ctx.rotateY = 0
                }
                ctx.projection = Projection.ORTHOGONAL
                this._view.invalidate()
                break
            case 'Numpad3': // right orthographic
                if (ev.ctrlKey) {
                    // left
                    ctx.rotateX = 0
                    ctx.rotateY = -90
                } else {
                    // right
                    ctx.rotateX = 0
                    ctx.rotateY = 90
                }
                ctx.projection = Projection.ORTHOGONAL
                this._view.invalidate()
                break
            case 'Numpad4':
                ctx.rotateY -= 11.25
                this._view.invalidate()
                break
            case 'Numpad6':
                ctx.rotateY += 11.25
                this._view.invalidate()
                break
            case 'Numpad8':
                ctx.rotateX -= 11.25
                this._view.invalidate()
                break
            case 'Numpad2':
                ctx.rotateX += 11.25
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
            case 'Backquote':
                if (ev.shiftKey) {
                    this._view.pushInputHandler(new FlyMode(this._view))
                }
                break
            default:
            // console.log(ev)
        }
    }
}
