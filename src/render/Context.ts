import { mat4, vec3 } from "gl-matrix"
import { Projection } from "render/GLView"

export interface Context {
    /**
     * opengl's camera is always at (0, 0, 0) hence the camera matrix
     * moves the world around the camera
     */
    camera: mat4
    rotateX: number
    rotateY: number
    pos: vec3
    projection: Projection
}
