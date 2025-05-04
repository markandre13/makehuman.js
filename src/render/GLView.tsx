import { Application } from "Application"
import { Context } from "render/Context"
import { RenderList } from "render/RenderList"
import { RGBAShader } from "render/shader/RGBAShader"
import { TextureShader } from "render/shader/TextureShader"
import { loadTexture } from "render/util"
import { HTMLElementProps, View, ref } from "toad.js"
import { ColorShader } from "./shader/ColorShader"
import { mat4, vec3, vec4 } from "gl-matrix"

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE,
}

export abstract class RenderHandler {
    abstract paint(app: Application, view: GLView): void
    onpointerdown(ev: PointerEvent): boolean { return true }
    onpointermove(ev: PointerEvent): boolean { return true }
    onpointerup(ev: PointerEvent): boolean { return true }
}

interface GLViewProps extends HTMLElementProps {
    app: Application
}

interface InputHandler {
    keydown(ev: KeyboardEvent): void
}
// class DefaultMode implements InputMode {
// }
class FlyMode implements InputHandler {
    private _view: GLView
    constructor(view: GLView) {
        this._view = view
    }
    keydown(ev: KeyboardEvent) {
        const ctx = this._view.ctx
        const acceleration = 2.5 / 100

        const D = 180 / Math.PI
        const cm = mat4.create()
        mat4.rotateY(cm, cm, ctx.rotateY / D)
        mat4.rotateX(cm, cm, ctx.rotateX / D)
        mat4.invert(cm, cm)
        const dirX = vec3.transformMat4(vec3.create(), vec3.fromValues(acceleration, 0, 0), cm)
        const dirY = vec3.transformMat4(vec3.create(), vec3.fromValues(0, acceleration, 0), cm)
        const dirZ = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, acceleration), cm)

        switch (ev.code) {
            case "KeyW": // forward
                vec3.add(ctx.pos, ctx.pos, dirZ)
                this._view.invalidate()
                break;
            case "KeyS": // backward
                vec3.sub(ctx.pos, ctx.pos, dirZ)
                this._view.invalidate()
                break;
            case "KeyA": // left
                vec3.add(ctx.pos, ctx.pos, dirX)
                this._view.invalidate()
                break;
            case "KeyD": // right
                vec3.sub(ctx.pos, ctx.pos, dirX)
                this._view.invalidate()
                break;
            case "KeyQ": // down
                ctx.pos[1] += acceleration
                this._view.invalidate()
                break;
            case "KeyE": // up
                ctx.pos[1] -= acceleration
                this._view.invalidate()
                break;
            case "KeyR": // local down
                vec3.add(ctx.pos, ctx.pos, dirY)
                this._view.invalidate()
                break;
            case "KeyF": // local up
                vec3.sub(ctx.pos, ctx.pos, dirY)
                this._view.invalidate()
                break;
            case "Escape":
                this._view.inputHandler = undefined
                this._view.app.status.value = ""
                break
        }
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
            rotateX: 0,
            rotateY: 0,
            pos: vec3.create(),
            projection: Projection.PERSPECTIVE,
        }

        this.replaceChildren(
            ...(
                <>
                    <canvas set={ref(this, "canvas")} style={{ width: "100%", height: "100%" }} />
                    <div
                        set={ref(this, "overlay")}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            overflow: "hidden",
                            pointerEvents: "none",
                        }}
                    ></div>
                    <svg
                        set={ref(this, "overlaySVG")}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            overflow: "hidden",
                            pointerEvents: "none",
                            width: "100%",
                            height: "100%"
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
        this.app.humanMesh.human.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
        this.app.humanMesh.wireframe.signal.add( () => {
            this.app.updateManager.invalidateView() 
        })

        // load texture and repaint once loaded
        this.bodyTexture = loadTexture(this.gl, "data/skins/textures/young_caucasian_female_special_suit.png", this.paint)!
        this.eyeTexture = loadTexture(this.gl, "data/eyes/materials/green_eye.png", this.paint)!
        // schedule initial paint
        requestAnimationFrame(this.paint)
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

        this.gl = (this.canvas.getContext("webgl2", opt) ||
            this.canvas.getContext("experimental-webgl", opt)) as WebGL2RenderingContext
        if (this.gl == null) {
            throw Error("Unable to initialize WebGL. Your browser or machine may not support it.")
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
            if (this.renderHandler && !this.renderHandler.onpointerdown(ev) ) {
                return
            }
            canvas.setPointerCapture(ev.pointerId)
            buttonDown = true
            downX = ev.x
            downY = ev.y
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            if (!buttonDown && this.renderHandler && !this.renderHandler.onpointerup(ev) ) {
                return
            }
            buttonDown = false
        }
        canvas.onpointermove = (ev: PointerEvent) => {
            if (!buttonDown && this.renderHandler && !this.renderHandler.onpointermove(ev) ) {
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
            const dirX = vec3.transformMat4(vec3.create(), vec3.fromValues(acceleration, 0, 0), cm)
            const dirY = vec3.transformMat4(vec3.create(), vec3.fromValues(0, acceleration, 0), cm)
            const dirZ = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 0, acceleration), cm)

            if (this.inputHandler) {
                this.inputHandler.keydown(ev)
            }

            switch (ev.code) {
                case "Numpad1": // front orthographic
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
                case "Numpad7": // top orthographic
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
                case "Numpad3": // right orthographic
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
                case "Numpad4":
                    ctx.rotateY -= 11.25
                    requestAnimationFrame(this.paint)
                    break
                case "Numpad6":
                    ctx.rotateY += 11.25
                    requestAnimationFrame(this.paint)
                    break
                case "Numpad8":
                    ctx.rotateX -= 11.25
                    requestAnimationFrame(this.paint)
                    break
                case "Numpad2":
                    ctx.rotateX += 11.25
                    requestAnimationFrame(this.paint)
                    break
                case "Numpad5": // toggle orthographic/perspective
                    if (ctx.projection === Projection.ORTHOGONAL) {
                        ctx.projection = Projection.PERSPECTIVE
                    } else {
                        ctx.projection = Projection.ORTHOGONAL
                    }
                    requestAnimationFrame(this.paint)
                    break
                case "Backquote":
                    if (ev.shiftKey) {
                        console.log(`enter flymode`)
                        this.app.status.value = '◧ Confirm ◨/␛ Cancel 🅆🄰🅂🄳 Move 🄴🅀 Up/Down 🅁🄵 Local Up/Down ⇧ Fast ⌥ Slow +− Acceleration 🅉 Z Axis Correction'
                        this.inputHandler = new FlyMode(this)
                    }
                    break
                default:
                    console.log(ev)
            }
        }
    }
}
GLView.define("mh-glview", GLView)
