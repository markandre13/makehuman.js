import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { FormButton } from "toad.js/view/FormButton"
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
// import { Target } from "target/Target"
import { renderFace } from "render/renderFace"
import { Action } from "toad.js"
import { Form } from "toad.js/view/Form"

class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager
    expressionModel: ExpressionModel

    backend?: Backend

    // data received from mediapipe
    blendshapeIndex2poseUnit = new Map<number, string>()
    landmarks?: Float32Array
    blendshapes?: Float32Array

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

    constructor(orb: ORB, updateManager: UpdateManager, expressionModel: ExpressionModel) {
        super(orb)
        this.updateManager = updateManager
        this.expressionModel = expressionModel
    }

    async connectToORB(connectToBackend: Action) {
        if (this.backend !== undefined) {
            return
        }

        try {
            const object = await this.orb.stringToObject("corbaname::localhost:9001#Backend")
            this.backend = Backend.narrow(object)
            ORB.installSystemExceptionHandler(this.backend, () => {
                this.backend = undefined
                connectToBackend.error = `lost connection`
                connectToBackend.enabled = true
            })

            this.backend.setFrontend(this)
            connectToBackend.enabled = false
            connectToBackend.error = undefined
            this.backend.setEngine(MotionCaptureEngine.MEDIAPIPE, MotionCaptureType.FACE, EngineStatus.ON)
        } catch (e) {
            connectToBackend.error = `${e}`
        }
    }

    // list of blendshape names that will be send to faceLandmarks()
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
        this.landmarks = landmarks
        this.blendshapes = blendshapes
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

// let orb: ORB | undefined
// let backend: Backend | undefined
// let frontend: Frontend_impl
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
// const targets = new Array<Target>(blendshapeNames.length)
// let weights = new Float32Array(blendshapeNames.length)
// let landmarks: Float32Array | undefined
// let neutral: WavefrontObj | undefined
// // const scale = 80
// const scale = 0.7

// NEXT STEPS:
// [X] for finetuning the animation in realtime, render in the backend
// [ ] google chrome does not detect loosing the connection
// [ ] facial_transformation_matrixes
// [ ] replace enum with object
// [ ] switch between them
// [ ] render side by side
// [ ] render overlay
// [ ] write editor to tweak the blendshapes
// [ ] write an editor to create pose units matching the blendshapes

enum FaceRenderType {
    MP_LANDMARKS,
    ARKIT,
    ICTFACEKIT,
}

/**
 * Render MediaPipe's 3d face landmarks
 */
class FaceLandmarkRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    neutral: WavefrontObj

    constructor(frontend: Frontend_impl) {
        super()
        this.frontend = frontend
        this.neutral = new WavefrontObj("data/3dobjs/mediapipe_canonical_face_model.obj")
    }

    override paint(app: Application, view: GLView): void {
        let a: FaceRenderType = FaceRenderType.MP_LANDMARKS

        if (a === FaceRenderType.MP_LANDMARKS) {
            if (this.frontend.landmarks) {
                renderFace(view.canvas, this.frontend.landmarks, this.neutral.fxyz)
            }
            return
        }

        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        //
        // ARKit
        //

        if (a === FaceRenderType.ARKIT) {
            // if (neutral === undefined) {
            //     neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
            //     for (let i = 0; i < neutral.vertex.length; ++i) {
            //         neutral.vertex[i] = neutral.vertex[i] * scale
            //     }
            //     for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            //         if (blendshape === 0) {
            //             continue
            //         }
            //         const name = blendshapeNames[blendshape]
            //         const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
            //         for (let i = 0; i < neutral.vertex.length; ++i) {
            //             dst.vertex[i] = dst.vertex[i] * scale
            //         }
            //         const target = new Target()
            //         target.diff(neutral.vertex, dst.vertex)
            //         targets[blendshape] = target
            //         weights[blendshape] = 0
            //     }
            //     this.mesh = new RenderMesh(gl, neutral.vertex, neutral.fxyz, undefined, undefined, false)
            // }
        }

        //
        // ICT Facekit
        //

        if (a === FaceRenderType.ICTFACEKIT) {
            // if (neutral === undefined) {
            //     neutral = new WavefrontObj("data/blendshapes/ict/_neutral.obj")
            //     for (let i = 0; i < neutral.vertex.length; ++i) {
            //         neutral.vertex[i] = neutral.vertex[i] * scale
            //     }
            //     for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            //         if (blendshape === 0) {
            //             continue
            //         }
            //         let name = blendshapeNames[blendshape]
            //         switch (name) {
            //             case "browInnerUp":
            //                 name = "browInnerUp_L"
            //                 break
            //             case "cheekPuff":
            //                 name = "cheekPuff_L"
            //                 break
            //         }
            //         let dst = new WavefrontObj(`data/blendshapes/ict/${name}.obj`)
            //         for (let i = 0; i < neutral.vertex.length; ++i) {
            //             dst.vertex[i] = dst.vertex[i] * scale
            //         }
            //         const target = new Target()
            //         target.diff(neutral.vertex, dst.vertex)
            //         if (name === "browInnerUp_L") {
            //             dst = new WavefrontObj(`data/blendshapes/ict/browInnerUp_R.obj`)
            //             for (let i = 0; i < neutral.vertex.length; ++i) {
            //                 dst.vertex[i] = dst.vertex[i] * scale
            //             }
            //             target.apply(dst.vertex, 1)
            //             target.diff(neutral.vertex, dst.vertex)
            //         }
            //         if (name === "cheekPuff_L") {
            //             dst = new WavefrontObj(`data/blendshapes/ict/cheekPuff_R.obj`)
            //             for (let i = 0; i < neutral.vertex.length; ++i) {
            //                 dst.vertex[i] = dst.vertex[i] * scale
            //             }
            //             target.apply(dst.vertex, 1)
            //             target.diff(neutral.vertex, dst.vertex)
            //         }
            //         targets[blendshape] = target
            //         weights[blendshape] = 0
            //     }
            // }
        }

        //
        // Mediapipe Landmarks
        //
        /*
        if (neutral === undefined) {
            neutral = new WavefrontObj("data/3dobjs/mediapipe_canonical_face_model.obj")
            //     for (let i = 0; i < neutral.vertex.length; ++i) {
            //         neutral.vertex[i] = neutral.vertex[i] * scale
            //     }
            //     for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
            //         if (blendshape === 0) {
            //             continue
            //         }
            //         const name = blendshapeNames[blendshape]
            //         const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
            //         for (let i = 0; i < neutral.vertex.length; ++i) {
            //             dst.vertex[i] = dst.vertex[i] * scale
            //         }
            //         const target = new Target()
            //         target.diff(neutral.vertex, dst.vertex)
            //         targets[blendshape] = target
            //         weights[blendshape] = 0
            //     }

            // this.mesh = new RenderMesh(gl, neutral.vertex, neutral.fxyz, undefined, undefined, false)
        }
*/
        if (this.mesh !== undefined) {
            if (this.frontend.landmarks !== undefined) {
                // console.log(`update from landmarks ${landmarks[0]}, ${landmarks[1]}, ${landmarks[2]}, ...`)
                // neutral.vertex.set(landmarks)
                this.mesh.update(this.frontend.landmarks)
            }
        } else {
            this.mesh = new RenderMesh(gl, this.neutral.vertex, this.neutral.fxyz, undefined, undefined, false)
        }

        // const vertex = neutral!.vertex
        // const vertex = landmarks !== undefined ? landmarks : neutral.vertex
        // const vertex = new Float32Array(neutral!.vertex.length)
        // vertex.set(neutral!.vertex)
        // for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
        //     if (blendshape === 0) {
        //         continue
        //     }
        //     if (isZero(weights[blendshape])) {
        //         continue
        //     }
        //     targets[blendshape].apply(vertex, weights[blendshape])
        // }
        // if (this.mesh) {
        //     this.mesh.update(vertex)
        // } else {
        //     this.mesh = new RenderMesh(gl, vertex, neutral.fxyz, undefined, undefined, true)
        // }

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
        gl.drawElements(gl.TRIANGLES, this.neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}

let connectToBackend: Action | undefined
export function MediapipeTab(props: { app: Application }) {
    if (connectToBackend === undefined) {
        const orb = new ORB()
        orb.registerStubClass(Backend)
        orb.addProtocol(new WsProtocol())

        const frontend = new Frontend_impl(orb, props.app.updateManager, props.app.expressionManager.model)

        connectToBackend = new Action(() => frontend.connectToORB(connectToBackend!), {
            label: "Connect to Backend",
        })

        return (
            <Tab
                label="Mediapipe"
                value={TAB.MEDIAPIPE}
                visibilityChange={setRenderer(props.app, new FaceLandmarkRenderer(frontend))}
            >
                <Form>
                    <FormButton action={connectToBackend} />
                </Form>
            </Tab>
        )
    }
}
// let backend: Backend | undefined
// TODO: move this into Frontend_impl ??? well no, the Action is View layer
