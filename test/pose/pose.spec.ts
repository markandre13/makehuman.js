import { expect, use } from "@esm-bundle/chai"
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { Blaze, BlazePoseLandmarks, BlazePoseConverter }from "../../src/mediapipe/pose/BlazePoseConverter"

const ZERO_DEGREE = 0
const TURN_RIGHT = 2 * Math.PI - Math.PI / 2
const TURN_180 = Math.PI
const TURN_90 = Math.PI / 2

describe("pose", function () {
    const pl2s = new BlazePoseConverter()

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

        pose.rotate(0, Math.PI/2, 0)

        console.log(pl2s.getLeftArmAngle(pose))

        expect(pl2s.getLeftArmAngle(pose)).to.be.almost.equal(TURN_90)
    })

    it("right arm angle 90", function () {
        const pose = new BlazePoseLandmarks()
        pose.setVec(Blaze.RIGHT_SHOULDER, 0, 0, 0)
        pose.setVec(Blaze.RIGHT_ELBOW, 0, 1, 0)
        pose.setVec(Blaze.RIGHT_WRIST, 1, 1, 0)

        pose.rotate(0, Math.PI/2, 0)

        console.log(pl2s.getRightArmAngle(pose))

        expect(pl2s.getLeftArmAngle(pose)).to.be.almost.equal(TURN_90)
    })
})
