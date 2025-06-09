import { Application } from 'Application'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'
import { RenderMesh } from 'render/RenderMesh'
import { NumberModel } from 'toad.js'
import { FlatMesh } from './FlatMesh'

export class ARKitFlat extends FlatMesh {
    constructor(app: Application, gl: WebGL2RenderingContext) {
        super()
        const arkit = FaceARKitLoader.getInstance().preload()

        this.facesFlat = arkit.neutral!.fxyz
        this.vertexOrig = this.vertexFlat = arkit.getVertex(
            app.updateManager.getBlendshapeModel()!
        )

        const scale = new NumberModel(0.18, { min: 9, max: 11, step: 0.1, label: "scale" })
        const dy = new NumberModel(7.0312, { min: 0, max: 7.4, step: 0.01, label: "dy" })
        const dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" })

        const xyz = new Float32Array(this.vertexFlat)
        // this.blendshapeSet.getTarget(this.blendshape.value)?.apply(this.xyz, 1)
        for (let i = 0; i < xyz.length; ++i) {
            xyz[i] *= scale.value
        }
        for (let i = 1; i < xyz.length; i += 3) {
            xyz[i] += dy.value
        }
        for (let i = 2; i < xyz.length; i += 3) {
            xyz[i] += dz.value
        }
        this.vertexOrig = this.vertexFlat = xyz

        // duplicate triangles to achieve flat shading
        const v2 = new Float32Array(this.facesFlat.length * 3)
        const f2 = new Array<number>(this.facesFlat.length * 3)
        for (let i = 0, vo = 0, fo = 0; i < this.facesFlat.length;) {
            let i0 = this.facesFlat[i++] * 3
            let i1 = this.facesFlat[i++] * 3
            let i2 = this.facesFlat[i++] * 3
            v2[vo++] = this.vertexFlat[i0++]
            v2[vo++] = this.vertexFlat[i0++]
            v2[vo++] = this.vertexFlat[i0++]
            v2[vo++] = this.vertexFlat[i1++]
            v2[vo++] = this.vertexFlat[i1++]
            v2[vo++] = this.vertexFlat[i1++]
            v2[vo++] = this.vertexFlat[i2++]
            v2[vo++] = this.vertexFlat[i2++]
            v2[vo++] = this.vertexFlat[i2++]
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
        }
        this.facesFlat = f2
        this.vertexFlat = v2

        this.renderMesh = new RenderMesh(
            gl,
            this.vertexFlat,
            this.facesFlat,
            undefined,
            undefined,
            false
        )
    }
}
