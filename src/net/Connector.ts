import { NumberModel, Signal, TextModel } from "toad.js"
import { ConnectionState } from "net/ConnectionState"
import { Frontend_impl } from "./Frontend_impl"
import { ARKitFaceDevice, Backend } from "./makehuman_stub"
import { FileSystem } from "./fs_stub"
import { ORB } from "corba.js"
import { CaptureDeviceType } from "./makehuman"
import { ARKitFaceReceiver as ARKitFaceReceiver_skel } from "./makehuman_skel"

class ARKitFaceReceiver_impl extends ARKitFaceReceiver_skel {
    faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        console.log(`ARKitFaceReceiver_impl::faceBlendshapeNames([${faceBlendshapeNames.length}])`)
    }
    faceLandmarks(landmarks: Float32Array, blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint): void {
        console.log(`ARKitFaceReceiver_impl::faceLandmarks([${landmarks.length}], [${blendshapes.length}], [${transform.length}], ${timestamp_ms})`)
    }
}

/**
 * handles connecting the frontend to the backend
 */
export class Connector {
    signal = new Signal();
    hostname = new TextModel("localhost")
    port = new NumberModel(9001, {min: 1, max: 0xffff})

    private m_state = ConnectionState.NOT_CONNECTED
    private frontend: Frontend_impl

    constructor(frontend: Frontend_impl) {
        this.frontend = frontend    
    }

    /**
     * initiates a connection to the backend
     */
    async connectToBackend() {
        if (this.state != ConnectionState.NOT_CONNECTED) {
            return
        }
        try {
            this.state = ConnectionState.CONNECTING
            const backendObject = this.frontend._orb.stringToObject(`corbaname::${this.hostname.value}:${this.port.value}#Backend`)
            const filesystemObject = this.frontend._orb.stringToObject(`corbaname::${this.hostname.value}:${this.port.value}#FileSystem`)

            const backend = Backend.narrow(await backendObject)
            this.frontend.backend = backend
            this.frontend.filesystem = FileSystem.narrow(await filesystemObject)
            this.frontend.recorder.value = await backend.recorder()

            // FIXME: only switch to NOT_CONNECT when the exeption indicates a connection loss
            ORB.installSystemExceptionHandler(backend, () => {
                this.frontend.backend = undefined
                this.frontend.filesystem = undefined
                this.frontend.recorder.value = undefined
                this.state = ConnectionState.NOT_CONNECTED
            })
            await backend.setFrontend(this.frontend)
            this.state = ConnectionState.CONNECTED

            console.log(`capture devices on backend:`)
            for(const device of await backend.captureDevices()) {
                console.log(`* ${CaptureDeviceType[device.type]} ${device.name}`)
                if (device.device instanceof ARKitFaceDevice) {
                    console.log("FOUND ARKitFaceDevice -> set receiver")
                    const receiver = new ARKitFaceReceiver_impl(this.frontend._orb)
                    await device.device.receiver(receiver)
                }
            }
        } catch (e) {
            console.error(e)
            this.state = ConnectionState.NOT_CONNECTED
        }
    }

    get state() {
        return this.m_state
    }
    set state(state: ConnectionState) {
        if (this.state === state) {
            return
        }
        this.m_state = state
        this.signal.emit()
    }
}
