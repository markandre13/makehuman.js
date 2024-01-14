import { mat4, vec3 } from "gl-matrix"
import { Joint } from "./Joint"
import { D } from "./renderChordata"

export class Skeleton {
    root: Joint
    protected chordataName2Joint = new Map<string, Joint>();

    constructor() {
        // prettier-ignore
        this.root = new Joint("base", "root", [
            new Joint("dorsal", "spine02", [
                new Joint("neck", "neck02"), // b-bones: spine01, neck01, neck02, neck03, head
                new Joint("l-upperarm", "upperarm01.L", [
                    new Joint("l-lowerarm", "lowerarm01.L", [
                        new Joint("l-hand", "wrist.L")
                    ])
                ]),
                new Joint("r-upperarm", "upperarm01.R", [
                    new Joint("r-lowerarm", "lowerarm01.R", [
                        new Joint("r-hand", "wrist.R")
                    ])
                ])
            ]),
            new Joint("l-upperleg", "upperleg01.L", [
                new Joint("l-lowerleg", "lowerleg01.L", [
                    new Joint("l-foot", "foot.L")
                ])
            ]),
            new Joint("r-upperleg", "upperleg01.R", [
                new Joint("r-lowerleg", "lowerleg01.R", [
                    new Joint("r-foot", "foot.R")
                ])
            ])
        ])

        this.root.forEach(it => {
            this.chordataName2Joint.set(it.chordataName, it)
        })
    }

    setKCeptor(chordataName: string, m: mat4) {
        const joint = this.chordataName2Joint.get(chordataName)
        if (joint === undefined) {
            // throw Error(`no joint named '${chordataName}'`)
            return
        }
        joint.kceptor = m

        if (joint.pre === undefined && joint.post !== undefined) {
            const m1 = mat4.clone(joint.kceptor)
            mat4.multiply(m1, m1, joint.i0!)

            const v0 = vec3.fromValues(0, 1, 0)
            const v1 = vec3.fromValues(0, 1, 0)
            vec3.transformMat4(v1, v1, m1)
            const a = vec3.angle(v0, v1)

            const v = vec3.create()
            vec3.sub(v, v1, v0)
            const x = v[0]
            const y = v[2]
            let rad = Math.atan2(y, x)

            if (a >= 30 / D) {
                const pre = mat4.create()
                mat4.rotateY(pre, pre, rad + Math.PI / 2)
                const post = mat4.multiply(mat4.create(), pre, joint.m0!)
                mat4.invert(post, post)

                joint.pre = pre
                joint.post = post
                joint.m0 = undefined
                joint.i0 = undefined
            }
        }
    }

    getJoint(chordataName: string): Joint {
        const joint = this.chordataName2Joint.get(chordataName)
        if (joint === undefined) {
            throw Error(`no joint named '${chordataName}'`)
        }
        return joint
    }

    startCalibration() {
        this.resetCalibration()
        this.root.forEach(joint => {
            if (joint.kceptor) {
                joint.m0 = mat4.clone(joint.kceptor)
            } else {
                joint.m0 = mat4.create()
            }
            joint.i0 = mat4.invert(mat4.create(), joint.m0)
            joint.post = joint.i0
        })
    }
    resetCalibration() {
        this.root.forEach(joint => {
            joint.pre = undefined
            joint.post = undefined
            joint.m0 = undefined
            joint.i0 = undefined
        })
    }

}
