import { Application } from 'Application'
import { RenderHandler } from 'render/RenderHandler'
import { ARKitFlat } from './ARKitFlat'
import { MorphToolModel } from './MorphToolModel'
import { MHFlat } from './MHFlat'
import { RenderView } from 'render/RenderView'
import { di } from 'lib/di'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { PickColorBuffer } from 'gl/buffers/PickColorBuffer'
import { SelectionColorBuffer } from 'gl/buffers/SelectionColorBuffer'
import { FlatMesh } from './FlatMesh'
import { quadsToEdges } from 'gl/algorithms'

interface X {
    flat: FlatMesh
    indicesAllPoints: IndexBuffer
    indicesAllEdges: IndexBuffer
    vertices: VertexBuffer
    pickColors: PickColorBuffer
    selectionColors: SelectionColorBuffer
}

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    private app: Application
    private model: MorphToolModel

    x!: X[]
    // arflat!: ARKitFlat
    // mhflat!: MHFlat

    constructor(app: Application, model: MorphToolModel) {
        super()
        this.app = app
        this.model = model
        this.model.isARKitActive.signal.add(() => {
            this.app.updateManager.invalidateView()
        })
        this.model.showBothMeshes.signal.add(() => {
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

        const mh = new MHFlat(app, gl)
        const ak = new ARKitFlat(app, gl)

        if (this.x === undefined) {
            this.x = [{
                flat: mh,
                vertices: mh.vertices,
                indicesAllPoints: indicesForAllVertices(mh.vertices),
                indicesAllEdges: mh.indices, // quadsToEdges(mh.indices),
                pickColors: new PickColorBuffer(mh.vertices),
                selectionColors: new SelectionColorBuffer(mh.vertices)
            }, {
                flat: ak,
                vertices: ak.vertices,
                indicesAllPoints: indicesForAllVertices(ak.vertices),
                indicesAllEdges: ak.indices,
                pickColors: new PickColorBuffer(ak.vertices),
                selectionColors: new SelectionColorBuffer(mh.vertices)
            }]
        }
        view.prepareCanvas()

        // this.drawVerticesToPick(view)
        // return
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)
        gl.depthMask(true)
        const alpha = 0.25

        const mesh = this.model.isARKitActive.value ? [this.x[1].flat, this.x[0].flat] : [this.x[0].flat, this.x[1].flat]

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

        // draw selection colors
        const x = this.model.isARKitActive.value ? this.x[1] : this.x[0]
        const shaderColored = view.shaderColored
        shaderColored.use(gl)
        shaderColored.setPointSize(gl, 4.5)
        shaderColored.setProjection(gl, projectionMatrix)
        shaderColored.setModelView(gl, modelViewMatrix)
        x.vertices.bind(shaderColored)
        x.selectionColors.bind(shaderColored)

        x.indicesAllPoints.bind()
        x.indicesAllPoints.drawPoints()

        x.indicesAllEdges.bind()
        x.indicesAllEdges.drawLines()
    }

    drawVerticesToPick(view: RenderView) {
        const gl = this.app.glview.gl
        // gl.clearColor(1, 0, 0, 1)
        const oldBg = view.ctx.background
        view.ctx.background = [0, 0, 0, 1]
        const { projectionMatrix, modelViewMatrix } = this.app.glview.prepare()
        view.ctx.background = oldBg

        const x = this.model.isARKitActive.value ? this.x[1] : this.x[0]
        const mesh = this.model.isARKitActive.value ? this.x[1].flat : this.x[0].flat

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)

        // paint mesh in black
        const shaderMono = view.shaderMono
        shaderMono.use(gl)
        shaderMono.setProjection(gl, projectionMatrix)
        shaderMono.setModelView(gl, modelViewMatrix)
        shaderMono.setColor(gl, [0, 0, 0, 1])

        mesh.bind(shaderMono)
        mesh.draw(gl)

        const shaderColored = view.shaderColored

        shaderColored.use(gl)
        shaderColored.setPointSize(gl, 4.5)
        shaderColored.setProjection(gl, projectionMatrix)
        shaderColored.setModelView(gl, modelViewMatrix)
        x.indicesAllPoints.bind()
        x.vertices.bind(shaderColored)
        x.pickColors.bind(shaderColored)
        x.indicesAllPoints.drawPoints()
    }
}

export function indicesForAllVertices(verts: VertexBuffer) {
    const buffer = new Uint16Array(verts.data.length / 3)
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = i
    }
    return new IndexBuffer(verts.gl, buffer)
}