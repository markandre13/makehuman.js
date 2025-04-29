import { vec3 } from "gl-matrix"
import { Projection } from "render/GLView"

export interface Context {
    rotateX: number
    rotateY: number
    pos: vec3
    projection: Projection
}
