import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { Button, NumberModel, Slider } from "toad.js"
import { Tab } from "toad.js/view/Tab"
import { EngineStatus, MotionCaptureEngine, MotionCaptureType } from "net/makehuman"
import { UpdateManager } from "UpdateManager"
import { ExpressionModel } from "expression/ExpressionModel"
import { Application, setRenderer } from "Application"
import { GLView, Projection, RenderHandler } from "GLView"
import { WavefrontObj } from "mesh/WavefrontObj"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { Target } from "target/Target"
import { isZero } from "mesh/HumanMesh"

let orb: ORB | undefined
let backend: Backend
let frontend: Frontend_impl

const blendshapeNames = [
    "_neutral", // 0
    "browDownLeft", // 1
    "browDownRight", // 2
    "browInnerUp", // 3
    "browOuterUpLeft", // 4
    "browOuterUpRight", // 5
    "cheekPuff", // 6
    "cheekSquintLeft", // 7
    "cheekSquintRight", // 8
    "eyeBlinkLeft", // 9
    "eyeBlinkRight", // 10
    "eyeLookDownLeft", // 11
    "eyeLookDownRight", // 12
    "eyeLookInLeft", // 13
    "eyeLookInRight", // 14
    "eyeLookOutLeft", // 15
    "eyeLookOutRight", // 16
    "eyeLookUpLeft", // 17
    "eyeLookUpRight", // 18
    "eyeSquintLeft", // 19
    "eyeSquintRight", // 20
    "eyeWideLeft", // 21
    "eyeWideRight", // 22
    "jawForward", // 23
    "jawLeft", // 24
    "jawOpen", // 25
    "jawRight", // 26
    "mouthClose", // 27
    "mouthDimpleLeft", // 28
    "mouthDimpleRight", // 29
    "mouthFrownLeft", // 30
    "mouthFrownRight", // 31
    "mouthFunnel", // 32
    "mouthLeft", // 33
    "mouthLowerDownLeft", // 34
    "mouthLowerDownRight", // 35
    "mouthPressLeft", // 36
    "mouthPressRight", // 37
    "mouthPucker", // 38
    "mouthRight", // 39
    "mouthRollLower", // 40
    "mouthRollUpper", // 41
    "mouthShrugLower", // 42
    "mouthShrugUpper", // 43
    "mouthSmileLeft", // 44
    "mouthSmileRight", // 45
    "mouthStretchLeft", // 46
    "mouthStretchRight", // 47
    "mouthUpperUpLeft", // 48
    "mouthUpperUpRight", // 49
    "noseSneerLeft", // 50
    "noseSneerRight", // 51
]
const targets = new Array<Target>(blendshapeNames.length)
let weights = new Float32Array(blendshapeNames.length)
let neutral: WavefrontObj | undefined
const scale = 80

class FaceRenderer extends RenderHandler {
    mesh!: RenderMesh

    override paint(app: Application, view: GLView): void {
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        if (neutral === undefined) {
            neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
            for (let i = 0; i < neutral.vertex.length; ++i) {
                neutral.vertex[i] = neutral.vertex[i] * scale
            }
            for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
                if (blendshape === 0) {
                    continue
                }
                const name = blendshapeNames[blendshape]
                const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
                for (let i = 0; i < neutral.vertex.length; ++i) {
                    dst.vertex[i] = dst.vertex[i] * scale
                }
                const target = new Target()
                target.diff(neutral.vertex, dst.vertex)
                targets[blendshape] = target
                weights[blendshape] = 0
            }

            this.mesh = new RenderMesh(gl, neutral.vertex, neutral.fxyz, undefined, undefined, false)
        }

        const vertex = new Float32Array(neutral!.vertex)
        for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            if (isZero(weights[blendshape])) {
                continue
            }
            targets[blendshape].apply(vertex, weights[blendshape])
        }
        this.mesh.update(vertex)

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1.0, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}

export function MediapipeTab(props: { app: Application }) {
    return (
        <Tab label="Mediapipe" value={TAB.MEDIAPIPE} visibilityChange={setRenderer(props.app, new FaceRenderer())}>
            <Button action={() => callORB(props.app.updateManager, props.app.expressionManager.model)}>
                The Orb of Osuvox
            </Button>
        </Tab>
    )
}

async function callORB(updateManager: UpdateManager, expressionModel: ExpressionModel) {
    if (orb === undefined) {
        orb = new ORB()
        orb.registerStubClass(Backend)
        orb.addProtocol(new WsProtocol())
    }
    if (backend == null) {
        backend = Backend.narrow(await orb.stringToObject("corbaname::localhost:9001#Backend"))
        frontend = new Frontend_impl(orb, updateManager, expressionModel)
        backend.setFrontend(frontend)
    }
    backend.setEngine(MotionCaptureEngine.MEDIAPIPE, MotionCaptureType.FACE, EngineStatus.ON)
}

class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager
    expressionModel: ExpressionModel

    // map some Google Mediapipe/Apple ARKit face blendshape names to Makehuman Face Poseunit names
    // ideally, we would need new poseunits matching the blendshapes
    // TODO:
    // [ ] render the real blendshapes
    //   [ ] render the mediapipe mesh
    //   [ ] create morphtargets for the mediapipe blendshapes
    //   [ ] apply the morphtargets using the mediapipe blendshape coefficnets
    // [ ] create a tool to create custom poseunits (with the blendshapes we try
    //     to approximate also shown)
    // [ ] create a tool to manage custom pose unit sets
    blendshape2poseUnit = new Map<string, string>([
        ["jawOpen", "JawDrop"],
        ["jawForward", "ChinForward"],
        ["mouthSmileRight", "MouthRightPullUp"],
        ["mouthSmileLeft", "MouthLeftPullUp"],
        ["mouthStrechLeft", "MouthLeftPlatysma"],
        ["mouthRightLeft", "MouthRightPlatysma"],
        ["eyeWideRight", "RightUpperLidOpen"],
        ["eyeWideLeft", "LeftUpperLidOpen"],
        ["eyeBlinkLeft", "LeftUpperLidClosed"],
        ["eyeBlinkRight", "RightUpperLidClosed"],
        ["mouthPucker", "LipsKiss"],
        ["jawLeft", "ChinLeft"],
        ["jawRight", "ChinRight"],
        ["browInnerUp", "LeftInnerBrowUp"],
        ["browInnerUp", "RightInnerBrowUp"],
        ["browOuterUpLeft", "LeftOuterBrowUp"],
        ["browOuterUpRight", "RightOuterBrowUp"],
        ["browDownLeft", "LeftBrowDown"],
        ["browDownRight", "RightBrowDown"],
    ])
    blendshapeIndex2poseUnit = new Map<number, string>()
    constructor(orb: ORB, updateManager: UpdateManager, expressionModel: ExpressionModel) {
        super(orb)
        this.updateManager = updateManager
        this.expressionModel = expressionModel
    }
    override faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        this.blendshapeIndex2poseUnit.clear()
        faceBlendshapeNames.forEach((name, index) => {
            const poseUnitName = this.blendshape2poseUnit.get(name)
            if (poseUnitName) {
                this.blendshapeIndex2poseUnit.set(index, poseUnitName)
            }
        })
    }
    override faceLandmarks(landmarks: Float32Array, blendshapes: Float32Array, timestamp_ms: bigint): void {
        // console.log(`rcvd  : latency ${Date.now() - Number(timestamp_ms)}ms`)
        weights = new Float32Array(blendshapes)
        this.updateManager.invalidateView()
        
        // this.updateManager.mediapipe(landmarks, timestamp_ms)
        // this.blendshapeIndex2poseUnit.forEach((name, index) => {
        //     if (index < blendshapes.length) {
        //         this.expressionModel.setPoseUnit(name, blendshapes[index])
        //     }
        // })
    }
    override async hello(): Promise<void> {
        console.log("HELLO FROM THE SERVER")
    }
}
