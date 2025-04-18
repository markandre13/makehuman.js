import { Application } from "Application"
import { Context } from "render/Context"
import { RenderList } from "render/RenderList"
import { RGBAShader } from "render/shader/RGBAShader"
import { TextureShader } from "render/shader/TextureShader"
import { loadTexture } from "render/util"
import { HTMLElementProps, View, ref } from "toad.js"
import { ColorShader } from "./shader/ColorShader"

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE,
}

export abstract class RenderHandler {
    abstract paint(app: Application, view: GLView): void
}

interface GLViewProps extends HTMLElementProps {
    app: Application
}

export class GLView extends View {
    renderHandler?: RenderHandler

    app: Application

    // DOM
    canvas!: HTMLCanvasElement
    overlay!: HTMLElement

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
        this.init = this.init.bind(this)
        this.paint = this.paint.bind(this)

        this.ctx = {
            rotateX: 0,
            rotateY: 0,
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
        if (this.app.renderer) {
            this.app.renderer.paint(this.app, this)
        }
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
            canvas.setPointerCapture(ev.pointerId)
            buttonDown = true
            downX = ev.x
            downY = ev.y
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            buttonDown = false
        }
        canvas.onpointermove = (ev: PointerEvent) => {
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
            }
        }
    }
}
GLView.define("mh-glview", GLView)
