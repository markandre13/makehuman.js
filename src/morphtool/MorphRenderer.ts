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
import { quadsToEdges, trianglesToEdges } from 'gl/algorithms'
import { BaseMeshGroup } from 'mesh/BaseMeshGroup'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'

interface PickMesh {
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

    pickMeshes!: PickMesh[]

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

        if (this.pickMeshes === undefined) {
            this.initPickMeshes(app, view)
        }
        view.prepareCanvas()

        // this.drawVerticesToPick(view)
        // return
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)
        gl.depthMask(true)
        const alpha = 0.25

        const [activeMesh, inactiveMesh] = this.model.isARKitActive.value
            ? [this.pickMeshes[1], this.pickMeshes[0]]
            : [this.pickMeshes[0], this.pickMeshes[1]]

        // draw the active mesh as solid
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])
        activeMesh.flat.bind(shaderShadedMono)
        activeMesh.flat.draw(gl)

        // draw inactive mesh as transparent
        if (this.model.showBothMeshes.value) {
            // disable writing to z-buffer so that it does not hide the selection
            gl.depthMask(false)
            gl.disable(gl.CULL_FACE)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            shaderShadedMono.setColor(gl, [0, 0.5, 1, alpha])
            inactiveMesh.flat.bind(shaderShadedMono)
            inactiveMesh.flat.draw(gl)
            gl.depthMask(true)
        }

        // draw selection (edges and vertices)
        // const activeMesh = this.model.isARKitActive.value ? this.pickMeshes[1] : this.pickMeshes[0]
        const shaderColored = view.shaderColored
        shaderColored.use(gl)
        shaderColored.setPointSize(gl, 4.5)
        shaderColored.setProjection(gl, projectionMatrix)
        shaderColored.setModelView(gl, modelViewMatrix)

        activeMesh.vertices.bind(shaderColored)
        activeMesh.selectionColors.bind(shaderColored)

        activeMesh.indicesAllPoints.bind()
        activeMesh.indicesAllPoints.drawPoints()

        activeMesh.indicesAllEdges.bind()
        activeMesh.indicesAllEdges.drawLines()
    }

    private initPickMeshes(app: Application, view: RenderView) {
        const gl = view.gl
        // TODO: don't let them use RenderMesh and re-use data for the picking
        const mh = new MHFlat(app, gl)
        const ak = new ARKitFlat(app, gl)

        // makehuman verticed, not morphed, not rigged
        const mhVertices = new VertexBuffer(gl, app.humanMesh.baseMesh.xyz)
        // get all the quads for the skin mesh
        const mhSkinQuadIndices = app.humanMesh.baseMesh.fxyz.slice(
            app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
            app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        )
        const mhUniqueIndexSet = new Set<number>
        for (const index of mhSkinQuadIndices) {
            mhUniqueIndexSet.add(index)
        }
        // TODO: optimize ARKit
        const arobj = FaceARKitLoader.getInstance().neutral!

        const arVertices = new VertexBuffer(gl, ak.vertexOrig) // this version is already pre-scaled and translated

        this.pickMeshes = [{
            flat: mh,
            vertices: mhVertices,
            indicesAllPoints: new IndexBuffer(gl, Array.from(mhUniqueIndexSet)),
            indicesAllEdges: quadsToEdges(gl, mhSkinQuadIndices),
            pickColors: new PickColorBuffer(mhVertices),
            selectionColors: new SelectionColorBuffer(mhVertices)
        }, {
            flat: ak,
            vertices: arVertices,
            indicesAllPoints: indicesForAllVertices(arVertices),
            indicesAllEdges: trianglesToEdges(gl, arobj.fxyz), // this is too much
            pickColors: new PickColorBuffer(arVertices),
            selectionColors: new SelectionColorBuffer(arVertices)
        }]
    }

    // we need to do the following
    // * when a mesh group is selected
    //   set the selection colors
    // * when a point is toggled
    //   ...
    // THIS CLASS:
    //   get/set selected indices.
    //   the rest is handled by the MorphTool
    //   SelectionColorBuffer should track the indices on it's own in a set
    //   and allow to set a single color for all selected vertices

    toggle(index: number) {
        const [activeMesh, inactiveMesh] = this.model.isARKitActive.value
            ? [this.pickMeshes[1], this.pickMeshes[0]]
            : [this.pickMeshes[0], this.pickMeshes[1]]
        activeMesh.selectionColors.toggle(index)
    }

    drawVerticesToPick(view: RenderView) {
        const gl = this.app.glview.gl
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)

        // prepare with black background
        const oldBg = view.ctx.background
        view.ctx.background = [0, 0, 0, 1]
        const { projectionMatrix, modelViewMatrix } = this.app.glview.prepare()
        view.ctx.background = oldBg

        const mesh = this.model.isARKitActive.value ? this.pickMeshes[1] : this.pickMeshes[0]

        // paint mesh in black
        const shaderMono = view.shaderMono
        shaderMono.use(gl)
        shaderMono.setProjection(gl, projectionMatrix)
        shaderMono.setModelView(gl, modelViewMatrix)
        shaderMono.setColor(gl, [0, 0, 0, 1])
        mesh.flat.bind(shaderMono)
        mesh.flat.draw(gl)

        // paint vertices
        const shaderColored = view.shaderColored
        shaderColored.use(gl)
        shaderColored.setPointSize(gl, 4.5)
        shaderColored.setProjection(gl, projectionMatrix)
        shaderColored.setModelView(gl, modelViewMatrix)
        mesh.indicesAllPoints.bind()
        mesh.vertices.bind(shaderColored)
        mesh.pickColors.bind(shaderColored)
        mesh.indicesAllPoints.drawPoints()
    }
}

function indicesForAllVertices(verts: VertexBuffer) {
    const buffer = new Uint16Array(verts.data.length / 3)
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = i
    }
    return new IndexBuffer(verts.gl, buffer)
}