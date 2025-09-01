import { mat4 } from "gl-matrix"
import { euler_matrix } from "../lib/euler"
import { Projection } from "../Projection"

const D = 360 / (2.0 * Math.PI)
export function rad2deg(r: number) { return r * D }
export function deg2rad(d: number) { return d / D }

export class Context {
    /**
     * opengl's camera is always at (0, 0, 0) hence the camera matrix
     * moves the world around the camera
     */
    camera: mat4 = mat4.create()

    // rotateX: number = 0
    // rotateY: number = 0
    projection: Projection = Projection.PERSPECTIVE

    /**
     * set new absolute camera rotation in degrees without changing translation
     */
    rotateCameraTo(x: number, y: number, z: number) {
        const justTranslation = mat4.clone(this.camera)
        // just rotation
        justTranslation[12] = justTranslation[13] = justTranslation[14] = 0
        // inverse rotation
        mat4.invert(justTranslation, justTranslation)
        // just translation
        mat4.mul(justTranslation, justTranslation, this.camera)

        const newRotation = euler_matrix(deg2rad(x), deg2rad(y), deg2rad(z))

        this.camera = mat4.mul(newRotation, newRotation, justTranslation)
    }
}
