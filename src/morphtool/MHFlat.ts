import { RenderMesh } from 'render/RenderMesh'
import { FlatMesh } from './FlatMesh'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { di } from 'lib/di'
import { ARKitBlendshapeMesh } from './ARKitBlendshapeMesh'
import { trianglesToFlatTriangles } from 'gl/algorithms/trianglesToFlatTriangles'
import { ShaderMono } from 'gl/shaders/ShaderMono'
import { ShaderShadedMono } from 'gl/shaders/ShaderShadedMono'
import { ShaderShadedTextured } from 'gl/shaders/ShaderShadedTextured'
import { mat4, vec2, vec4 } from 'gl-matrix'
import { findVertex } from 'gl/algorithms/findVertex'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { Application } from 'Application'
import { BaseMeshGroup } from 'mesh/BaseMeshGroup'
import { quadsToFlatQuads } from 'gl/algorithms/quadsToFlatQuads'

/**
 * a flat shaded variant of app.humanMesh.vertexRigged
 */
export class MHFlat extends FlatMesh {
        protected vertexFlat!: Float32Array
    protected facesFlat!: number[]

    protected renderMesh!: RenderMesh

    app: Application
    constructor(app: Application, gl: WebGL2RenderingContext) {
        super()
        this.app = app
        this.calc()
        this.renderMesh = new RenderMesh(gl, this.vertexFlat, this.facesFlat)
    }

    override update() {
        this.calc()
        this.renderMesh.glVertex.update(this.vertexFlat) // this also take care of the normals
    }

    private calc() {
        const xyz = this.app.humanMesh.vertexRigged
        const fxyz = this.app.humanMesh.baseMesh.fxyz

        const WORD_LENGTH = 2
        let offset = this.app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        let length = this.app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length

        this.vertexOrig = xyz

        const { xyzFlat, fxyzFlat } = quadsToFlatQuads(fxyz, xyz, offset, length)
        this.facesFlat = fxyzFlat
        this.vertexFlat = xyzFlat
    }

    override bind(shader: ShaderMono | ShaderShadedMono | ShaderShadedTextured): void {
        this.renderMesh.bind(shader)
    }
    override draw(gl: WebGL2RenderingContext): void {
        gl.drawElements(gl.TRIANGLES, this.facesFlat.length, gl.UNSIGNED_SHORT, 0)
    }
    override findVertex(pos: vec2, canvas: HTMLCanvasElement, modelViewMatrix: mat4): number | undefined {
        return findVertex(pos, this.vertexOrig, canvas, modelViewMatrix)
    }
    override getVec4(vertexIdx: number) {
        return vec4.fromValues(this.vertexOrig[vertexIdx], this.vertexOrig[vertexIdx + 1], this.vertexOrig[vertexIdx + 2], 1)
    }
    override get indices(): IndexBuffer {
        return this.renderMesh.glIndices
    }
    override get vertices(): VertexBuffer {
        return this.renderMesh.glVertex
    }
}
