import { RenderMesh } from 'render/RenderMesh'
import { FlatMesh } from './FlatMesh'
import { Blendshape } from 'blendshapes/BlendShape'
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
import { calculateNormalsTriangles } from 'gl/algorithms/calculateNormalsTriangles'
import { NormalBuffer } from 'gl/buffers/NormalBuffer'

// make this TriangleFlat?
export class ARKitFlat extends FlatMesh {
    protected vertexFlat!: Float32Array
    protected facesFlat!: number[]

    glIndices: IndexBuffer
    glVertex: VertexBuffer
    normal: Float32Array
    glNormal: NormalBuffer

    constructor(gl: WebGL2RenderingContext) {
        super()
        const arkit = di.get(ARKitBlendshapeMesh).preload()

        this.facesFlat = arkit._neutral!.fxyz
        this.vertexOrig = this.vertexFlat = arkit.getNeutral().xyz
        const xyz = new Float32Array(this.vertexFlat)

        arkit.getMorphTarget(Blendshape.jawOpen)?.apply(xyz, 0.5)

        this.vertexOrig = this.vertexFlat = xyz

        const { xyzFlat, fxyzFlat } = trianglesToFlatTriangles(this.facesFlat, xyz)
        this.facesFlat = fxyzFlat
        this.vertexFlat = xyzFlat

        this.glIndices = new IndexBuffer(gl, fxyzFlat)
        this.glVertex = new VertexBuffer(gl, xyzFlat)
        this.normal = new Float32Array(xyzFlat.length)
        calculateNormalsTriangles(this.normal, xyzFlat, fxyzFlat)
        this.glNormal = new NormalBuffer(gl, this.normal)
    }

    override bind(shader: ShaderMono | ShaderShadedMono | ShaderShadedTextured): void {
        this.glIndices.bind()
        this.glVertex.bind(shader)
        if (shader instanceof ShaderShadedMono || shader instanceof ShaderShadedTextured) {
            this.glNormal.bind(shader)
        }
    }
    override update(): void { }
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
        return this.glIndices
    }
    override get vertices(): VertexBuffer {
        return this.glVertex
    }
}