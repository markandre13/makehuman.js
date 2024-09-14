import { expect, use } from "@esm-bundle/chai"
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { Blaze, BlazePoseLandmarks, BlazePoseConverter } from "../../src/mediapipe/pose/BlazePoseConverter"
import { rad2deg } from "../../src/lib/calculateNormals"
import { mat4, vec3 } from "gl-matrix"

const ZERO_DEGREE = 0
const TURN_RIGHT = 2 * Math.PI - Math.PI / 2
const TURN_180 = Math.PI
const TURN_90 = Math.PI / 2



//   Y
//   ^
//   |
//   |
//   +------> X

describe("pose", function () {
    const pl2s = new BlazePoseConverter()

    it("root neutral", () => {
        const pose = new BlazePoseLandmarks()

        // actual coordinates from mediapipe while standing and facing camera
        pose.setVec(Blaze.LEFT_SHOULDER, 0.16530875861644745,0.5009817481040955,-0.1555437296628952)
        pose.setVec(Blaze.RIGHT_SHOULDER, -0.1676178127527237,0.5033537745475769,-0.1604379564523697)
        pose.setVec(Blaze.LEFT_HIP, 0.11296521872282028, 0.0007231105118989944, -0.0076035400852561)
        pose.setVec(Blaze.RIGHT_HIP, -0.11338525265455246, -0.0003723553672898561, 0.008428504690527916)
        pose.setVec(Blaze.LEFT_KNEE, 0.1755087971687317,-0.4113808572292328,-0.006952519994229078)
        pose.setVec(Blaze.RIGHT_KNEE, -0.09461788088083267,-0.3937787711620331,0.05729012191295624)

        // get rotation around y-axis
        const d0 = pl2s.getRootY(pose)
        expect(rad2deg(d0)).to.almost.equal(-4.0514031908497845)

        // pose with removed rotation
        const pose2 = pose.clone()
        pose2.rotate(0, d0, 0)

        const d1 = pl2s.getRootY(pose2)
        expect(rad2deg(d1)).to.almost.equal(0)

        const leftShoulder = pose2.getVec(Blaze.LEFT_SHOULDER)
        const rightShoulder = pose2.getVec(Blaze.RIGHT_SHOULDER)
        const leftHip = pose2.getVec(Blaze.LEFT_HIP)
        const rightHip = pose2.getVec(Blaze.RIGHT_HIP)
        const leftKnee = pose2.getVec(Blaze.LEFT_KNEE)
        const rightKnee = pose2.getVec(Blaze.RIGHT_KNEE)

        const dir = vec3.create()
        vec3.sub(dir, rightShoulder, rightHip) // hip --> shoulder
        vec3.normalize(dir, dir)
        // const dir = vec3.fromValues(0,1,0)
        const xaxis = Math.atan2(dir[1], -dir[2]) - Math.PI / 2

        console.log(rad2deg(xaxis))
    })

    /*
    xdescribe("old", () => {
        //right   left
        //   |     |
        //   24---23
        //   |     |
        //   26   25
        //   |     |
        //   28   27
        it("root neutral", function () {
            const pose = new BlazePoseLandmarks()
            pose.setVec(Blaze.RIGHT_HIP, -0.5, 0, 0)
            pose.setVec(Blaze.LEFT_HIP, 0.5, 0, 0)

            expect(pl2s.getRootY(pose)).to.equal(ZERO_DEGREE)
        })

        it("root 90d right", function () {
            const pose = new BlazePoseLandmarks()
            pose.setVec(Blaze.RIGHT_HIP, 0, -0.5, 0)
            pose.setVec(Blaze.LEFT_HIP, 0, 0.5, 0)

            expect(2 * Math.PI - pl2s.getRootY(pose)).to.equal(Math.PI / 2)
            expect(pl2s.getRootY(pose)).to.equal(TURN_RIGHT)
        })

        it("left arm angle 180", function () {
            const pose = new BlazePoseLandmarks()
            pose.setVec(Blaze.LEFT_SHOULDER, 0, 0, 0)
            pose.setVec(Blaze.LEFT_ELBOW, 0, 1, 0)
            pose.setVec(Blaze.LEFT_WRIST, 0, 2, 0)

            pose.rotate(0.1, 0.2, 0.3)

            console.log(pl2s.getLeftArmAngle(pose))

            expect(pl2s.getLeftArmAngle(pose)).to.be.almost.equal(TURN_180)
        })

        it("left arm angle 90", function () {
            const pose = new BlazePoseLandmarks()
            pose.setVec(Blaze.LEFT_SHOULDER, 0, 0, 0)
            pose.setVec(Blaze.LEFT_ELBOW, 0, 1, 0)
            pose.setVec(Blaze.LEFT_WRIST, -1, 1, 0)

            pose.rotate(0, Math.PI / 2, 0)

            console.log(pl2s.getLeftArmAngle(pose))

            expect(pl2s.getLeftArmAngle(pose)).to.be.almost.equal(TURN_90)
        })

        it("right arm angle 90", function () {
            const pose = new BlazePoseLandmarks()
            pose.setVec(Blaze.RIGHT_SHOULDER, 0, 0, 0)
            pose.setVec(Blaze.RIGHT_ELBOW, 0, 1, 0)
            pose.setVec(Blaze.RIGHT_WRIST, 1, 1, 0)

            pose.rotate(0, Math.PI / 2, 0)

            console.log(pl2s.getRightArmAngle(pose))

            expect(pl2s.getLeftArmAngle(pose)).to.be.almost.equal(TURN_90)
        })
    })
*/
})
