import { mat4, vec3, vec4 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { getMatrix } from "skeleton/loadSkeleton"
import { bones } from "./renderChordata"

export class Joint {
    chordataName: string
    makehumanName: string

    parent?: Joint
    children?: Joint[]

    matRestGlobal!: mat4
    matRestRelative!: mat4
    length!: number
    yvector4!: vec4

    matPoseRelative!: mat4

    matPoseGlobal!: mat4

    matNPoseInv!: mat4 // poor man's calibration

    constructor(n: string, name: string, children?: Joint[]) {
        this.chordataName = n
        this.makehumanName = name
        this.children = children
        if (children !== undefined) {
            children.forEach(it => it.parent = this)
        }
    }

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

    // update matPoseGlobal
    update() {
        let matPose = bones.get(this.chordataName)
        if (matPose === undefined) {
            matPose = mat4.create()
        }

        if (this.parent === undefined) {
            this.matPoseGlobal = mat4.multiply(mat4.create(), this.matRestRelative!, matPose!)     
        } else {
            // convert matPose from world to local
            const L = mat4.multiply(mat4.create(), this.parent.matRestGlobal, this.matRestRelative)
            L[12] = L[13] = L[14] = 0
            const invL = mat4.invert(mat4.create(), L)
            matPose = mat4.multiply(mat4.create(), L, matPose) // move matPose into L
            mat4.multiply(matPose, matPose, invL) // compensate for local's rotation relative to world

            // mpg := pmpg * ( mrr * mp )
            this.matPoseGlobal = mat4.multiply(
                mat4.create(),
                this.parent.matPoseGlobal!,
                mat4.multiply(mat4.create(), this.matRestRelative!, matPose!)
            )

            // compensate for parent pose (saveing'n restoring the translation doesn't seem very clever though...)
            // and actually, i rather need to change poseMat instead the result of the previous calculation because
            // poseMat is the primary source for the pose in makehuman...
            const m = mat4.invert(mat4.create(), this.parent.matRestGlobal) // remove parents rest...
            mat4.multiply(m, this.parent.matPoseGlobal, m) // from it's rotation
            mat4.invert(m, m)
            const [x,y,z] = [this.matPoseGlobal[12], this.matPoseGlobal[13], this.matPoseGlobal[14]]
            mat4.multiply(this.matPoseGlobal, m, this.matPoseGlobal);
            [this.matPoseGlobal[12], this.matPoseGlobal[13], this.matPoseGlobal[14]] = [x,y,z]
        }

        if (this.children !== undefined) {
            for (const child of this.children) {
                child.update()
            }
        }
    }
}
