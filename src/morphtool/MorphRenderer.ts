import { Application } from 'Application'
import { RenderHandler } from 'render/RenderHandler'
import { ARKitFlat } from './ARKitFlat'
import { MorphToolModel } from './MorphToolModel'
import { MHFlat } from './MHFlat'
import { RenderView } from 'render/RenderView'
import { di } from 'lib/di'
import { ShaderMono } from 'gl/shaders/ShaderMono'
import { ShaderColored } from 'gl/shaders/ShaderColored'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    private app: Application
    private model: MorphToolModel
      
    arflat!: ARKitFlat
    mhflat!: MHFlat

    constructor(app: Application, model: MorphToolModel) {
        super()
        this.app = app
        this.model = model
        this.model.isARKitActive.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
        this.model.showBothMeshes.signal.add( () => {
            this.app.updateManager.invalidateView()
        })
    }
    override defaultCamera() {
        return di.get(Application).headCamera
    }
    override paint(app: Application, view: RenderView): void {
        // prepare
        const gl = view.gl
        const shaderShadedMono = view.shaderShadedMono       
        if (this.arflat === undefined) {
            this.mhflat = new MHFlat(app, gl)
            this.arflat = new ARKitFlat(app, gl)
        }
        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
  
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)
        gl.depthMask(true)
        const alpha = 0.25

        const mesh = this.model.isARKitActive.value ? [this.arflat, this.mhflat] : [this.mhflat, this.arflat]

        // draw solid mesh
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])
        mesh[0].bind(shaderShadedMono)
        mesh[0].draw(gl)

        // draw transparent mesh
        if (this.model.showBothMeshes.value) {
            gl.disable(gl.CULL_FACE)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            shaderShadedMono.setColor(gl, [0, 0.5, 1, alpha])
            mesh[1].bind(shaderShadedMono)
            mesh[1].draw(gl)
        }      
    }

    drawVerticesToPick(shader: ShaderMono, shaderWithColors: ShaderColored) {
        const mesh = this.model.isARKitActive.value ? this.arflat : this.mhflat

        const gl = this.app.glview.gl
        gl.clearColor(0, 0, 0, 1)
        const { projectionMatrix, modelViewMatrix } = this.app.glview.prepare()

        // paint mesh
        shader.use(gl)
        shader.setProjection(gl, projectionMatrix)
        shader.setModelView(gl, modelViewMatrix)
        shader.setColor(gl, [0, 0, 0, 1])

        mesh.bind(shader)
        mesh.draw(gl)

        // this.vertices.bind(shader)
        // this.indicesFaces.bind()
        // this.indicesFaces.drawTriangles()

        // paint vertices
        shaderWithColors.use(gl)
        shaderWithColors.setPointSize(gl, 4.5)
        shaderWithColors.setProjection(gl, projectionMatrix)
        shaderWithColors.setModelView(gl, modelViewMatrix)
        // this.vertices.bind(shaderWithColors)
        // this.pickColors.bind(shaderWithColors)
        // this.indicesVertices.bind()
        // this.indicesVertices.drawPoints()
    }
}

export function indicesForAllVertices(verts: VertexBuffer) {
    const buffer = new Uint16Array(verts.data.length / 3)
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = i
    }
    return new IndexBuffer(verts.gl, buffer)
}