import { RenderMesh } from 'render/RenderMesh'
import { FlatMesh } from './FlatMesh'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { di } from 'lib/di'
import { FaceARKitLoader2 } from './FaceARKitLoader2'
import { trianglesToFlatTriangles } from 'gl/algorithms/trianglesToFlatTriangles'

export class ARKitFlat extends FlatMesh {
    constructor(gl: WebGL2RenderingContext) {
        super()
        const arkit = di.get(FaceARKitLoader2).preload()

        this.facesFlat = arkit._neutral!.fxyz
        this.vertexOrig = this.vertexFlat = arkit.getNeutral().xyz
        const xyz = new Float32Array(this.vertexFlat)

        arkit.getMorphTarget(Blendshape.jawOpen)?.apply(xyz, 0.5)

        this.vertexOrig = this.vertexFlat = xyz

        const { xyzFlat, fxyzFlat } = trianglesToFlatTriangles(this.facesFlat, xyz)
        this.facesFlat = fxyzFlat
        this.vertexFlat = xyzFlat

        // RenderMesh takes care of calculating the normals
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