import { Application } from 'Application'
import { Context } from 'render/Context'
import { RenderList } from 'render/RenderList'
import { RGBAShader } from 'render/shader/RGBAShader'
import { TextureShader } from 'render/shader/TextureShader'
import { loadTexture } from 'render/util'
import { HTMLElementProps, View, ref } from 'toad.js'
import { ColorShader } from '../shader/ColorShader'
import { mat4, vec3 } from 'gl-matrix'
import { Projection } from './Projection'
import { RenderHandler } from './RenderHandler'
import { InputHandler } from './InputHandler'
import { BasicMode } from './BasicMode'
import { euler_matrix } from 'lib/euler_matrix'

interface GLViewProps extends HTMLElementProps {
    app: Application
}

export const D = 180 / Math.PI

/**
 * class GLView
  paint()
    this.app.renderer.paint(this.app, this)
    this.inputHandler.paint()
  onpointerdown()
    this.inputHandler.onpointerdown(ev)
    this.renderHandler.onpointerdown(ev)
  onpointermove()
    this.inputHandler.onpointermove(ev)
    this.renderHandler.onpointermove(ev)
  onpointerup()
    this.inputHandler.onpointerup(ev)
    this.renderHandler.onpointerup(ev)
  onkeyup()
    this.inputHandler.keyup(ev)
  onkeydown()
    this.inputHandler.keydown(ev)
 */
export class GLView extends View {
    renderHandler?: RenderHandler

    private _inputHandlerStack: InputHandler[] = []
    pushInputHandler(inputHandler: InputHandler): void {
        this._inputHandlerStack.push(inputHandler)
        const info = inputHandler.info()
        // console.log(`GLView: push ${info}`)
        this.app.status.value = info ? info : ''
    }
    popInputHandler(): void {
        this._inputHandlerStack.pop()?.destructor()
        let info
        let handler
        if (this._inputHandlerStack.length > 0) {
            handler = this._inputHandlerStack[this._inputHandlerStack.length - 1]
        }
        if (handler) {
            info = handler.info()
        }
        // console.log(`GLView: pop (have handler: ${handler?"yes":"false"}, have info ${info?"yes":"false"}, info='${info}')`)
        this.app.status.value = info ? info : ''
    }

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

        this.pushInputHandler(new BasicMode(this))

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
        for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
            this._inputHandlerStack[i].paint()
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
        canvas.oncontextmenu = (ev: MouseEvent) => {
            ev.preventDefault()
        }
        canvas.onpointerdown = (ev: PointerEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i].pointerdown(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()

            if (this.renderHandler && !this.renderHandler.onpointerdown(ev)) {
                return
            }
            canvas.setPointerCapture(ev.pointerId)
            buttonDown = true
            downX = ev.x
            downY = ev.y
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i].pointerup(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()
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
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i].pointermove(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()
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
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i].keyup(ev)
                if (ev.defaultPrevented) {
                    break
                }
            }
            ev.preventDefault()
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i].keydown(ev)
                if (ev.defaultPrevented) {
                    break
                }
            }
            ev.preventDefault()
        }
    }
}
GLView.define('mh-glview', GLView)
