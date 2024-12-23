import { NumberModel, Signal, TextModel } from "toad.js"
import { ConnectionState } from "net/ConnectionState"
import { Frontend_impl } from "./Frontend_impl"
import { Backend } from "./makehuman_stub"
import { ORB } from "corba.js"

export class Connector {
    signal = new Signal();
    hostname = new TextModel("localhost")
    port = new NumberModel(9001, {min: 1, max: 0xffff})

    private m_state = ConnectionState.NOT_CONNECTED
    private frontend: Frontend_impl

    constructor(frontend: Frontend_impl) {
        this.frontend = frontend    
    }

    async connect() {
        if (this.state != ConnectionState.NOT_CONNECTED) {
            return
        }
        try {
            this.state = ConnectionState.CONNECTING
            const object = await this.frontend.orb.stringToObject(`corbaname::${this.hostname.value}:${this.port.value}#Backend`)
            const backend = Backend.narrow(object)
            this.frontend.backend = backend
            ORB.installSystemExceptionHandler(backend, () => {
                this.frontend.backend = undefined
                this.state = ConnectionState.NOT_CONNECTED
            })
            backend.setFrontend(this.frontend)
            this.state = ConnectionState.CONNECTED
        } catch (e) {
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
