import { mat4, vec3, vec4 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { getMatrix } from "skeleton/loadSkeleton"
import { ChordataSettings } from "./ChordataSettings"
import { euler_matrix } from "lib/euler_matrix"

export const D = 180 / Math.PI

export class Joint {
    chordataName: string
    makehumanName: string

    /**
     * pre rotation around y so that the sensor in your hand is aligned with the one on the screen.
     * we calculate this from rotating the sensor forward/backward.
     */
    pre?: mat4
    /**
     * rotation from the chordata motion kceptor
     */
    kceptor?: mat4
    /**
     * post rotatation so that blue is up and red is to the right.
     * we can calculate this from the sensor being in n-pose.
     */
    post?: mat4

    absolute?: mat4
    relative?: mat4

    m0?: mat4
    i0?: mat4

    parent?: Joint
    children?: Joint[]

    // matRestGlobal!: mat4
    // matRestRelative!: mat4
    // length!: number
    // yvector4!: vec4

    // matPoseRelative!: mat4

    // matPoseGlobal!: mat4

    // matNPoseInv?: mat4 // poor man's calibration

    constructor(n: string, name: string, children?: Joint[]) {
        this.chordataName = n
        this.makehumanName = name
        this.children = children
        if (children !== undefined) {
            children.forEach((it) => (it.parent = this))
        }
    }

    forEach(callback: (joint: Joint) => void) {
        callback(this)
        this.children?.forEach((it) => it.forEach(callback))
    }

    getCalibrated(): mat4 {
        let m: mat4 | undefined
        if (this.pre) {
            m = mat4.clone(this.pre)
        }
        if (this.kceptor) {
            if (m === undefined) {
                m = mat4.clone(this.kceptor)
            } else {
                mat4.multiply(m, m, this.kceptor)
            }
        }
        if (this.post) {
            if (m === undefined) {
                m = mat4.clone(this.post)
            } else {
                mat4.multiply(m, m, this.post)
            }
        }
        if (m === undefined) {
            m = mat4.create()
        }
        return m
    }

    update() {
        this.absolute = this.getCalibrated()
        if (this.parent === undefined) {
            this.relative = this.absolute
        } else {
            const m = mat4.invert(mat4.create(), this.parent!.absolute!)
            this.relative = mat4.multiply(m, m, this.absolute)
        }
        this.children?.forEach(it => it.update())
    }

    /*
    // only needed once (similar to the makehuman skeleton/bone)
    build(skeleton: Skeleton) {
        if (this.matRestGlobal !== undefined) {
            return
        }
        //
        // get head and tail
        //
        const b0 = skeleton.getBone(this.makehumanName)
        const head3 = vec3.create()
        vec3.transformMat4(head3, head3, b0.matPoseGlobal!)

        let tail3!: vec3
        if (this.children === undefined) {
            tail3 = vec3.fromValues(b0.yvector4![0], b0.yvector4![1], b0.yvector4![2])
            vec3.scale(tail3, tail3, 4)
            vec3.transformMat4(tail3, tail3, b0.matPoseGlobal!)
        } else {
            const j1 = this.children[0]
            const b1 = skeleton.getBone(j1.makehumanName)
            tail3 = vec3.create()
            vec3.transformMat4(tail3, tail3, b1.matPoseGlobal!)
        }

        //
        // calculate restGlobal and restRelative
        //
        let normal = vec3.fromValues(0, 1, 0)
        this.matRestGlobal = getMatrix(head3, tail3, normal)
        this.length = vec3.distance(head3, tail3)
        if (this.parent === undefined) {
            this.matRestRelative = this.matRestGlobal
        } else {
            this.matRestRelative = mat4.mul(
                mat4.create(),
                mat4.invert(mat4.create(), this.parent.matRestGlobal!),
                this.matRestGlobal
            )
        }
        this.yvector4 = vec4.fromValues(0, this.length, 0, 1)

        if (this.children !== undefined) {
            for (const j1 of this.children) {
                j1.build(skeleton)
            }
        }
    }

    adjustJCS(matPose: mat4) {
        //  if (["r-upperarm", "r-lowerarm", "r-hand"].includes(this.chordataName)) {
        //     mat4.multiply(matPose, euler_matrix(0, 180 / D, 0), matPose)
        // }
        // if (["l-upperarm", "l-lowerarm", "l-hand"].includes(this.chordataName)) {
        //     mat4.multiply(matPose, euler_matrix(0, 180 / D, 0), matPose)
        // }
        // if (["r-upperleg", "r-lowerleg"].includes(this.chordataName)) {
        //     mat4.multiply(matPose, euler_matrix(0, 180 / D, 0), matPose)
        // }
        // if (["l-upperleg", "l-lowerleg"].includes(this.chordataName)) {
        //     mat4.multiply(matPose, euler_matrix(0, 180 / D, 0), matPose)
        // }
        // if (["base"].includes(this.chordataName)) {
        //     mat4.multiply(matPose, euler_matrix(0, 90 / D, 0), matPose)
        // } else {
        //     mat4.multiply(matPose, euler_matrix(0, -90 / D, 0), matPose)
        // }
        // if (["dorsal", "neck"].includes(this.chordataName)) {
        //     mat4.multiply(matPose, euler_matrix(0, 90 / D, 0), matPose)
        // }
    }

    // update matPoseGlobal
    update(settings: ChordataSettings) {
        let matPose = this.getCalibrated()
        this.adjustJCS(matPose)
        // console.log(this.chordataName)
        // if (this.chordataName === "base") {
        //     // console.log("base")
        //     mat4.multiply(
        //         matPose,
        //         euler_matrix(settings.X0.value / D, settings.Y0.value / D, settings.Z0.value / D),
        //         matPose
        //     )
        // }
        // if (this.chordataName === "dorsal") {
        //     mat4.multiply(
        //         matPose,
        //         euler_matrix(settings.X1.value / D, settings.Y1.value / D, settings.Z1.value / D),
        //         matPose
        //     )
        // }

        if (this.matNPoseInv !== undefined) {
            mat4.multiply(matPose, matPose, this.matNPoseInv)
        }

        if (this.parent === undefined) {
            this.matPoseGlobal = mat4.multiply(mat4.create(), this.matRestRelative!, matPose!)
        } else {
            // this.matPoseGlobal = mat4.clone(this.matRestGlobal)
            // mat4.multiply(this.matPoseGlobal, this.matPoseGlobal, matPose)

            // convert matPose from world to local
            const L = mat4.multiply(mat4.create(), this.parent.matRestGlobal, this.matRestRelative)
            L[12] = L[13] = L[14] = 0
            const invL = mat4.invert(mat4.create(), L)
            matPose = mat4.multiply(mat4.create(), L, matPose) // move matPose into L
            mat4.multiply(matPose, matPose, invL) // compensate for local's rotation relative to world

            // * this.parent.matPoseGlobal! ^-1 ???
            // what the easiest way to implement it? then refactor to work with the formula below?

            // calculate matPoseGlobal from matPose
            this.matPoseGlobal = mat4.multiply(
                mat4.create(),
                this.parent.matPoseGlobal!, // place relative to parent's pose
                mat4.multiply(
                    mat4.create(),
                    this.matRestRelative!, // relative to rest pose
                    matPose!
                )
            )

            // compensate for parent pose (saveing'n restoring the translation doesn't seem very clever though...)
            // and actually, i rather need to change poseMat instead the result of the previous calculation because
            // poseMat is the primary source for the pose in makehuman...
            // but for now it's good enough for testing chordata
            const m = mat4.invert(mat4.create(), this.parent.matRestGlobal) // remove parents rest...
            mat4.multiply(m, this.parent.matPoseGlobal, m) // from it's pose rotation
            mat4.invert(m, m)
            // remove parent's pose rotation from matPoseGlobal
            const [x, y, z] = [this.matPoseGlobal[12], this.matPoseGlobal[13], this.matPoseGlobal[14]]
            mat4.multiply(this.matPoseGlobal, m, this.matPoseGlobal)
            ;[this.matPoseGlobal[12], this.matPoseGlobal[13], this.matPoseGlobal[14]] = [x, y, z]
        }

        if (this.children !== undefined) {
            for (const child of this.children) {
                child.update(settings)
            }
        }
    }
    */
}
