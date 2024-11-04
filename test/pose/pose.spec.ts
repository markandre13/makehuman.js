import { expect, use } from "chai"
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { Blaze, BlazePoseLandmarks, BlazePoseConverter } from "../../src/mediapipe/pose/BlazePoseConverter"
import { SimulatedModel } from "../../src/mediapipe/pose/PoseTab"
import { deg2rad, rad2deg } from "../../src/lib/calculateNormals"
import { euler_from_matrix, euler_matrix } from "../../src/lib/euler_matrix"
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
    describe("SimulatedModel", function () {
        it("neutral", () => {
            const model = new SimulatedModel()

            // in neutral position, model is pointing towards us
            expect(model.pose.getVec(Blaze.RIGHT_SHOULDER)).to.deep.almost.equal(vec3.fromValues(-0.1, 0.5, 0))
            expect(model.pose.getVec(Blaze.LEFT_SHOULDER)).to.deep.almost.equal(vec3.fromValues(0.1, 0.5, 0))

            expect(model.pose.getVec(Blaze.RIGHT_HIP)).to.deep.almost.equal(vec3.fromValues(-0.1, 0, 0))
            expect(model.pose.getVec(Blaze.LEFT_HIP)).to.deep.almost.equal(vec3.fromValues(0.1, 0, 0))

            expect(model.pose.getVec(Blaze.LEFT_KNEE)).to.deep.almost.equal(vec3.fromValues(0.1, -0.4, 0))
            expect(model.pose.getVec(Blaze.LEFT_HEEL)).to.deep.almost.equal(vec3.fromValues(0.1, -0.85, 0.025))
            expect(model.pose.getVec(Blaze.LEFT_FOOT_INDEX)).to.deep.almost.equal(vec3.fromValues(0.1, -0.85, -0.125))

            expect(model.pose.getVec(Blaze.RIGHT_KNEE)).to.deep.almost.equal(vec3.fromValues(-0.1, -0.4, 0))
            expect(model.pose.getVec(Blaze.RIGHT_HEEL)).to.deep.almost.equal(vec3.fromValues(-0.1, -0.85, 0.025))
            expect(model.pose.getVec(Blaze.RIGHT_FOOT_INDEX)).to.deep.almost.equal(vec3.fromValues(-0.1, -0.85, -0.125))
        })
    })
    describe("BlazePoseConverter", function() {
        it("hip", function() {
            const model = new SimulatedModel()
            const converter = new BlazePoseConverter()

            let m = converter.getHip(model.pose)
            const expectedHip = mat4.create()
            expect(m).to.deep.almost.equal(expectedHip)

            model.root.z.value = 5
            m = converter.getHip(model.pose)
            mat4.rotateZ(expectedHip, expectedHip, deg2rad(5))
            // console.log(JSON.stringify(euler_from_matrix(m)))
            expect(m).to.deep.almost.equal(expectedHip)

            model.root.y.value = 15
            m = converter.getHip(model.pose)
            mat4.rotateY(expectedHip, expectedHip, deg2rad(15))
            // console.log(JSON.stringify(euler_from_matrix(m)))
            expect(m).to.deep.almost.equal(expectedHip)

            model.root.x.value = 25
            m = converter.getHip(model.pose)
            mat4.rotateX(expectedHip, expectedHip, deg2rad(25))
            expect(m).to.deep.almost.equal(expectedHip)
            // console.log(JSON.stringify(euler_from_matrix(m)))
        })
    })
})
