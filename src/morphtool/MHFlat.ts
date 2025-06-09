import { Application } from 'Application'
import { BaseMeshGroup } from 'mesh/BaseMeshGroup'
import { RenderMesh } from 'render/RenderMesh'
import { FlatMesh } from './FlatMesh'

export class MHFlat extends FlatMesh {
    constructor(app: Application, gl: WebGL2RenderingContext) {
        super()
        const xyz = app.humanMesh.baseMesh.xyz
        const fxyz = app.humanMesh.baseMesh.fxyz

        const WORD_LENGTH = 2
        let offset = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        let length = app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length

        this.vertexOrig = xyz

        const f2 = new Array<number>(length * 4) // same number of faces
        const v2 = new Float32Array(length * 4 * 3) // four times the number of vertices
        for (let i = offset, vo = 0, fo = 0; i < length + offset;) {
            let i0 = fxyz[i++] * 3
            let i1 = fxyz[i++] * 3
            let i2 = fxyz[i++] * 3
            let i3 = fxyz[i++] * 3
            v2[vo++] = xyz[i0++]
            v2[vo++] = xyz[i0++]
            v2[vo++] = xyz[i0++]

            v2[vo++] = xyz[i1++]
            v2[vo++] = xyz[i1++]
            v2[vo++] = xyz[i1++]

            v2[vo++] = xyz[i2++]
            v2[vo++] = xyz[i2++]
            v2[vo++] = xyz[i2++]

            v2[vo++] = xyz[i3++]
            v2[vo++] = xyz[i3++]
            v2[vo++] = xyz[i3++]

            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
        }
        this.vertexFlat = v2
        this.facesFlat = f2
        // this.vertexMHFlat = xyz
        // this.facesMHFlat = fxyz
        this.renderMesh = new RenderMesh(gl, v2, f2)
    }
}
