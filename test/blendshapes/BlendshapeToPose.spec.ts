import { expect, use } from "@esm-bundle/chai"
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { BlendshapePose, BlendshapeToPoseConfig } from "../../src/blendshapes/BlendshapeToPoseConfig"
import { Bone } from "../../src/skeleton/Bone"
import { quat2 } from "gl-matrix"

describe("blendshape", function () {
    it("BlendshapeToPose.toJSON()", function () {
         const pose = new BlendshapePose()
        pose.poseUnitWeight.set("pu", 0.4)
        pose.boneTransform.set({name: "bt"} as any, quat2.create())

        const cfg = new BlendshapeToPoseConfig()
        cfg.set("bs", pose)

        console.log(JSON.stringify(cfg))
        expect(cfg.toJSON()).to.deep.equal({"bs":{"poseUnitWeight":{"pu":0.4},"boneTransform":{"bt":[0,0,0,1,0,0,0,0]}}})
    })
    it("BlendshapeToPose.fromJSON(skeleton, data)", function () {
        const str = `{"bs":{"poseUnitWeight":{"pu":0.4},"boneTransform":{"bt":[0,0,0,1,0,0,0,0]}}}`
        
        const b = {name: "bt"} as Bone
        const s = {
            getBone(name: string) {
                return name == b.name ? b : undefined
            } 
        } as any

        const obj = BlendshapeToPoseConfig.fromJSON(s, JSON.parse(str))
        const pose = obj.get("bs")
        expect(pose).not.to.be.undefined
        const weight = pose?.poseUnitWeight.get("pu")
        expect(weight).to.equal(0.4)
        const q = pose?.boneTransform.get(b) // while using Bone is/might be nice performance wise, it's a pain in the code
        expect(q).to.not.be.undefined
        quat2.equals(q!, quat2.create())
    })
})
