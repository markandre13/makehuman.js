import { Application } from 'Application'
import { mat4, vec3 } from 'gl-matrix'
import { calculateNormalsTriangles } from 'gl/algorithms/calculateNormalsTriangles'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { NormalBuffer } from 'gl/buffers/NormalBuffer'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { di } from 'lib/di'
import { RenderHandler } from 'render/RenderHandler'
import { RenderView } from 'render/RenderView'
import { BlendshapeMeshAPI } from './BlendshapeMeshAPI'

/**
 * render animated blendshape mesh
 */
export class FaceRenderer extends RenderHandler {
    private blendshapeMesh: BlendshapeMeshAPI

    private vertices!: VertexBuffer
    private normals!: NormalBuffer
    private indices!: IndexBuffer

    constructor(blendshapeMesh: BlendshapeMeshAPI) {
        super()
        this.blendshapeMesh = blendshapeMesh
    }

    setBlendshapeMesh(blendshapeMesh: BlendshapeMeshAPI) {
        if (this.blendshapeMesh === blendshapeMesh) {
            return
        }
        this.blendshapeMesh = blendshapeMesh
        this.vertices = undefined as any // new mesh, new data structures
    }
    override defaultCamera(): () => mat4 {
        return di.get(Application).headCamera
    }
    override paint(_app: Application, view: RenderView): void {
        const blendshapeModel = _app.blendshapeModel

        const gl = view.gl
        const shaderShadedMono = view.shaderShadedMono
        view.prepareCanvas()
        const projectionMatrix = view.prepareProjection()

        const modelViewMatrix = mat4.clone(view.ctx.camera)

        let r = blendshapeModel.getRotation()
        if (r !== null) {
            const t0 = mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 7, 1))
            const t1 = mat4.fromTranslation(mat4.create(), vec3.fromValues(0, -7, -1))
            mat4.multiply(r, t0, r)
            mat4.multiply(r, r, t1)

            mat4.multiply(modelViewMatrix, modelViewMatrix, r)
        }

        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])

        if (this.vertices === undefined) {
            const vertex = this.blendshapeMesh.getVertex(blendshapeModel.params)
            this.vertices = new VertexBuffer(gl, vertex)
            this.indices = new IndexBuffer(gl, this.blendshapeMesh.fxyz)
            this.normals = new NormalBuffer(gl, calculateNormalsTriangles(
                new Float32Array(vertex.length),
                vertex,
                this.blendshapeMesh.fxyz
            ))
        } else {
            this.blendshapeMesh.getVertex(blendshapeModel.params, this.vertices.data)
            this.vertices.update()
            calculateNormalsTriangles(
                this.normals.data,
                this.vertices.data,
                this.blendshapeMesh.fxyz
            )
            this.normals.update()
        }

        this.vertices.bind(shaderShadedMono)
        this.normals.bind(shaderShadedMono)
        this.indices.bind()
        this.indices.drawTriangles()
    }
}
