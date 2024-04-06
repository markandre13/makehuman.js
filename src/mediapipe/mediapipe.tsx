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

let orb: ORB | undefined
let backend: Backend
let frontend: Frontend_impl

let neutral: WavefrontObj | undefined
let jawOpen: WavefrontObj | undefined

let model = new NumberModel(0, { min: 0, max: 1, step: 0.01 })

class FaceRenderer extends RenderHandler {
    mesh!: RenderMesh
    target!: Target

    override paint(app: Application, view: GLView): void {
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        if (neutral === undefined) {
            neutral = new WavefrontObj("data/blendshapes/Neutral.obj")
            jawOpen = new WavefrontObj("data/blendshapes/jawOpen.obj")
            for (let i = 0; i < neutral.vertex.length; ++i) {
                neutral.vertex[i] = neutral.vertex[i] * 80
                jawOpen.vertex[i] = jawOpen.vertex[i] * 80
            }
            this.target = new Target()
            this.target.diff(neutral.vertex, jawOpen.vertex)
            this.mesh = new RenderMesh(gl, neutral.vertex, neutral.fxyz, undefined, undefined, false)
            console.log(`face blendshapes: ${neutral.vertex.length / 3}, ${this.target.data.length}`)
            model.modified.add( () => {
                requestAnimationFrame(() => {
                    const vertex = new Float32Array(neutral!.vertex)
                    this.target.apply(vertex, model.value)
                    this.mesh.update(vertex)
                    this.paint(app, view)
                })
            })
        }

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
            <Slider model={model} />
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
        console.log(`rcvd  : latency ${Date.now() - Number(timestamp_ms)}ms`)
        this.updateManager.mediapipe(landmarks, timestamp_ms)
        this.blendshapeIndex2poseUnit.forEach((name, index) => {
            if (index < blendshapes.length) {
                this.expressionModel.setPoseUnit(name, blendshapes[index])
            }
        })
    }
    override async hello(): Promise<void> {
        console.log("HELLO FROM THE SERVER")
    }
}
