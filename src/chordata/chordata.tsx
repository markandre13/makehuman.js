import { TAB } from "HistoryManager"
import { COOPDecoder } from "chordata/COOPDecoder"
import { calibrateNPose, setBones } from "chordata/renderChordata"
import { Action, Display, NumberModel, OptionModelBase, Select, TextModel } from "toad.js"
import { Button, ButtonVariant } from "toad.js/view/Button"
import { Tab } from "toad.js/view/Tab"
import { hexdump } from "../lib/hexdump"
import { UpdateManager } from "UpdateManager"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { FormText } from "toad.js/view/FormText"
import { ChordataSettings } from "./ChordataSettings"
import { RemoteOptionModel } from "./RemoteOptionModel"

// GOAL:
// * call the notochord on our own
// * select 'mark_config' as active configuration, which hopefully has my modified ids
//   also: state shows all available configurations, where are the files, why are there 2 mark_config?, is it okay?
// * go through the calibration but go through the steps via timer
// * have a look at what the COOP data now looks like. is n-pose all identity vectors? and do i just have to adjust
//   for the difference in the makehuman skeleton?
// * can i get the coop data via websocket?

class Notochord {
    processState = new TextModel("UNAVAILABLE", {
        label: "State",
        description: "Either STOPPED, RUNNING, IDLE or UNAVAILABLE",
    }) // RUNNING, STOPPED, UNAVAILABLE
    calibrationState = new TextModel("", {
        label: "Calibration State",
    })

    configs = new RemoteOptionModel("", [], {
        label: "Configuration",
    }).callback((config) => this.setConfig(config))

    // hostname of the Chordata Notochord
    hostname = new TextModel("notochord", { label: "Notochord Hostname" })
    // where to send COOP UDP traffic to
    dstHostname = new TextModel("192.168.178.24", { label: "COOP Destination Hostname" })
    dstPort = new NumberModel(6565, { min: 0, max: 0xffff, label: "COOP Destination UDP Port" })

    start = new Action(() => this.doStart())
    stop = new Action(() => this.doStop(), { enabled: false })

    startProxy = new Action(() => {
        console.log("START")
        start.enabled = false
        stop.enabled = true
        socket = runChordata(mgr)
    })
    stopProxy = new Action(
        () => {
            console.log("STOP")
            start.enabled = true
            stop.enabled = false
            socket!.close()
            socket = undefined
        },
        { enabled: false }
    )

    protected pullState = false

    constructor() {
        this.visibilityChange = this.visibilityChange.bind(this)
        this.doPullState = this.doPullState.bind(this)

        this.processState.modified.add(() => {
            switch (this.processState.value) {
                case "UNAVAILABLE":
                case "IDLE":
                    this.start.enabled = false
                    this.stop.enabled = false
                    break
                case "STOPPED":
                    this.start.enabled = true
                    this.stop.enabled = false
                    break
                case "RUNNING":
                    this.start.enabled = false
                    this.stop.enabled = true
                    break
            }
        })
    }

    visibilityChange(state: "visible" | "hidden") {
        if (this.pullState === false) {
            this.pullState = true
            this.doPullState()
        } else {
            this.pullState = false
        }
    }

    protected async doPullState() {
        try {
            const response = await this.poll()
            const parser = new window.DOMParser()
            const data = parser.parseFromString(await response.text(), "text/xml")
            const processState = data.querySelector("NotochordProcess")
            if (processState) {
                this.processState.value = processState?.innerHTML
            }
            const configs = data.querySelectorAll("NotochordConfiguration")
            let activeConfig = ""
            const configLabels: string[] = []
            configs.forEach((it) => {
                const label = it.getAttribute("label")!
                const active = it.getAttribute("active") === "true"
                if (active) {
                    activeConfig = label
                }
                configLabels.push(label)
            })
            this.configs.setMapping(configLabels)
            this.configs.setLocalValue(activeConfig)
        } catch (error) {
            this.processState.value = "UNAVAILABLE"
        }
        if (this.pullState) {
            setTimeout(this.doPullState, 1000)
        }
    }
    doStart() {
        const r = this.call(
            `http://${this.hostname.value}/notochord/init?scan=1&addr=${this.dstHostname.value}&port=${this.dstPort.value}&verbose=0`
        )
    }
    doStop() {
        this.call(`http://${this.hostname.value}/notochord/end`)
    }
    setConfig(config: string) {
        this.call(
            `http://${this.hostname.value}/state`,
            `post`,
            `<ControlServerState><NotochordConfigurations>${config}</NotochordConfigurations></ControlServerState>`
        )
    }
    async callibrate(step: CalibrationStep, run?: boolean): Promise<boolean> {
        let response: Response
        if (run !== true) {
            response = await fetch(`http://${this.hostname.value}/pose/calibrate?step=${step}`)
        } else {
            response = await fetch(`http://${this.hostname.value}/pose/calibrate?step=${step}&run=1`)
        }

        const parser = new window.DOMParser()
        const data = parser.parseFromString(await response.text(), "text/xml")
        const state = data.querySelector("State")
        const reason = data.querySelector("Reason")
        let msg = ""
        if (state !== null) {
            msg += state.innerHTML
        }
        if (reason !== null) {
            msg += `: ${reason.innerHTML}`
        }
        notochord.calibrationState.value = msg

        return response.ok

        // 200
        // <NotochordResponse>
        //   <State>Calibration step RIGHT_LEG</State>
        // </NotochordResponse>
        //
        // 500
        // <NotochordResponse>
        //   <State>Error on notochord calibration</State>
        //   <Reason>No data to calibrate</Reason>
        // </NotochordResponse>
    }
    async poll() {
        // when failing, set state to UNAVAILABLE
        return fetch(`http://${this.hostname.value}/state?clear_registry=false`)
    }
    async call(url: string, method: string = "get", body?: string) {
        try {
            return await fetch(url, { method, body })
        } catch (e) {
            console.log(e)
            // if (e instanceof Error) {
            //     if (e.name === "TypeError") {
            //     } else {
            //         console.log(e)
            //     }
            // } else {
            //     console.log(typeof e)
            // }
        }
    }
}

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

// http://notochord.fritz.box/notochord/init?scan=1&addr=192.168.178.24&port=6565&verbose=0
// http://notochord.fritz.box/notochord/end

let notochord = new Notochord()

export function FormSelect<V>(props: { model: OptionModelBase<V> }) {
    return (
        <>
            <FormLabel model={props.model} />
            <FormField>
                <Select model={props.model} />
            </FormField>
            <FormHelp model={props.model} />
        </>
    )
}

const enum CalibrationStep {
    CALIB_IDLE = 0, // we send this at the end of each step
    CALIBRATING = 1, // ???
    // these initiate an calibration step
    STATIC = 2,
    ARMS = 3,
    TRUNK = 4,
    L_LEG = 5,
    R_LEG = 6,
}

interface Step {
    label: string
    color?: string
    step?: CalibrationStep
    run?: boolean
}

const script: Step[] = [
    {
        label: "Get ready to calibrate",
        color: "#f80",
    },
    {
        label: "Move into N-Pose",
        color: "#0f0",
    },
    {
        label: "Stand still",
        step: CalibrationStep.STATIC, // display, set, run timmer
    },
    {
        label: "Get ready to raise arms",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
    },
    {
        label: "Raise arms",
        color: "#0f0",
        step: CalibrationStep.ARMS,
    },
    {
        label: "Lower arms",
    },
    {
        label: "Get ready to bow",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
    },
    {
        label: "Bow down",
        color: "#0f0",
        step: CalibrationStep.TRUNK,
    },
    {
        label: "Get straight",
    },
    {
        label: "Get ready to raise left leg",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
    },
    {
        label: "Raise left leg",
        color: "#0f0",
        step: CalibrationStep.L_LEG,
    },
    {
        label: "Lower left leg",
    },
    {
        label: "Get ready to raise right leg",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
    },
    {
        label: "Raise right leg",
        color: "#0f0",
        step: CalibrationStep.R_LEG,
    },
    {
        label: "Lower right leg",
    },
    {
        label: "Done. Thank you",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
        run: true,
    },
]

function CallibrationButton() {
    let button: Button
    let btn: HTMLButtonElement
    let running = false
    const interval = 2
    const action = new Action(() => {})
    const buttonHandler = () => {
        let stepCounter = -1
        let timeCounter = -1
        const reset = () => {
            running = false
            stepCounter = -1
            timeCounter = -1
            btn.innerText = "Start"
            btn.style.backgroundColor = ""
            btn.style.color = ""
            btn.style.fontSize = ""
        }
        const timeHandler = () => {
            if (!running) {
                return
            }
            let call = false
            if (timeCounter < 0) {
                ++stepCounter
                timeCounter = interval
                call = true
            }
            if (stepCounter >= script.length) {
                reset()
                return
            }

            const step = script[stepCounter]
            if (step.color !== undefined) {
                btn.style.backgroundColor = step.color
            }
            if (stepCounter < script.length - 1) {
                btn.innerText = `${step.label}... ${timeCounter.toFixed(1)}s`
            } else {
                btn.innerText = `${step.label}.`
            }

            if (call && step.step !== undefined) {
                notochord.callibrate(step.step, step.run) // TODO: we have now reached a level of sophistication were unit testing becomes feasible
            }

            timeCounter = timeCounter - 0.1
            setTimeout(timeHandler, 100)
        }
        if (!running) {
            running = true
            btn.style.color = "#000"
            btn.style.fontSize = "calc((14/16) * 1rem)"
            timeHandler()
        } else {
            reset()
            notochord.callibrate(CalibrationStep.CALIB_IDLE)
        }
    }
    button = (
        <Button action={action} style={{ width: "250px", height: "50px" }}>
            Start
        </Button>
    ) as Button
    btn = button.shadowRoot!.children[0] as HTMLButtonElement
    btn.onpointerup = buttonHandler
    btn.onclick = null
    btn.style.width = "inherit"
    btn.style.height = "inherit"
    return button
}

export default function (updateManager: UpdateManager, settings: ChordataSettings) {
    mgr = updateManager
    settings.modified.add(() => updateManager.invalidateView())
    return (
        <Tab label="Chordata" value={TAB.CHORDATA} visibilityChange={notochord.visibilityChange}>
            {/* <Button variant={ButtonVariant.ACCENT} action={start}>
                Start
            </Button>
            <Button variant={ButtonVariant.NEGATIVE} action={stop}>
                Stop
            </Button> */}
            <Form>
                <FormText model={notochord.hostname} />
                <FormText model={notochord.dstHostname} />
                <FormText model={notochord.dstPort} />

                <FormLabel model={notochord.processState} />
                <FormField>
                    <div style={{ fontWeight: "bold" }}>
                        <Display model={notochord.processState} />
                    </div>
                    <Button variant={ButtonVariant.ACCENT} action={notochord.start}>
                        Start
                    </Button>
                    <Button variant={ButtonVariant.NEGATIVE} action={notochord.stop}>
                        Stop
                    </Button>
                </FormField>
                <FormHelp model={notochord.processState} />

                <FormSelect model={notochord.configs} />

                <FormLabel>Calibrate</FormLabel>
                <FormField>
                    <CallibrationButton />
                    <br />
                    <Display model={notochord.calibrationState} />
                </FormField>

                <FormLabel>Makehuman.js</FormLabel>
                <FormField>
                    <Button
                        action={() => {
                            calibrateNPose()
                            updateManager.invalidateView()
                        }}
                    >
                        Calibrate N-Pose
                    </Button>
                </FormField>

                {/* <FormText model={settings.X0} />
                <FormText model={settings.Y0} />
                <FormText model={settings.Z0} />

                <FormText model={settings.X1} />
                <FormText model={settings.Y1} />
                <FormText model={settings.Z1} /> */}
                {/* <FormText model={settings.R} /> */}
            </Form>

            <div style={{ padding: "15px" }}>
                <h1>About</h1>
                <p>
                    This needs a <a href="https://chordata.cc">Chordata Motion</a> running in your local network.
                </p>
                <p>
                    To be able to call the Notochord from another machine, edit the file
                    <code> /opt/chordata/notochord-control-server/notochord_control_server/__init__.py </code>
                    on the Notochord, add the following snippet
                    <pre>
                        {`    @app.after_request
    def apply_caching(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response`}
                    </pre>
                    and reboot.
                </p>
            </div>
        </Tab>
    )
}
