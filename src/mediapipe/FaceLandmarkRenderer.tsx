import { Application } from "Application"
import { GLView, Projection, RenderHandler } from "GLView"
import { WavefrontObj } from "mesh/WavefrontObj"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { renderFace } from "render/renderFace"
import { Frontend_impl } from "./Frontend_impl"

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
        if (this.frontend.landmarks) {
            renderFace(view.canvas, this.frontend.landmarks, this.neutral.fxyz)
        }
    }
}
