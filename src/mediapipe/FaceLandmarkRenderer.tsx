import { Application } from "Application"
import { GLView, Projection, RenderHandler } from "GLView"
import { WavefrontObj } from "mesh/WavefrontObj"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { renderFace } from "render/renderFace"
import { Frontend_impl } from "./Frontend_impl"
import { FaceRenderType } from "./mediapipe"

/**
 * Render MediaPipe's 3d face landmarks
 */
export class FaceLandmarkRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    neutral: WavefrontObj

    constructor(frontend: Frontend_impl) {
        super()
        this.frontend = frontend
        this.neutral = new WavefrontObj("data/3dobjs/mediapipe_canonical_face_model.obj")
    }

    override paint(app: Application, view: GLView): void {
        let a: FaceRenderType = FaceRenderType.MP_LANDMARKS

        if (a === FaceRenderType.MP_LANDMARKS) {
            if (this.frontend.landmarks) {
                renderFace(view.canvas, this.frontend.landmarks, this.neutral.fxyz)
            }
            return
        }

        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        //
        // ARKit
        //
        if (a === FaceRenderType.ARKIT) {
            // if (neutral === undefined) {
            //     neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
            //     for (let i = 0; i < neutral.vertex.length; ++i) {
            //         neutral.vertex[i] = neutral.vertex[i] * scale
            //     }
            //     for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            //         if (blendshape === 0) {
            //             continue
            //         }
            //         const name = blendshapeNames[blendshape]
            //         const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
            //         for (let i = 0; i < neutral.vertex.length; ++i) {
            //             dst.vertex[i] = dst.vertex[i] * scale
            //         }
            //         const target = new Target()
            //         target.diff(neutral.vertex, dst.vertex)
            //         targets[blendshape] = target
            //         weights[blendshape] = 0
            //     }
            //     this.mesh = new RenderMesh(gl, neutral.vertex, neutral.fxyz, undefined, undefined, false)
            // }
        }

        //
        // ICT Facekit
        //
        if (a === FaceRenderType.ICTFACEKIT) {
            // if (neutral === undefined) {
            //     neutral = new WavefrontObj("data/blendshapes/ict/_neutral.obj")
            //     for (let i = 0; i < neutral.vertex.length; ++i) {
            //         neutral.vertex[i] = neutral.vertex[i] * scale
            //     }
            //     for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            //         if (blendshape === 0) {
            //             continue
            //         }
            //         let name = blendshapeNames[blendshape]
            //         switch (name) {
            //             case "browInnerUp":
            //                 name = "browInnerUp_L"
            //                 break
            //             case "cheekPuff":
            //                 name = "cheekPuff_L"
            //                 break
            //         }
            //         let dst = new WavefrontObj(`data/blendshapes/ict/${name}.obj`)
            //         for (let i = 0; i < neutral.vertex.length; ++i) {
            //             dst.vertex[i] = dst.vertex[i] * scale
            //         }
            //         const target = new Target()
            //         target.diff(neutral.vertex, dst.vertex)
            //         if (name === "browInnerUp_L") {
            //             dst = new WavefrontObj(`data/blendshapes/ict/browInnerUp_R.obj`)
            //             for (let i = 0; i < neutral.vertex.length; ++i) {
            //                 dst.vertex[i] = dst.vertex[i] * scale
            //             }
            //             target.apply(dst.vertex, 1)
            //             target.diff(neutral.vertex, dst.vertex)
            //         }
            //         if (name === "cheekPuff_L") {
            //             dst = new WavefrontObj(`data/blendshapes/ict/cheekPuff_R.obj`)
            //             for (let i = 0; i < neutral.vertex.length; ++i) {
            //                 dst.vertex[i] = dst.vertex[i] * scale
            //             }
            //             target.apply(dst.vertex, 1)
            //             target.diff(neutral.vertex, dst.vertex)
            //         }
            //         targets[blendshape] = target
            //         weights[blendshape] = 0
            //     }
            // }
        }

        //
        // Mediapipe Landmarks
        //
        /*
        if (neutral === undefined) {
            neutral = new WavefrontObj("data/3dobjs/mediapipe_canonical_face_model.obj")
            //     for (let i = 0; i < neutral.vertex.length; ++i) {
            //         neutral.vertex[i] = neutral.vertex[i] * scale
            //     }
            //     for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
            //         if (blendshape === 0) {
            //             continue
            //         }
            //         const name = blendshapeNames[blendshape]
            //         const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
            //         for (let i = 0; i < neutral.vertex.length; ++i) {
            //             dst.vertex[i] = dst.vertex[i] * scale
            //         }
            //         const target = new Target()
            //         target.diff(neutral.vertex, dst.vertex)
            //         targets[blendshape] = target
            //         weights[blendshape] = 0
            //     }

            // this.mesh = new RenderMesh(gl, neutral.vertex, neutral.fxyz, undefined, undefined, false)
        }
*/
        if (this.mesh !== undefined) {
            if (this.frontend.landmarks !== undefined) {
                // console.log(`update from landmarks ${landmarks[0]}, ${landmarks[1]}, ${landmarks[2]}, ...`)
                // neutral.vertex.set(landmarks)
                this.mesh.update(this.frontend.landmarks)
            }
        } else {
            this.mesh = new RenderMesh(gl, this.neutral.vertex, this.neutral.fxyz, undefined, undefined, false)
        }

        // const vertex = neutral!.vertex
        // const vertex = landmarks !== undefined ? landmarks : neutral.vertex
        // const vertex = new Float32Array(neutral!.vertex.length)
        // vertex.set(neutral!.vertex)
        // for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
        //     if (blendshape === 0) {
        //         continue
        //     }
        //     if (isZero(weights[blendshape])) {
        //         continue
        //     }
        //     targets[blendshape].apply(vertex, weights[blendshape])
        // }
        // if (this.mesh) {
        //     this.mesh.update(vertex)
        // } else {
        //     this.mesh = new RenderMesh(gl, vertex, neutral.fxyz, undefined, undefined, true)
        // }
        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, this.neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}
