import { Bone } from "skeleton/Bone"
import { vec3, mat4, quat, quat2 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { PoseUnitsModel } from "../expression/PoseUnitsModel"
import { FileSystemAdapter } from "filesystem/FileSystemAdapter"

interface BodyPoseUnits {
    name: string
    poses: any
}

export class PoseModel extends PoseUnitsModel {

    constructor(skeleton: Skeleton) {
        super()

        const poseUnitNames: string[] = []

        const poseunits: BodyPoseUnits = JSON.parse(FileSystemAdapter.readFile("data/poseunits/body-poseunits.json"))

        // console.log(JSON.stringify(poseunits))
        for (let poseUnitName of Object.getOwnPropertyNames(poseunits.poses)) {
            poseUnitNames.push(poseUnitName)
            // console.log(`${poseUnitName}`)
            const pose = poseunits.poses[poseUnitName]
            for (let boneName of Object.getOwnPropertyNames(pose)) {
                const xyzw: number[] = pose[boneName]
                // the expression code uses dual quaternions (quat = rotation, quat2 = rotation & translation)
                const q = quat.fromValues(xyzw[0], xyzw[1], xyzw[2], xyzw[3])
                const t = vec3.create()
                // TODO: get translation from skeleton
                const q2 = quat2.fromRotationTranslation(quat2.create(), q, t)
                // console.log(`    ${boneName}: ${q2}`)
            }
        }

        // const facePoseUnitsNames = expressionManager.facePoseUnitsNames
        // const skeleton = expressionManager.skeleton
        this.createPoseUnits(poseUnitNames)
        const faceBones = this.getRelevantBones(skeleton)
        this.observeBones(faceBones, skeleton)
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
