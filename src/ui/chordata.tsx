import { TAB } from "HistoryManager"
import { COOPDecoder } from "chordata/COOPDecoder"
import { setBones } from "render/renderChordata"
import { Action } from "toad.js"
import { Button, ButtonVariant } from "toad.js/view/Button"
import { Tab } from "toad.js/view/Tab"

let socket: WebSocket | undefined

const start = new Action(() => {
    console.log("START")
    start.enabled = false
    stop.enabled = true
    socket = runChordata()
})
const stop = new Action(() => {
    console.log("STOP")
    start.enabled = true
    stop.enabled = false
    socket!.close()
    socket = undefined
})
stop.enabled = false

function runChordata() {
    const enc = new TextEncoder()
    const host = "localhost"
    const port = 9001
    const client = new WebSocket(`ws://${host}:${port}`)
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
            // console.log(`got ${arrayBuffer.byteLength} octets of chordata`)
            const decoder = new COOPDecoder(arrayBuffer)
            setBones(decoder.decode())
            client!.send(enc.encode("GET CHORDATA"))
        }
        // console.log("REQUEST CHORDATA")
        client!.send(enc.encode("GET CHORDATA"))
    }
    return client
}

function hexdump(bytes: Uint8Array, addr = 0, length = bytes.byteLength) {
    while (addr < length) {
        let line = addr.toString(16).padStart(4, "0")
        for (let i = 0, j = addr; i < 16 && j < bytes.byteLength; ++i, ++j)
            line += " " + bytes[j].toString(16).padStart(2, "0")
        line = line.padEnd(4 + 16 * 3 + 1, " ")
        for (let i = 0, j = addr; i < 16 && j < bytes.byteLength; ++i, ++j) {
            const b = bytes[j]
            if (b >= 32 && b < 127)
                line += String.fromCharCode(b)
            else
                line += "."
        }
        addr += 16
        console.log(line)
    }
}

export default (
    <Tab label="Chordata" value={TAB.CHORDATA}>
        <Button variant={ButtonVariant.ACCENT} action={start}>
            Start
        </Button>
        <Button variant={ButtonVariant.NEGATIVE} action={stop}>
            Stop
        </Button>
    </Tab>
)
