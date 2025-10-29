import { Application } from 'Application'
import { mat4 } from 'gl-matrix'
import { calculateNormalsTriangles } from 'gl/algorithms/calculateNormalsTriangles'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { NormalBuffer } from 'gl/buffers/NormalBuffer'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { di } from 'lib/di'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { RenderHandler } from 'render/RenderHandler'
import { RenderView } from 'render/RenderView'
import { FaceARKitLoader2 } from './FaceARKitLoader2'


export class FaceRenderer extends RenderHandler {
    blendshapeSet: FaceARKitLoader2

    blendshapeParams?: Float32Array
    blendshapeTransform?: Float32Array

    private vertices!: VertexBuffer
    private normals!: NormalBuffer
    private indices!: IndexBuffer

    constructor() {
        super()
        this.blendshapeSet = di.get(FaceARKitLoader2).preload()
        this.blendshapeParams = new Float32Array(Blendshape.SIZE)
    }
    faceLandmarks(blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint): void {
        // console.log("FaceRenderer::faceLandmarks()")
        this.blendshapeParams = blendshapes
        this.blendshapeTransform = transform
        di.get(Application).glview.invalidate()
    }
    override defaultCamera(): () => mat4 {
        return di.get(Application).headCamera
    }
    override paint(app: Application, view: RenderView): void {
        if (this.blendshapeParams === undefined) {
            return
        }
        const gl = view.gl
        const shaderShadedMono = view.shaderShadedMono
        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])

        if (this.vertices === undefined) {
            const vertex = this.blendshapeSet.getVertex(this.blendshapeParams, this.blendshapeTransform!)
            this.vertices = new VertexBuffer(gl, vertex)
            this.indices = new IndexBuffer(gl, this.blendshapeSet.getNeutral().fxyz)
            this.normals = new NormalBuffer(gl, calculateNormalsTriangles(
                new Float32Array(vertex.length),
                vertex,
                this.blendshapeSet.getNeutral().fxyz
            ))
        } else {
            this.blendshapeSet.getVertex(this.blendshapeParams, this.blendshapeTransform!, this.vertices.data)
            this.vertices.update()
            calculateNormalsTriangles(
                this.normals.data,
                this.vertices.data,
                this.blendshapeSet.getNeutral().fxyz
            )
            this.normals.update()
        }

        this.vertices.bind(shaderShadedMono)
        this.normals.bind(shaderShadedMono)
        this.indices.bind()
        this.indices.drawTriangles()
    }
}
