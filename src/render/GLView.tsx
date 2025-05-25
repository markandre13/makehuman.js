import { Application } from 'Application'
import { Context } from 'render/Context'
import { RenderList } from 'render/RenderList'
import { RGBAShader } from 'render/shader/RGBAShader'
import { TextureShader } from 'render/shader/TextureShader'
import { loadTexture } from 'render/util'
import { HTMLElementProps, View, ref } from 'toad.js'
import { ColorShader } from './shader/ColorShader'
import { mat4, vec2, vec3 } from 'gl-matrix'
import { euler_from_matrix, euler_matrix } from 'lib/euler_matrix'

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE,
}

export abstract class RenderHandler {
    abstract paint(app: Application, view: GLView): void
    onpointerdown(ev: PointerEvent): boolean {
        return true
    }
    onpointermove(ev: PointerEvent): boolean {
        return true
    }
    onpointerup(ev: PointerEvent): boolean {
        return true
    }
}

interface GLViewProps extends HTMLElementProps {
    app: Application
}

const D = 180 / Math.PI

export class InputHandler {
    paint() {}
    keyup(ev: KeyboardEvent): boolean {
        return true
    }
    keydown(ev: KeyboardEvent): boolean {
        return true
    }
    onpointerdown(ev: PointerEvent): boolean {
        return true
    }
    onpointermove(ev: PointerEvent): boolean {
        return true
    }
    onpointerup(ev: PointerEvent): boolean {
        return true
    }
}

/**
 * On Screen Display while the Fly Mode is active
 *
 * Displays a caret in the center of the view and the current position and rotation
 */
class FlyModeOnScreenDisplay {
    private _glview: GLView
    private _caret: SVGGElement
    constructor(glview: GLView) {
        const overlaySVG = glview.overlaySVG
        // if (overlaySVG === undefined) {
        //     return
        // }
        // if (this._cartet !== undefined) {
        //     return
        // }
        this._glview = glview
        const canvas = glview.canvas

        const centerX = Math.round(canvas.width / 2)
        const centerY = Math.round(canvas.height / 2)

        // also display pos & rotation in overlay?

        this._caret = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g'
        )
        function rect(x: number, y: number, w: number, h: number) {
            const rect: SVGRectElement = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'rect'
            )
            rect.setAttributeNS(null, 'x', `${x}`)
            rect.setAttributeNS(null, 'y', `${y}`)
            rect.setAttributeNS(null, 'rx', `3`)
            rect.setAttributeNS(null, 'ry', `3`)
            rect.setAttributeNS(null, 'width', `${w}`)
            rect.setAttributeNS(null, 'height', `${h}`)
            rect.setAttributeNS(null, 'stroke', `#fff`)
            rect.setAttributeNS(null, 'stroke-width', `1`)
            rect.setAttributeNS(null, 'fill', `#000`)
            return rect
        }
        this._caret.appendChild(rect(centerX - 40.5, centerY, 30, 3))
        this._caret.appendChild(rect(centerX + 10.5, centerY, 30, 3))
        this._caret.appendChild(rect(centerX, centerY + 10.5, 3, 30))
        this._caret.appendChild(rect(centerX, centerY - 40.5, 3, 30))

        const cam = glview.ctx.camera
        const v = vec3.create()
        const ic = mat4.invert(mat4.create(), cam)
        vec3.transformMat4(v, v, ic)
        let text = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        )
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `20`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(
            document.createTextNode(
                `POS: ${cam[12].toFixed(2)}, ${cam[13].toFixed(
                    2
                )}, ${cam[14].toFixed(2)}`
            )
        )
        this._caret.appendChild(text)

        const r = euler_from_matrix(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D
        text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `40`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(
            document.createTextNode(
                `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}`
            )
        )
        this._caret.appendChild(text)

        overlaySVG.appendChild(this._caret)
    }
    destructor() {
        this._glview.overlaySVG.removeChild(this._caret)
    }
    update() {
        const canvas = this._glview.canvas
        const centerX = Math.round(canvas.width / 2)
        const centerY = Math.round(canvas.height / 2)
        this._caret.children[0].setAttributeNS(null, 'x', `${centerX - 40.5}`)
        this._caret.children[0].setAttributeNS(null, 'y', `${centerY}`)
        this._caret.children[1].setAttributeNS(null, 'x', `${centerX + 10.5}`)
        this._caret.children[1].setAttributeNS(null, 'y', `${centerY}`)
        this._caret.children[2].setAttributeNS(null, 'x', `${centerX}`)
        this._caret.children[2].setAttributeNS(null, 'y', `${centerY + 10.5}`)
        this._caret.children[3].setAttributeNS(null, 'x', `${centerX}`)
        this._caret.children[3].setAttributeNS(null, 'y', `${centerY - 40.5}`)

        const cam = this._glview.ctx.camera
        const v = vec3.create()
        const ic = mat4.invert(mat4.create(), cam)
        vec3.transformMat4(v, v, ic)
        ;(
            this._caret.children[4] as SVGTextElement
        ).innerHTML = `POS: ${v[0].toFixed(2)}, ${v[1].toFixed(
            2
        )}, ${v[2].toFixed(2)}`
        const r = euler_from_matrix(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D
        ;(
            this._caret.children[5] as SVGTextElement
        ).innerHTML = `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(
            2
        )}`
    }
}

/**
 * Fly Mode similar to Blender
 */
export class FlyMode extends InputHandler {
    private _view: GLView
    private _osd?: FlyModeOnScreenDisplay

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
    private _rotate0 = vec2.create()
    /**
     * rotation while pointer is close to view border
     */
    private _rotate1 = vec2.create()
    /**
     * timer based movement via keys
     */
    private _move = vec3.create()
    /**
     * timer based drift while the pointer is near the view border
     */
    private _drift = vec2.create()

    /**
     * 
     */
    private _lastUpdate?: number

    constructor(view: GLView) {
        super()
        this._view = view
        const ctx = this._view.ctx
        this._initial = mat4.clone(ctx.camera)
        this._translate = mat4.create()
        this._rotate = mat4.create()
        // this._cartet .setAttributeNS(null, 'cx', `${pixelX}`)
        // this._cartet .setAttributeNS(null, 'cy', `${pixelY}`)
    }
    override paint() {
        this.update()
        if (this._move[0] || this._move[1] || this._move[2] || this._drift[0] || this._drift[1]) {
            this.invalidate()
        } else {
            this._lastUpdate = undefined
        }
    }
    private update() {
        const now = Date.now()

        const acceleration = 2.5 / 500 * (now - this._lastUpdate!)

        if (this._move[0] !== 0 || this._move[1] !== 0 || this._move[2] !== 0) {

            const dir = vec3.clone(this._move)
            vec3.scale(dir, dir, acceleration)
            const d = mat4.create()
            mat4.translate(d, d, dir)

            const iM = mat4.invert(mat4.create(), this._rotate)

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

        if (this._osd) {
            this._osd.update()
        } else {
            this._osd = new FlyModeOnScreenDisplay(this._view)
        }
    }
    override onpointermove(ev: PointerEvent): boolean {
        const canvas = this._view.canvas

        const marginX = Math.round(((canvas.width / 2) * 8) / 10)
        const marginY = Math.round(((canvas.height / 2) * 8) / 10)

        const x = canvas.width / 2 - ev.offsetX
        const y = canvas.height / 2 - ev.offsetY

        if (x < -marginX) {
            this._drift[0] = (x + marginX) / 10
        } else if (x > marginX) {
            this._drift[0] = (x - marginX) / 10
        } else {
            this._drift[0] = 0
            this._rotate0[0] = -x
        }

        if (y < -marginY) {
            this._drift[1] = (y + marginY) / 10
        } else if (y > marginY) {
            this._drift[1] = (y - marginY) / 10
        } else {
            this._drift[1] = 0
            this._rotate0[1] = -y
        }

        this.invalidate()
        return true
    }

    private invalidate() {
        if (this._lastUpdate === undefined) {
            this._lastUpdate = Date.now()
        }
        this._view.invalidate()
    }

    override keyup(ev: KeyboardEvent): boolean {
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
        return true
    }
    override keydown(ev: KeyboardEvent): boolean {
        if (ev.repeat) {
            return true
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
                this._view.inputHandler = undefined
                this._view.app.status.value = ''
                this._osd?.destructor()
                break
            default:
                return false
        }
        this.invalidate()
        // return true
        return false
    }
}

export class GLView extends View {
    renderHandler?: RenderHandler
    inputHandler?: InputHandler
    private _redrawIsPending = false

    app: Application

    // DOM
    canvas!: HTMLCanvasElement
    overlay!: HTMLElement
    overlaySVG!: SVGElement

    // GL
    ctx: Context
    gl!: WebGL2RenderingContext
    programRGBA!: RGBAShader
    programTex!: TextureShader
    programColor!: ColorShader
    renderList!: RenderList
    bodyTexture: WebGLTexture | null = null
    eyeTexture: WebGLTexture | null = null

    constructor(props: GLViewProps) {
        super(props)
        this.app = props.app
        this.app.glview = this
        if (props.app.renderer) {
            this.renderHandler = props.app.renderer
        }
        this.init = this.init.bind(this)
        this.paint = this.paint.bind(this)

        this.ctx = {
            camera: mat4.create(),
            rotateX: 0,
            rotateY: 0,
            pos: vec3.create(),
            projection: Projection.PERSPECTIVE,
        }
        // move up by 7, move backwards by 5
        mat4.translate(this.ctx.camera, this.ctx.camera, [0, -7, -5])

        // this.app.status.value =
        //     '◧ Confirm ◨/␛ Cancel 🅆🄰🅂🄳 Move 🄴🅀 Up/Down 🅁🄵 Local Up/Down ⇧ Fast ⌥ Slow +− Acceleration 🅉 Z Axis Correction'
        // this.inputHandler = new FlyMode(this)

        this.replaceChildren(
            ...(
                <>
                    <canvas
                        set={ref(this, 'canvas')}
                        style={{ width: '100%', height: '100%' }}
                    />
                    <div
                        set={ref(this, 'overlay')}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            overflow: 'hidden',
                            pointerEvents: 'none',
                        }}
                    ></div>
                    <svg
                        set={ref(this, 'overlaySVG')}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            overflow: 'hidden',
                            pointerEvents: 'none',
                            width: '100%',
                            height: '100%',
                        }}
                    ></svg>
                </>
            )
        )
    }

    override connectedCallback(): void {
        requestAnimationFrame(this.init)
    }

    private init() {
        this.initRender()
        this.setupEventHandling()

        // this belongs here but...
        this.app.updateManager.render = this.paint
        // ...this does not
        this.app.humanMesh.human.signal.add(() => {
            this.app.updateManager.invalidateView()
        })
        this.app.humanMesh.wireframe.signal.add(() => {
            this.app.updateManager.invalidateView()
        })

        // load texture and repaint once loaded
        this.bodyTexture = loadTexture(
            this.gl,
            'data/skins/textures/young_caucasian_female_special_suit.png',
            this.paint
        )!
        this.eyeTexture = loadTexture(
            this.gl,
            'data/eyes/materials/green_eye.png',
            this.paint
        )!
        // schedule initial paint
        this.paint()
    }

    private paint() {
        this._redrawIsPending = false
        if (this.app.renderer) {
            // const m = this.ctx.camera
            // mat4.identity(m)
            // // rotate around camera
            // // ...
            // // move camera UP -7, BACK -5
            // mat4.translate(m, m, [0, -7, -5])
            // // rotate object
            // mat4.rotateY(m, m, 45 / 360 * 2 * Math.PI)

            this.app.renderer.paint(this.app, this)
            if (this.inputHandler) {
                this.inputHandler.paint()
            }
        }
    }

    /**
     * Invalidate view and schedule to render the view again
     */
    invalidate(): void {
        if (this._redrawIsPending) {
            return
        }
        this._redrawIsPending = true
        requestAnimationFrame(this.paint)
    }

    private initRender() {
        const opt = {
            alpha: false,
            premultipliedAlpha: false,
        }

        this.gl = (this.canvas.getContext('webgl2', opt) ||
            this.canvas.getContext(
                'experimental-webgl',
                opt
            )) as WebGL2RenderingContext
        if (this.gl == null) {
            throw Error(
                'Unable to initialize WebGL. Your browser or machine may not support it.'
            )
        }

        // flip texture pixels into the bottom-to-top order that WebGL expects.
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)

        this.programRGBA = new RGBAShader(this.gl)
        this.programTex = new TextureShader(this.gl)
        this.programColor = new ColorShader(this.gl)

        this.renderList = new RenderList(this.gl, this.app.humanMesh)
        this.app.updateManager.setRenderList(this.renderList)
    }

    /**
     * setup handling of pointer, keyboard and resize event
     */
    private setupEventHandling() {
        const ctx = this.ctx
        const canvas = this.canvas

        //
        // resize
        //
        new ResizeObserver(this.paint).observe(canvas)

        //
        // pointer
        //
        let downX = 0,
            downY = 0,
            buttonDown = false
        canvas.onpointerdown = (ev: PointerEvent) => {
            if (this.inputHandler && !this.inputHandler.onpointerdown(ev)) {
                return
            }
            if (this.renderHandler && !this.renderHandler.onpointerdown(ev)) {
                return
            }
            canvas.setPointerCapture(ev.pointerId)
            buttonDown = true
            downX = ev.x
            downY = ev.y
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            if (this.inputHandler && !this.inputHandler.onpointerup(ev)) {
                return
            }
            if (
                !buttonDown &&
                this.renderHandler &&
                !this.renderHandler.onpointerup(ev)
            ) {
                return
            }
            buttonDown = false
        }
        canvas.onpointermove = (ev: PointerEvent) => {
            if (this.inputHandler && !this.inputHandler.onpointermove(ev)) {
                return
            }
            if (
                !buttonDown &&
                this.renderHandler &&
                !this.renderHandler.onpointermove(ev)
            ) {
                return
            }
            if (buttonDown) {
                const x = ev.x - downX
                const y = ev.y - downY
                if (x !== 0 || y !== 0) {
                    ctx.rotateY += x
                    ctx.rotateX += y
                    downX = ev.x
                    downY = ev.y
                    requestAnimationFrame(this.paint)
                }
            }
        }

        //
        // keyboard
        //

        window.onkeyup = (ev: KeyboardEvent) => {
            if (this.inputHandler) {
                this.inputHandler.keyup(ev)
            }
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            if (this.inputHandler) {
                this.inputHandler.keydown(ev)
            }

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
                    requestAnimationFrame(this.paint)
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
                    requestAnimationFrame(this.paint)
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
                    requestAnimationFrame(this.paint)
                    break
                case 'Numpad4':
                    ctx.rotateY -= 11.25
                    requestAnimationFrame(this.paint)
                    break
                case 'Numpad6':
                    ctx.rotateY += 11.25
                    requestAnimationFrame(this.paint)
                    break
                case 'Numpad8':
                    ctx.rotateX -= 11.25
                    requestAnimationFrame(this.paint)
                    break
                case 'Numpad2':
                    ctx.rotateX += 11.25
                    requestAnimationFrame(this.paint)
                    break
                case 'Numpad5': // toggle orthographic/perspective
                    if (ctx.projection === Projection.ORTHOGONAL) {
                        ctx.projection = Projection.PERSPECTIVE
                    } else {
                        ctx.projection = Projection.ORTHOGONAL
                    }
                    requestAnimationFrame(this.paint)
                    break
                case 'Backquote':
                    if (ev.shiftKey) {
                        // console.log(`enter flymode`)
                        this.app.status.value =
                            '◧ Confirm ◨/␛ Cancel 🅆🄰🅂🄳 Move 🄴🅀 Up/Down 🅁🄵 Local Up/Down ⇧ Fast ⌥ Slow +− Acceleration 🅉 Z Axis Correction'
                        this.inputHandler = new FlyMode(this)
                    }
                    break
                default:
                // console.log(ev)
            }
        }
    }
}
GLView.define('mh-glview', GLView)
