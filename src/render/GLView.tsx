import { Application } from 'Application'
import { Context } from 'render/Context'
import { RenderList } from 'render/RenderList'
import { RGBAShader } from 'render/shader/RGBAShader'
import { TextureShader } from 'render/shader/TextureShader'
import { loadTexture } from 'render/util'
import { HTMLElementProps, View, ref, text } from 'toad.js'
import { ColorShader } from './shader/ColorShader'
import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
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

        this._caret = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        function rect(x: number, y: number, w: number, h: number) {               
            const rect: SVGRectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
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
        this._caret.appendChild(rect(centerX-40.5, centerY, 30, 3))
        this._caret.appendChild(rect(centerX+10.5, centerY, 30, 3))
        this._caret.appendChild(rect(centerX, centerY+10.5, 3, 30))
        this._caret.appendChild(rect(centerX, centerY-40.5, 3, 30))

        const cam = glview.ctx.camera
        let text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `20`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(document.createTextNode(`POS: ${cam[12].toFixed(2)}, ${cam[13].toFixed(2)}, ${cam[14].toFixed(2)}`))
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
        text.appendChild(document.createTextNode(`ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}`))
        this._caret.appendChild(text)

        overlaySVG.appendChild(this._caret)
    }
    update() {
        const canvas = this._glview.canvas
        const centerX = Math.round(canvas.width / 2)
        const centerY = Math.round(canvas.height / 2)
        this._caret.children[0].setAttributeNS(null, 'x', `${centerX-40.5}`)
        this._caret.children[0].setAttributeNS(null, 'y', `${centerY}`)
        this._caret.children[1].setAttributeNS(null, 'x', `${centerX+10.5}`)
        this._caret.children[1].setAttributeNS(null, 'y', `${centerY}`)
        this._caret.children[2].setAttributeNS(null, 'x', `${centerX}`)
        this._caret.children[2].setAttributeNS(null, 'y', `${centerY+10.5}`)
        this._caret.children[3].setAttributeNS(null, 'x', `${centerX}`)
        this._caret.children[3].setAttributeNS(null, 'y', `${centerY-40.5}`)

        const cam = this._glview.ctx.camera
        ;(this._caret.children[4] as SVGTextElement).innerHTML = `POS: ${cam[12].toFixed(2)}, ${cam[13].toFixed(2)}, ${cam[14].toFixed(2)}`
        const r = euler_from_matrix(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D

        ;(this._caret.children[5] as SVGTextElement).innerHTML = `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}`
    }
}

// class DefaultMode implements InputMode {
// }
export class FlyMode extends InputHandler {
    private _view: GLView
    private _initial: mat4
    private _translate: mat4
    private _rotate: mat4
    private _rotate0 = vec2.create()
    private _rotate1 = vec2.create()
    private _osd?: FlyModeOnScreenDisplay

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
    private update() {
        mat4.identity(this._view.ctx.camera)
        mat4.mul(this._view.ctx.camera, this._view.ctx.camera, this._rotate)
        mat4.mul(this._view.ctx.camera, this._view.ctx.camera, this._translate)
        mat4.mul(this._view.ctx.camera, this._view.ctx.camera, this._initial)

        if (this._osd) {
            this._osd.update()
        } else {
            this._osd = new FlyModeOnScreenDisplay(this._view)
        }
    }
    override onpointermove(ev: PointerEvent): boolean {

        const canvas = this._view.canvas

        const marginX = Math.round(((canvas.width / 2) * 9) / 10)
        const marginY = Math.round(((canvas.height / 2) * 9) / 10)

        const x = canvas.width / 2 - ev.offsetX
        const y = canvas.height / 2 - ev.offsetY

        if (x < -marginX) {
            this._rotate1[0] -= x + marginX
        } else if (x > marginX) {
            this._rotate1[0] -= x - marginX
        } else {
            this._rotate0[0] = -x
        }

        if (y < -marginY) {
            this._rotate1[1] -= y + marginY
        } else if (y > marginY) {
            this._rotate1[1] -= y - marginY
        } else {
            this._rotate0[1] = -y
        }

        this._rotate = euler_matrix(
            (this._rotate0[0] + this._rotate1[0]) / D / 10,
            (this._rotate0[1] + this._rotate1[1]) / D / 10,
            0,
            'syxz'
        )

        // mat4.identity(this._rotate)
        // mat4.rotateX(this._rotate, this._rotate, y)
        // mat4.rotateY(this._rotate, this._rotate, x)

        this.update()

        this._view.invalidate()
        return true
    }
    override keydown(ev: KeyboardEvent): boolean {
        const ctx = this._view.ctx
        const acceleration = 2.5 / 10

        const cameraRotation = mat4.clone(ctx.camera)
        mat4.mul(cameraRotation, cameraRotation, this._rotate)
        cameraRotation[12] = cameraRotation[13] = cameraRotation[14] = 0
        // mat4.rotateY(cm, cm, ctx.rotateY / D)
        // mat4.rotateX(cm, cm, ctx.rotateX / D)
        mat4.invert(cameraRotation, cameraRotation)

        const dirX = vec3.transformMat4(
            vec3.create(),
            vec3.fromValues(acceleration, 0, 0),
            cameraRotation
        )
        const dirY = vec3.transformMat4(
            vec3.create(),
            vec3.fromValues(0, acceleration, 0),
            cameraRotation
        )
        const dirZ = vec3.transformMat4(
            vec3.create(),
            vec3.fromValues(0, 0, acceleration),
            cameraRotation
        )

        switch (ev.code) {
            case 'KeyW': // forward
                mat4.translate(this._translate, this._translate, dirZ)
                this._view.invalidate()
                break
            case 'KeyS': // backward
                vec3.negate(dirZ, dirZ)
                mat4.translate(this._translate, this._translate, dirZ)
                this._view.invalidate()
                break
            case 'KeyA': // left
                mat4.translate(this._translate, this._translate, dirX)
                this._view.invalidate()
                break
            case 'KeyD': // right
                vec3.negate(dirX, dirX)
                mat4.translate(this._translate, this._translate, dirX)
                this._view.invalidate()
                break
            case 'KeyQ': // down
                this._translate[13] += acceleration
                this._view.invalidate()
                break
            case 'KeyE': // up
                this._translate[13] -= acceleration
                this._view.invalidate()
                break
            case 'KeyR': // local down
                mat4.translate(this._translate, this._translate, dirY)
                break
            case 'KeyF': // local up
                vec3.negate(dirY, dirY)
                mat4.translate(this._translate, this._translate, dirY)
                break
            case 'Escape':
                this._view.inputHandler = undefined
                this._view.app.status.value = ''
                break
            default:
                return false
        }
        this.update()
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

        this.app.status.value =
            '◧ Confirm ◨/␛ Cancel 🅆🄰🅂🄳 Move 🄴🅀 Up/Down 🅁🄵 Local Up/Down ⇧ Fast ⌥ Slow +− Acceleration 🅉 Z Axis Correction'
        this.inputHandler = new FlyMode(this)

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
            this.app.renderer.paint(this.app, this)
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

        window.onkeydown = (ev: KeyboardEvent) => {
            const acceleration = 2.5 / 100

            const D = 180 / Math.PI
            const cm = mat4.create()
            mat4.rotateY(cm, cm, this.ctx.rotateY / D)
            mat4.rotateX(cm, cm, this.ctx.rotateX / D)
            mat4.invert(cm, cm)
            const dirX = vec3.transformMat4(
                vec3.create(),
                vec3.fromValues(acceleration, 0, 0),
                cm
            )
            const dirY = vec3.transformMat4(
                vec3.create(),
                vec3.fromValues(0, acceleration, 0),
                cm
            )
            const dirZ = vec3.transformMat4(
                vec3.create(),
                vec3.fromValues(0, 0, acceleration),
                cm
            )

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
