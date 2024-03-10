import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { Frontend } from "net/makehuman_skel"
import { Button } from "toad.js"
import { Tab } from "toad.js/view/Tab"

let orb: ORB | undefined
let backend: Backend
let frontend: Frontend_impl

export function MediapipeTab(props: {}) {
    return (
        <Tab label="Mediapipe" value={TAB.MEDIAPIPE}>
            <Button action={() => callORB()}>The Orb of Osuvox</Button>
        </Tab>
    )
}

async function callORB() {
    if (orb === undefined) {
        orb = new ORB()
        orb.registerStubClass(Backend)
        orb.addProtocol(new WsProtocol())
    }
    if (backend == null) {
        backend = Backend.narrow(await orb.stringToObject("corbaname::localhost:9001#Backend"))
        frontend = new Frontend_impl(orb)
        backend.setFrontend(frontend)
    }
}

class Frontend_impl extends Frontend {
    override async hello(): Promise<void> {
        console.log("HELLO FROM THE SERVER")
    }
}
