import { Application } from 'Application'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'
import { GLView, Projection, RenderHandler } from 'render/GLView'
import { RenderMesh } from 'render/RenderMesh'
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from 'render/util'

// i'm not sure if i should go with the webgl classes i've created so far...

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    mesh!: RenderMesh
    
    vertex!: Float32Array
    faces!: number[]

    override paint(app: Application, view: GLView): void {      
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA
        
        if (this.mesh === undefined) {
            const arkit = FaceARKitLoader.getInstance().preload()

            this.faces = arkit.neutral!.fxyz
            this.vertex = arkit.getVertex(
                app.updateManager.getBlendshapeModel()!
            )

            // duplicate triangles to achieve flat shading
            const v2 = new Float32Array(this.faces.length * 3)
            const f2 = new Array<number>(this.faces.length * 3)
            for(let i=0, vo=0, fo=0; i<this.faces.length;) {
                let i0 = this.faces[i++] * 3
                let i1 = this.faces[i++] * 3
                let i2 = this.faces[i++] * 3
                v2[vo++] = this.vertex[i0++]
                v2[vo++] = this.vertex[i0++]
                v2[vo++] = this.vertex[i0++]
                v2[vo++] = this.vertex[i1++]
                v2[vo++] = this.vertex[i1++]
                v2[vo++] = this.vertex[i1++]
                v2[vo++] = this.vertex[i2++]
                v2[vo++] = this.vertex[i2++]
                v2[vo++] = this.vertex[i2++]
                f2[fo] = fo
                ++fo
                f2[fo] = fo
                ++fo
                f2[fo] = fo
                ++fo
            }
            this.faces = f2
            this.vertex = v2

            this.mesh = new RenderMesh(
                gl,
                this.vertex,
                this.faces,
                undefined,
                undefined,
                false
            )
        // } else {
        //     this.mesh.update(this.vertex)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(
            canvas,
            ctx.projection === Projection.PERSPECTIVE
        )
        let modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)

        gl.drawElements(gl.TRIANGLES, this.faces.length, gl.UNSIGNED_SHORT, 0)
    }
}
