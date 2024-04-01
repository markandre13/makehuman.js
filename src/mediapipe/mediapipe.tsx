import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { Button } from "toad.js"
import { Tab } from "toad.js/view/Tab"
import { EngineStatus, MotionCaptureEngine, MotionCaptureType } from "net/makehuman"
import { renderFace } from "render/renderFace"
import { UpdateManager } from "UpdateManager"

// step 1: switch mediapipe on
// step 2: switch mediapipe off

let orb: ORB | undefined
let backend: Backend
let frontend: Frontend_impl

export function MediapipeTab(props: {updateManager: UpdateManager}) {
    return (
        <Tab label="Mediapipe" value={TAB.MEDIAPIPE}>
            <Button action={() => callORB(props.updateManager)}>The Orb of Osuvox</Button>
        </Tab>
    )
}

async function callORB(updateManager: UpdateManager) {
    if (orb === undefined) {
        orb = new ORB()
        orb.registerStubClass(Backend)
        orb.addProtocol(new WsProtocol())
    }
    if (backend == null) {
        backend = Backend.narrow(await orb.stringToObject("corbaname::localhost:9001#Backend"))
        frontend = new Frontend_impl(orb, updateManager)
        backend.setFrontend(frontend)
    }
    backend.setEngine(MotionCaptureEngine.MEDIAPIPE, MotionCaptureType.FACE, EngineStatus.ON);
}


// hello(): Promise<void>
// faceBlendshapeNames(faceBlendshapeNames: Array<string>): void
// faceLandmarks(landmarks: Float32Array, blendshapes: Float32Array): void

class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager
    constructor(orb: ORB, updateManager: UpdateManager) {
        super(orb)
        this.updateManager = updateManager
    }

    override faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
    }
    override faceLandmarks(landmarks: Float32Array, blendshapes: Float32Array): void {
        this.updateManager.mediapipe(landmarks)
    }
    override async hello(): Promise<void> {
        console.log("HELLO FROM THE SERVER")
    }
}

// MEDIAPIPE INTEGRATION PLAYGROUND
// [X] assuming that we receive the vertices, render the face
// [ ] have a look at http://www.makehumancommunity.org/wiki/Documentation:Basemesh
//     and provide some controls to manually animate the face
//     (maybe even save the pose in case we have some good ones)
//     MH provides some additional level of abstraction:
//         data/poseunits/face-poseunits.bvh with 60 frames
//         data/poseunits/face-poseunits.json with names for each frame
//         data/expressions/*.pose with percentage for each poseunit
//     expressions are most expressive on old people with teeth, hair and eye brows
//     [X] load bvh
//     [X] load poseunits
//     [X] load expression
//     [X] add face page showing face, list of expression and list of poseunits
//     [X] apply expression
//     [ ] export expression as animation in collada file
//     [ ] animate between expressions?
//         http://www.makehumancommunity.org/wiki/Documentation:Basemesh
//         dark helper bones: no deformation (of the skin), used to guide other bones
// [ ] it seems we get normalized face landmarks, try to get the non-normalized ones
//     coordinates are tripes with z == 0, is there 3d data somewhere available inside?
// [ ] render makehuman head besides mediapipe head
// [ ] try to animate the makehuman head from the mediapipe head
//     (assume that the camera is mounted to the head)
// [ ] to adjust to different people, we might need an initialisation step
// [ ] have a look at shape keys
//     http://www.makehumancommunity.org/wiki/Documentation:Corrective_shape_keys
// [ ] add ability to reconnect (client & server)
// [X] put server side ws code into a separate thread to improve performance
// [ ] record to file
// [ ] read file (either with frames dropped or precise)
// [ ] try opencv motion tracking to track optional markers painted
//     on the real face
// export function runMediaPipe() {
//     const refCanvas = new (class {
//         canvas!: HTMLCanvasElement
//     })()
//     document.body.replaceChildren(
//         ...(
//             <>
//                 <canvas
//                     set={ref(refCanvas, "canvas")}
//                     style={{ width: "480px", height: "480px", border: "1px #fff solid" }}
//                 />
//             </>
//         )
//     )
//     // const obj = new WavefrontObj('data/canonical_face_model.obj') // uh! not quads

//     const enc = new TextEncoder()
//     const host = "localhost"
//     const port = 9001
//     const socket = new WebSocket(`ws://${host}:${port}`)
//     socket.binaryType = "arraybuffer"
//     socket.onopen = () => {
//         console.log(`web socket is open`)
//         socket.onmessage = async (msg: MessageEvent) => {
//             let arrayBuffer: ArrayBuffer
//             if (msg.data instanceof Blob) {
//                 arrayBuffer = await msg.data.arrayBuffer()
//             } else if (msg.data instanceof ArrayBuffer) {
//                 arrayBuffer = msg.data
//             } else {
//                 console.log("neither blob nor arraybuffer")
//                 return
//             }
//             renderFace(refCanvas.canvas, arrayBuffer)
//             socket.send(enc.encode("GET FACE"))
//         }
//         socket.send(enc.encode("GET FACE"))
//     }
// }
