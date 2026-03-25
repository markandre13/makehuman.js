import { Application } from 'Application'
import { BaseMeshGroup } from 'mesh/BaseMeshGroup'
import { RenderMesh } from 'render/RenderMesh'
import { FlatMesh } from './FlatMesh'
import { quadsToFlatQuads } from 'gl/algorithms/quadsToFlatQuads'

export class MHFlat extends FlatMesh {
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
}
