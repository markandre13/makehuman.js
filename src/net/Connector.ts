import { NumberModel, Signal, TextModel } from "toad.js"
import { ConnectionState } from "net/ConnectionState"
import { Frontend_impl } from "./Frontend_impl"
import { Backend } from "./makehuman_stub"
import { FileSystem } from "./fs_stub"
import { CORBAObject, ORB } from "corba.js"

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

            // FIXME: only switch to NOT_CONNECT when the exeption indicates a connection loss
            ORB.installSystemExceptionHandler(backend, () => {
                this.frontend.backend = undefined
                this.frontend.filesystem = undefined
                this.state = ConnectionState.NOT_CONNECTED
            })
            backend.setFrontend(this.frontend)
            this.state = ConnectionState.CONNECTED
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
