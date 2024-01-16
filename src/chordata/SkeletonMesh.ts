import { mat4, vec3 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { Joint } from "./Joint"

export class SkeletonMesh {
    skeleton: Skeleton
    constructor(skeleton: Skeleton, joint: Joint) {
        this.skeleton = skeleton
        this.addJoint(joint)
    }

    vertex: number[] = [];
    indices: number[] = [];

    addVec(j: vec3) {
        this.vertex.push(...j)
        this.indices.push(this.indices.length)
    }

    addBone(m: mat4, p: vec3) {
        const head = vec3.create()
        const tail = vec3.copy(vec3.create(), p)
        const center = vec3.scale(vec3.create(), tail, 0.2)

        const r = 0.3 // distance from center

        const a = center[0]
        const b = center[1]
        const c = center[2]
        const q0 = vec3.fromValues(b + c, c - a, -a - b)
        vec3.normalize(q0, q0)
        vec3.scale(q0, q0, r)
        const d0 = vec3.add(vec3.create(), center, q0)

        const q1 = vec3.cross(vec3.create(), center, q0)
        vec3.normalize(q1, q1)
        vec3.scale(q1, q1, r)
        const d1 = vec3.add(vec3.create(), q1, center)

        const q2 = vec3.scale(vec3.create(), q0, -1)
        const d2 = vec3.add(vec3.create(), q2, center)

        const q3 = vec3.scale(vec3.create(), q1, -1)
        const d3 = vec3.add(vec3.create(), q3, center)

        vec3.transformMat4(head, head, m)
        vec3.transformMat4(tail, tail, m)
        vec3.transformMat4(d0, d0, m)
        vec3.transformMat4(d1, d1, m)
        vec3.transformMat4(d2, d2, m)
        vec3.transformMat4(d3, d3, m)

        this.addVec(head)
        this.addVec(d0)
        this.addVec(d1)

        this.addVec(head)
        this.addVec(d1)
        this.addVec(d2)

        this.addVec(head)
        this.addVec(d2)
        this.addVec(d3)

        this.addVec(head)
        this.addVec(d3)
        this.addVec(d0)

        this.addVec(d0)
        this.addVec(d1)
        this.addVec(tail)

        this.addVec(d1)
        this.addVec(d2)
        this.addVec(tail)

        this.addVec(d2)
        this.addVec(d3)
        this.addVec(tail)

        this.addVec(d3)
        this.addVec(d0)
        this.addVec(tail)
    }

    addJoint(j0: Joint) {
        // this.addBone(j0.matPoseGlobal, j0.yvector4! as vec3)
        // if (j0.children !== undefined) {
        //     for (const j1 of j0.children) {
        //         this.addJoint(j1)
        //     }
        // }
    }
}
