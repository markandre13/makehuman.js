import { Bone } from "skeleton/Bone"
import { vec3, mat4, quat, quat2 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { PoseUnitsModel } from "../expression/PoseUnitsModel"
import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { NumberRelModel } from "expression/NumberRelModel"

interface BodyPoseUnits {
    name: string
    poses: any
}

export class PoseModel extends PoseUnitsModel {
    base_anim: mat4[] = []

    constructor(skeleton: Skeleton) {
        super()

        const bones = this.getRelevantBones(skeleton)

        const poseUnitNames: string[] = []

        const poseunits: BodyPoseUnits = JSON.parse(FileSystemAdapter.readFile("data/poseunits/body-poseunits.json"))

        // NOTE: see also facePoseUnits.createAnimationTrack(skeleton, "Expression-Face-PoseUnits")
        const identity = mat4.create()
        for (let poseUnitName of Object.getOwnPropertyNames(poseunits.poses)) {
            poseUnitNames.push(poseUnitName)
        }

        // const facePoseUnitsNames = expressionManager.facePoseUnitsNames
        // const skeleton = expressionManager.skeleton
        this.createPoseUnits(poseUnitNames)

        const poseUnitName2Model = new Map<string, NumberRelModel>()
        for(const x of this.poseUnits) {
            poseUnitName2Model.set(x.label!, x)
        }

        for (let poseUnitName of Object.getOwnPropertyNames(poseunits.poses)) {
            const pose = poseunits.poses[poseUnitName]
            const pu = poseUnitName2Model.get(poseUnitName)!
            const frameIndex = this.base_anim.length
            this.base_anim.push(...new Array(skeleton.getBones().length).fill(identity))

            for (const bone of skeleton.getBones()) {
                const xyzw: number[] = pose[bone.name]
                if (xyzw === undefined) {
                    continue
                }
                const q = quat.fromValues(xyzw[0], xyzw[1], xyzw[2], xyzw[3])
                this.base_anim[frameIndex + bone.index] = mat4.fromQuat(mat4.create(), q)

                const node = skeleton.poseNodes.find(bone.name)!
                pu.observe(node.x)
                pu.observe(node.y)
                pu.observe(node.z)
            }
        }

        this.observeBones(bones, skeleton)
        // this.observePoseNodes(expressionManager) // specific
    }

    override getRelevantBones(skeleton: Skeleton): Set<string> {
                // all face expression bones
        // (we have to use all below 'head' as face-poseunits.bvh also affects toes, which is a bug i guess)
        const faceBones = new Set<string>()
        foo(skeleton.bones.get("root")!)
        function foo(bone: Bone) {
            faceBones.add(bone.name)
            if (bone.name === "head") {
                return
            }
            bone.children.forEach((child) => foo(child))
        }
        return faceBones
        // throw new Error("Method not implemented.")
    }
}
