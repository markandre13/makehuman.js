import { Application } from 'Application'
import { RenderList } from 'render/RenderList'
import { mat4 } from 'gl-matrix'
import { RenderHandler } from './RenderHandler'
import { ShaderShadedTextured } from 'gl/shaders/ShaderShadedTextured'
import { ShaderShadedColored } from 'gl/shaders/ShaderShadedColored'
import { GLView, GLViewProps } from 'gl/GLView'
import { BasicMode } from 'gl/input/BasicMode'
import { Context } from 'gl/input/Context'
import { ShaderShadedMono } from 'gl/shaders/ShaderShadedMono'
import { Texture } from 'gl/Texture'
import { InputHandler } from 'gl/input/InputHandler'
import { HTMLElementProps } from 'toad.jsx/lib/jsx-runtime'
import { ShaderColored } from 'gl/shaders/ShaderColored'
import { ShaderMono } from 'gl/shaders/ShaderMono'

export const D = 180 / Math.PI

export interface RenderViewProps extends HTMLElementProps {
    app: Application
}

export class RenderView extends GLView {
    renderHandler?: RenderHandler
    app: Application

    shaderMono!: ShaderMono
    shaderColored!: ShaderColored
    shaderShadedMono!: ShaderShadedMono
    shaderShadedTexture!: ShaderShadedTextured
    shaderShadedColored!: ShaderShadedColored
    renderList!: RenderList
    bodyTexture!: Texture
    eyeTexture!: Texture

    constructor(props: RenderViewProps) {
        const glprops = (props as any) as GLViewProps
        glprops.ctx = new Context()
        // move up by 7, move backwards by 5

        mat4.translate(glprops.ctx.camera, glprops.ctx.camera, [0, 0, -25]) // head
        const copy = mat4.clone(glprops.ctx.camera)
        glprops.ctx.defaultCamera = () => copy

        glprops.ctx.background = [0, 0, 0, 1]
        super(glprops)

        this.app = props.app
        this.app.glview = this
        if (props.app.renderer) {
            this.renderHandler = props.app.renderer
        }
        this.init = this.init.bind(this)
        // this.paint = this.paint.bind(this)

        this.pushInputHandler(new BasicMode(this))
    }

    override connectedCallback(): void {
        requestAnimationFrame(this.init)
    }

    private init() {
        this.initRender()

        // this belongs here but...
        this.app.updateManager.render = this.paint
        // ...this does not
        this.app.humanMesh.morphManager.signal.add(() => this.app.updateManager.invalidateView())
        this.app.humanMesh.wireframe.signal.add(() => this.app.updateManager.invalidateView())

        this.bodyTexture = new Texture(this, "data/skins/textures/young_caucasian_female_special_suit.png")
        this.eyeTexture = new Texture(this, "data/eyes/materials/green_eye.png")
    }

    private initRender() {
        const opt = {
            alpha: false,
            premultipliedAlpha: false,
        }

        this.gl = (this.canvas.getContext('webgl2', opt) ||
            this.canvas.getContext('experimental-webgl', opt)) as WebGL2RenderingContext
        if (this.gl == null) {
            throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
        }

        // flip texture pixels into the bottom-to-top order that WebGL expects.
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)

        this.shaderMono = new ShaderMono(this.gl)
        this.shaderColored = new ShaderColored(this.gl)
        this.shaderShadedMono = new ShaderShadedMono(this.gl)
        this.shaderShadedTexture = new ShaderShadedTextured(this.gl)
        this.shaderShadedColored = new ShaderShadedColored(this.gl)

        this.renderList = new RenderList(this.gl, this.app.humanMesh)
        this.app.updateManager.setRenderList(this.renderList)
    }

    override pushInputHandler(inputHandler: InputHandler) {
        const info = super.pushInputHandler(inputHandler)
        this.app.status.value = info ? info : ''
        return info
    }
    override popInputHandler() {
        const info = super.popInputHandler()
        this.app.status.value = info ? info : ''
        return info
    }
}
RenderView.define('mh-renderview', RenderView)
