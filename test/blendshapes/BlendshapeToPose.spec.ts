import { expect, use } from "chai"
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { BlendshapePose, BlendshapeToPoseConfig } from "../../src/blendshapes/BlendshapeToPoseConfig"
import { Bone } from "../../src/skeleton/Bone"
import { quat2 } from "gl-matrix"

describe("blendshape", function () {
    it("BlendshapeToPoseConfig.toJSON()", function () {
         const pose = new BlendshapePose()
        pose.poseUnitWeight.set("LeftBrowDown", 0.4)
        pose.boneTransform.set({name: "dummyBone"} as any, quat2.create())

        const cfg = new BlendshapeToPoseConfig()
        cfg.set("browDownLeft", pose)

        expect(JSON.stringify(cfg)).to.equal(`{"browDownLeft":{"poseUnitWeight":{"LeftBrowDown":0.4},"boneTransform":{"dummyBone":[0,0,0,1,0,0,0,0]}}}`)
    })
    it("BlendshapeToPoseConfig.fromJSON(skeleton, data)", function () {
        const jsonString = `{"browDownLeft":{"poseUnitWeight":{"LeftBrowDown":0.4},"boneTransform":{"dummyBone":[0,0,0,1,0,0,0,0]}}}`
        
        const dummyBone = {name: "dummyBone"} as Bone
        const dummySkeleton = {
            getBone(name: string) {
                return name == dummyBone.name ? dummyBone : undefined
            } 
        } as any

        const cfg = BlendshapeToPoseConfig.fromJSON(dummySkeleton, jsonString)
        const pose = cfg.get("browDownLeft")
        expect(pose).not.to.be.undefined
        const weight = pose?.poseUnitWeight.get("LeftBrowDown")
        expect(weight).to.equal(0.4)
        const q = pose?.boneTransform.get(dummyBone) // while using Bone is/might be nice performance wise, it's a pain in the code
        expect(q).to.not.be.undefined
        expect(quat2.equals(q!, quat2.create())).to.be.true
    })
})
