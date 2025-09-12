import { deg2rad } from "lib/calculateNormals"
import { BooleanModel } from "toad.js"
import { Blaze } from "./Blaze"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"
import { DrawStack } from "./DrawStack"
import { XYZModel } from "./XYZModel"
import { euler2matrix } from "gl/algorithms/euler"

/**
 * Create BlazePoseLandmarks for testing
 */

export class SimulatedModel {
    pose = new BlazePoseLandmarks();
    simulatedOnOff = new BooleanModel(false, { label: "Simulated Model" });
    root = new XYZModel({ label: "root" });
    shoulder = new XYZModel({ label: "shoulder" });
    leftLeg = new XYZModel({ label: "leftLeg" });
    rightLeg = new XYZModel({ label: "rightLeg" });
    leftKnee = new XYZModel({ label: "leftKnee" });
    rightKnee = new XYZModel({ label: "rightKnee" });
    leftFoot = new XYZModel({ label: "leftFoot" });
    rightFoot = new XYZModel({ label: "rightFoot" });
    all = [
        this.root,
        this.shoulder,
        this.leftLeg,
        this.leftKnee,
        this.leftFoot,
        this.rightLeg,
        this.rightKnee,
        this.rightFoot,
    ];

    pre = new XYZModel({ label: "pre" });
    post = new XYZModel({ label: "post" });

    constructor() {
        this.update = this.update.bind(this)
        for (const model of this.all) {
            model.signal.add(this.update)
        }
        this.update()
    }

    private update() {
        const stack = new DrawStack()
        stack.mul(this.root.toMatrix())

        stack.down(() => {
            stack.translate(0.0, 0.5, 0)
            // stack.set(this.pose, Blaze.LEFT_HIP)
            stack.mul(this.shoulder.toMatrix())
            stack.down(() => {
                stack.translate(0.1, 0.0, 0)
                stack.set(this.pose, Blaze.LEFT_SHOULDER)
            })
            stack.translate(-0.1, 0.0, 0)
            stack.set(this.pose, Blaze.RIGHT_SHOULDER)
        })

        stack.down(() => {
            // from hip
            stack.translate(0.1, 0, 0)
            stack.set(this.pose, Blaze.LEFT_HIP)
            // to knee
            // stack.mul(this.leftLeg.toMatrix())
            const ll = this.leftLeg
            stack.mul(euler2matrix(0, 0, deg2rad(ll.z.value)))
            stack.mul(euler2matrix(deg2rad(ll.x.value), 0, 0))
            stack.mul(euler2matrix(0, deg2rad(ll.y.value), 0))

            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.LEFT_KNEE)
            // to ankle
            stack.mul(this.leftKnee.toMatrix())
            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.LEFT_ANKLE)
            // to foot
            stack.mul(this.leftFoot.toMatrix())
            stack.translate(0, -0.05, 0.025)
            stack.set(this.pose, Blaze.LEFT_HEEL)
            stack.translate(0, 0, -0.15)
            stack.set(this.pose, Blaze.LEFT_FOOT_INDEX)
        })

        stack.down(() => {
            // from hip
            stack.translate(-0.1, 0, 0)
            stack.set(this.pose, Blaze.RIGHT_HIP)
            // to knee
            stack.mul(this.rightLeg.toMatrix())
            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.RIGHT_KNEE)
            // to ankle
            stack.mul(this.rightKnee.toMatrix())
            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.RIGHT_ANKLE)
            // to foot
            stack.mul(this.rightFoot.toMatrix())
            stack.translate(0, -0.05, 0.025)
            stack.set(this.pose, Blaze.RIGHT_HEEL)
            stack.translate(0, 0, -0.15)
            stack.set(this.pose, Blaze.RIGHT_FOOT_INDEX)
        })
    }
}
