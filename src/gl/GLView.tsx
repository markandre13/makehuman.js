import { mat4, vec3 } from "gl-matrix"
import type { Context } from "./input/Context"
import type { InputHandler } from "./input/InputHandler"
import { HTMLElementProps, ref, View } from "toad.js"
import { deg2rad } from "lib/calculateNormals"

export interface GLViewProps extends HTMLElementProps {
    ctx: Context
}

export class GLView extends View {
    // DOM
    canvas!: HTMLCanvasElement
    overlay!: HTMLElement
    // status!: HTMLElement
    overlaySVG!: SVGElement
    // GL
    ctx: Context
    gl: WebGL2RenderingContext

    draw?: () => void

    constructor(props: GLViewProps) {
        super(props)
        this.ctx = props.ctx
        this.invalidate = this.invalidate.bind(this)
        this.paint = this.paint.bind(this)

        this.replaceChildren(...<>
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
        </>)
        this.setupEventHandling()
        this.gl = this.canvas.getContext("webgl") as WebGL2RenderingContext
        if (this.gl === null) {
            throw Error(
                "Unable to initialize WebGL. Your browser or machine may not support it."
            )
        }
    }

    override connectedCallback(): void {
        this.invalidate()
    }

    prepareCanvas() {
        const canvas = this.canvas
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
            // console.log(`canvas ${canvas.clientWidth} x ${canvas.clientHeight}`)
        }
    }

    prepare() {
        const gl = this.gl
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        const bg = this.ctx.background
        gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
        gl.clearDepth(1.0)
        gl.enable(gl.DEPTH_TEST)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)

        const fieldOfView = deg2rad(45)
        const canvas = this.canvas
        const aspect = canvas.clientWidth / canvas.clientHeight
        const zNear = 0.1
        const zFar = 100.0
        const projectionMatrix = mat4.perspective(
            mat4.create(),
            fieldOfView,
            aspect,
            zNear,
            zFar
        )

        const modelViewMatrix = this.ctx.camera

        const normalMatrix = mat4.create()
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        return { projectionMatrix, modelViewMatrix, normalMatrix }
    }

    /*
     * InputHandler
     */
    private _inputHandlerStack: InputHandler[] = [];
    pushInputHandler(inputHandler: InputHandler): string | undefined {
        this._inputHandlerStack.push(inputHandler)
        return inputHandler.info()
    }
    popInputHandler(): string | undefined {
        this._inputHandlerStack.pop()?.destructor()
        let handler
        if (this._inputHandlerStack.length > 0) {
            handler = this._inputHandlerStack[this._inputHandlerStack.length - 1]
        }
        return handler?.info()
    }

    protected paint() {
        this._redrawIsPending = false
        if (this.draw) {
            this.draw()
        }
        // if (this.app.renderer) {
        //     this.app.renderer.paint(this.app, this)
        // }
        // console.log(`this._inputHandlerStack.length = ${this._inputHandlerStack.length }`)
        for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
            this._inputHandlerStack[i]!.paint()
        }
    }
    protected _redrawIsPending = false;
    invalidate() {
        if (this._redrawIsPending) {
            return
        }
        this._redrawIsPending = true
        requestAnimationFrame(this.paint)
    }

    selectionCenter(): vec3 | undefined {
        for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
            const center = this._inputHandlerStack[i]!.selectionCenter()
            if (center !== undefined) {
                return center
            }
        }
        return vec3.create()
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
        let downX = 0, downY = 0, buttonDown = false
        canvas.oncontextmenu = (ev: MouseEvent) => {
            ev.preventDefault()
        }
        canvas.onpointerdown = (ev: PointerEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i]!.pointerdown(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()

            // if (this.renderHandler && !this.renderHandler.onpointerdown(ev)) {
            //     return
            // }
            canvas.setPointerCapture(ev.pointerId)
            buttonDown = true
            downX = ev.x
            downY = ev.y
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i]!.pointerup(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()
            // if (
            //     !buttonDown &&
            //     this.renderHandler &&
            //     !this.renderHandler.onpointerup(ev)
            // ) {
            //     return
            // }
            buttonDown = false
        }
        canvas.onpointermove = (ev: PointerEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i]!.pointermove(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()
            // if (
            //     !buttonDown &&
            //     this.renderHandler &&
            //     !this.renderHandler.onpointermove(ev)
            // ) {
            //     return
            // }
            // if (buttonDown) {
            //     const x = ev.x - downX
            //     const y = ev.y - downY
            //     if (x !== 0 || y !== 0) {
            //         ctx.rotateY += x
            //         ctx.rotateX += y
            //         downX = ev.x
            //         downY = ev.y
            //         requestAnimationFrame(this.paint)
            //     }
            // }
        }

        //
        // keyboard
        //
        window.onkeyup = (ev: KeyboardEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i]!.keyup(ev)
                if (ev.defaultPrevented) {
                    break
                }
            }
            ev.preventDefault()
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            for (let i = this._inputHandlerStack.length - 1; i >= 0; --i) {
                this._inputHandlerStack[i]!.keydown(ev)
                if (ev.defaultPrevented) {
                    break
                }
            }
            ev.preventDefault()
        }
    }
}
GLView.define('tx-glview', GLView)