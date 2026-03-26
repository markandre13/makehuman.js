import { RenderMesh } from 'render/RenderMesh'
import { FlatMesh } from './FlatMesh'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { di } from 'lib/di'
import { ARKitBlendshapeMesh } from './ARKitBlendshapeMesh'
import { trianglesToFlatTriangles } from 'gl/algorithms/trianglesToFlatTriangles'

// make this TriangleFlat?
// get rid of RenderMesh (in all of makehuman.js)
export class ARKitFlat extends FlatMesh {
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