import { mat4, vec3 } from "gl-matrix"
import { Joint } from "./Joint"
import { D } from "./renderChordata"

export class ChordataSkeleton {
    root: Joint
    protected chordataName2Joint = new Map<string, Joint>()
    protected makehumanName2Joint = new Map<string, Joint>()

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
            this.makehumanName2Joint.set(it.makehumanName, it)
        })

        this.loadCalibration()
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

                if (this.isCalibrated()) {
                    this.saveCalibration()
                }
            }
        }
    }

    update() {
        this.root.update()
    }

    isCalibrated(): boolean {
        for(const [_, joint] of this.chordataName2Joint) {
            if (joint.pre === undefined) {
                return false
            }
        }
        return true
    }

    saveCalibration() {
        console.log(`saveCalibration()`)
        const data: any = {}
        for(const [name, joint] of this.chordataName2Joint) {
            if (joint.pre === undefined || joint.post === undefined) {
                return
            }
            const pre = Array.from(joint.pre)
            const post = Array.from(joint.post)
            data[name] = { pre, post}
        }
        const json = JSON.stringify(data)
        localStorage.setItem("calibration", json)
    }

    loadCalibration() {
        const json = localStorage.getItem("calibration")
        if (json === null) {
            console.log(`loadCalibration(): no calibration`)
            return
        }
        console.log(`loadCalibration(): found calibration`)
        const data = JSON.parse(json)
        console.log(data)
        for(const [name, joint] of this.chordataName2Joint) {
            const pre = data[name].pre as number[]
            // prettier-ignore
            joint.pre = mat4.fromValues(pre[0],pre[1],pre[2],pre[3],pre[4],pre[5],pre[6],pre[7],pre[8],pre[9],pre[10],pre[11],pre[12],pre[13],pre[14],pre[15])

            const post = data[name].post as number[]
            // prettier-ignore
            joint.post = mat4.fromValues(post[0],post[1],post[2],post[3],post[4],post[5],post[6],post[7],post[8],post[9],post[10],post[11],post[12],post[13],post[14],post[15])
        }
    }

    getJoint(chordataName: string): Joint {
        const joint = this.chordataName2Joint.get(chordataName)
        if (joint === undefined) {
            throw Error(`no joint named '${chordataName}'`)
        }
        return joint
    }

    getMHJoint(chordataName: string): Joint | undefined {
        return this.makehumanName2Joint.get(chordataName)
    }

    startCalibration() {
        this.resetCalibration()
        this.root.forEach(joint => {
            if (joint.kceptor) {
                joint.m0 = mat4.clone(joint.kceptor)
            } else {
                joint.m0 = mat4.create()
            }
            joint.i0 = mat4.invert(mat4.create(), joint.m0)!
            joint.post = joint.i0
        })
    }
    resetCalibration() {
        localStorage.removeItem("calibration")
        this.root.forEach(joint => {
            joint.pre = undefined
            joint.post = undefined
            joint.m0 = undefined
            joint.i0 = undefined
        })
    }

}
