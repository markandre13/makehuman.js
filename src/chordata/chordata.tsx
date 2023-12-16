import { TAB } from "HistoryManager"
import { COOPDecoder } from "chordata/COOPDecoder"
import { calibrateNPose, setBones } from "chordata/renderChordata"
import { Action } from "toad.js"
import { Button, ButtonVariant } from "toad.js/view/Button"
import { Tab } from "toad.js/view/Tab"
import { hexdump } from "../lib/hexdump"
import { UpdateManager } from "UpdateManager"
import { Form } from "toad.js/view/Form"
import { FormText } from "toad.js/view/FormText"
import { ChordataSettings } from "./ChordataSettings"

let socket: WebSocket | undefined
let mgr: UpdateManager

const start = new Action(() => {
    console.log("START")
    start.enabled = false
    stop.enabled = true
    socket = runChordata(mgr)
})
const stop = new Action(() => {
    console.log("STOP")
    start.enabled = true
    stop.enabled = false
    socket!.close()
    socket = undefined
})
stop.enabled = false

function runChordata(mgr: UpdateManager) {
    const enc = new TextEncoder()
    const host = "localhost"
    const port = 9001
    const client = new WebSocket(`ws://${host}:${port}`) // CHECK: is there a WS port on the Notochord itself?
    // const client = new WebSocket("ws://notochord.fritz.box:7681/")
    client.binaryType = "arraybuffer"
    client.onerror = (e) => {
        start.enabled = true
        stop.enabled = false
        client!.close()
        socket = undefined
    }
    client.onopen = () => {
        console.log(`web socket is open`)
        client!.onmessage = async (msg: MessageEvent) => {
            let arrayBuffer: ArrayBuffer
            if (msg.data instanceof Blob) {
                arrayBuffer = await msg.data.arrayBuffer()
            } else if (msg.data instanceof ArrayBuffer) {
                arrayBuffer = msg.data
            } else {
                console.log("neither blob nor arraybuffer")
                return
            }
            // console.log(`chordata rcvd ${arrayBuffer.byteLength} octets`)
            const decoder = new COOPDecoder(arrayBuffer)
            try {
                setBones(decoder.decode())
                mgr.invalidateView()
                client!.send(enc.encode("GET CHORDATA"))
            } catch (error) {
                start.enabled = true
                stop.enabled = false
                client!.close()
                socket = undefined
                console.log(`failed to decode chordata`)
                hexdump(decoder.bytes)
                // client!.send(enc.encode("GET CHORDATA"))
            }
        }
        // console.log("REQUEST CHORDATA")
        client!.send(enc.encode("GET CHORDATA"))
    }
    return client
}

export default function (updateManager: UpdateManager, settings: ChordataSettings) {
    mgr = updateManager
    settings.modified.add(() => updateManager.invalidateView())
    return (
        <Tab label="Chordata" value={TAB.CHORDATA}>
            <Button variant={ButtonVariant.ACCENT} action={start}>
                Start
            </Button>
            <Button variant={ButtonVariant.NEGATIVE} action={stop}>
                Stop
            </Button>
            <Button action={() => {
                calibrateNPose()
                updateManager.invalidateView()
            }}>Calibrate N-Pose</Button>
            <Form>
                <FormText model={settings.X0} />
                <FormText model={settings.Y0} />
                <FormText model={settings.Z0} />
             
                <FormText model={settings.X1} />
                <FormText model={settings.Y1} />
                <FormText model={settings.Z1} />
                {/* <FormText model={settings.R} /> */}
            </Form>

            { /* <div style={{ padding: "15px" }}>
                <h1>TRY TO LIVE RENDER THE CHAIN BASE, DORSAL, NECK / AND AN ARM</h1>

                <p>The pose calibration is used to detect how the KCeptors are placed on the body.</p>
                <p>
                    It seems that Chordata is already doing that on it's own and adjusts the data transmitted via COOP
                    accordingly but when I tried it in the Blender add-on, it didn't seem to work.
                </p>
                <p>
                    This is an experiment to find out how to perform another pose calibration for the Chordata KCeptors.
                    Chordata does this by using all sensor data... and since I have no clue what is going on there, I'll
                    try ny own recipe which uses only data available via COOP.
                </p>
                <ul>
                    <li>
                        The <span style={{ color: "#f80" }}>orange</span> cone represents a KCeptor mounted to the body
                        with rotation (X0, Y0, Z0). This will be used during the first pose calibration step were one
                        has to assume an N-Pose (normal pose: stand straight, arms and legs straight and close to the
                        body).
                    </li>
                    <li>
                        The <span style={{ color: "#f00" }}>red</span> cone represent the axis along which the KCeptor
                        will be rotated during the second calibration step (X1, Y1, Z1).
                    </li>
                    <li>
                        The <span style={{ color: "#ff0" }}>yellow</span> cone represents the KCeptor after the rotation
                        during the second calibration step by R.
                    </li>
                    <li>
                        The <span style={{ color: "#08f" }}>blue</span> cone represents the calibrated KCeptor points
                        upwards and one side points in the direction of the second calibration step.
                    </li>
                </ul>
                <p>Let's see how much of a fool I'll make out of myself. 😁</p>
            </div> */}
        </Tab>
    )
}
