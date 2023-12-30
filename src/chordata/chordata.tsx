import { TAB } from "HistoryManager"
import { COOPDecoder } from "chordata/COOPDecoder"
import { calibrateNPose, setBones } from "chordata/renderChordata"
import { Action, Display, NumberModel, OptionModelBase, Select, TextModel } from "toad.js"
import { Button, ButtonVariant } from "toad.js/view/Button"
import { Tab } from "toad.js/view/Tab"
import { UpdateManager } from "UpdateManager"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { FormText } from "toad.js/view/FormText"
import { FormSelect } from "toad.js/view/FormSelect"
import { FormSwitch } from "toad.js/view/FormSwitch"
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

// ISSUES
// * after a reboot, and not moving the sensors, i get:
//   Error on notochord calibration: No data to calibrate
// * later, with moving the sensors, i get:
//   Error on notochord calibration: The number of data points 74589 is not equal to the number of cycles 4970 * number of nodes 30 = 149100
// * calibration steps are most likely the same as with the official software, were i get the same error
// * error is reported in notochord-module/pyx/notochord/calipration.pyx

let socket: WebSocket | undefined
let mgr: UpdateManager

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
    dstPort = new NumberModel(6565, { min: 1, max: 0xffff, label: "COOP Destination UDP Port" })

    poseMode = false

    start = new Action(() => this.doStart())
    stop = new Action(() => this.doStop(), { enabled: false })

    protected pullState = false

    constructor() {
        this.visibilityChange = this.visibilityChange.bind(this)
        this.doPullStateJob = this.doPullStateJob.bind(this)
    }

    visibilityChange(state: "visible" | "hidden") {
        if (this.pullState === false) {
            this.pullState = true
            this.doPullStateJob()
        } else {
            this.pullState = false
        }
    }

    protected async doPullStateJob() {
        try {
        // when failing, set state to UNAVAILABLE
            const response = await fetch(`http://${this.hostname.value}/state?clear_registry=false&peek_output=true`)
            const parser = new window.DOMParser()
            const data = parser.parseFromString(await response.text(), "text/xml")
            // console.log(data)
            this.updateProcessState(data)
            this.updateConfigs(data)
            // this.updateLogs(data)
        } catch (error) {
            this.processState.value = "UNAVAILABLE"
        }
        if (this.pullState) {
            setTimeout(this.doPullStateJob, 1000)
        }
    }

    protected updateProcessState(data: Document) {
        const processState = data.querySelector("NotochordProcess")
        if (processState) {
            if (this.processState.value !== processState.innerHTML) {
                console.log(`${new Date()} STATE CHANGE FROM ${this.processState.value} TO ${processState.innerHTML}`)
            }
            this.processState.value = processState.innerHTML

            switch (this.processState.value) {
                case "UNAVAILABLE":
                    this.start.enabled = false
                    this.stop.enabled = false
                    break
                case "STOPPED":
                case "IDLE":
                    this.start.enabled = true
                    this.stop.enabled = false
                    break
                case "RUNNING":
                    this.start.enabled = false
                    this.stop.enabled = true // !this.poseMode
                    break
                default:
                    console.log(`UNKNOWN STATE ${processState.innerHTML}`)
            }

            if (processState.innerHTML === "RUNNING" && socket === undefined && !this.poseMode) {
                socket = runChordata(mgr)
            }
            if (processState.innerHTML !== "RUNNING" && socket !== undefined) {
                socket.close()
                socket = undefined
            }
        }
    }

    protected updateConfigs(data: Document) {
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
    }

    protected updateLogs(data: Document) {
        const log = data.querySelector("Log")
        if (log === null) {
            return
        }
        let text = ""
        for(let i=0; i<log.children.length; ++i) {
            const it = log.children[i]
            text += `${it.nodeName} ${it.innerHTML}`
        }
        if (text.length > 0) {
            console.log(text)
        }
    }

    async doStart() {
        // scan: 0: use hierarchy from the config, 1: scan kceptors
        const url = `http://${this.hostname.value}/notochord/init?scan=0&raw=0&addr=${this.dstHostname.value}&port=${this.dstPort.value}&verbose=2`
        console.log(`DO START ${url}`)
        const response = await fetch(url)
        if (!response.ok) {
            const msg = `${response.status} ${response.statusText}: ${await response.text()}`
            console.log(msg)
        }
    }
    async doStop() {
        const url = `http://${this.hostname.value}/notochord/end`
        console.log(`DO STOP ${url}`)
        if (socket !== undefined) {
            socket!.close()
            socket = undefined
        }
        const response = await fetch(url)
        if (!response.ok) {
            const msg = `${response.status} ${response.statusText}: ${await response.text()}`
            console.log(msg)
        }
    }
    async doStartPose() {
        this.poseMode = true
        const url = `http://${this.hostname.value}/pose/connect?scan=1&addr=${this.dstHostname.value}&port=${this.dstPort.value}&verbose=0`
        // const url = `http://${this.hostname.value}/notochord/init?scan=1&raw=1&addr=${this.dstHostname.value}&port=${this.dstPort.value}&verbose=0`
        console.log(`${new Date()} START POSE ${url}`)
        const response = await fetch(url)
        if (!response.ok) {
            const msg = `${response.status} ${response.statusText}: ${await response.text()}`
            console.log(msg)
            this.calibrationState.value = msg
        }
        // TODO: handle error
        // r.then( (x) => {x!.text().then( y => console.log(y)) })
    }
    async doStopPose() {
        this.poseMode = false
        const url = `http://${this.hostname.value}/pose/disconnect`
        // const url = `http://${this.hostname.value}/notochord/end`
        console.log(`${new Date()} STOP POSE ${url}`)
        if (socket !== undefined) {
            socket!.close()
            socket = undefined
        }
        await this.call(url)
        // TODO: handle error
    }
    setConfig(config: string) {
        this.call(
            `http://${this.hostname.value}/state`,
            `post`,
            `<ControlServerState><NotochordConfigurations>${config}</NotochordConfigurations></ControlServerState>`
        )
    }
    // will also write data.csv on the Notochord
    async poseData() {
        const url = `http://${this.hostname.value}/pose/data`
        console.log(`${new Date()} POSE DATA ${url}`)
        const response = await fetch(url)
        console.log(`${new Date()} POSE DATA -> ${response.status} ${response.statusText}`)
        // TODO: handle error
        const parser = new window.DOMParser()
        const data = parser.parseFromString(await response.text(), "text/xml")
        const state = data.querySelector("State")
        return state?.innerHTML
    }
    // will also print the index to the Notochord's log
    async poseIndex() {
        const url = `http://${this.hostname.value}/pose/index`
        console.log(`${new Date()} POSE INDICES ${url}`)
        const response = await fetch(url)
        console.log(`${new Date()} POSE INDICES -> ${response.status} ${response.statusText}`)
        // TODO: handle error
        const parser = new window.DOMParser()
        const data = parser.parseFromString(await response.text(), "text/xml")
        const state = data.querySelector("State")
        return state?.innerHTML
    }
    async calibrateRun() {
        const url = `http://${this.hostname.value}/pose/run`
        console.log(`${new Date()} CALIBRATE RUN ${url}`)
        const response = await fetch(url)
        console.log(`${new Date()} CALIBRATE RUN -> ${response.status} ${response.statusText}`)
        // TODO: handle error
        const parser = new window.DOMParser()
        const data = parser.parseFromString(await response.text(), "text/xml")
        const state = data.querySelector("State")
        return state?.innerHTML
    }
    async calibrate(step: CalibrationStep, run?: boolean): Promise<boolean> {
        let url: string
        if (run !== true) {
            url = `http://${this.hostname.value}/pose/calibrate?step=${step}`
        } else {
            url = `http://${this.hostname.value}/pose/calibrate?step=${step}&run=1`
        }
        console.log(`${new Date()} CALIBRATE ${url}`)
        const response = await fetch(url)
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
        console.log(`${new Date()} CALIBRATE -> ${response.status} ${msg}`)
        notochord.calibrationState.value = msg

        return response.ok
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

function runChordata(mgr: UpdateManager) {
    const enc = new TextEncoder()
    const host = "localhost"
    const port = 9001
    const client = new WebSocket(`ws://${host}:${port}`) // CHECK: is there a WS port on the Notochord itself?
    // const client = new WebSocket("ws://notochord.fritz.box:7681/")
    client.binaryType = "arraybuffer"
    client.onerror = (e) => {
        console.log(`${new Date()} ERROR COMMUNICATING WITH COOP PROXY`)
        notochord.start.enabled = true
        notochord.stop.enabled = false
        client!.close()
        socket = undefined
    }
    client.onopen = () => {
        console.log(`${new Date()} CONNECTED TO COOP PROXY`)
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
                notochord.start.enabled = true
                notochord.stop.enabled = false
                client!.close()
                socket = undefined
                console.log(`failed to decode chordata: ${error}`)
                // hexdump(decoder.bytes)
                // client!.send(enc.encode("GET CHORDATA"))
            }
        }
        // console.log("REQUEST CHORDATA")
        client!.send(enc.encode("GET CHORDATA"))
    }
    client.onclose = (e: CloseEvent) => {
        console.log(`${new Date()} DISCONNECTED FROM COOP PROXY`)
    }
    return client
}

let notochord = new Notochord()

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
        label: "Get ready to raise arms forward 90°",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
    },
    {
        label: "Raise arms forward 90°",
        color: "#0f0",
        step: CalibrationStep.ARMS,
    },
    {
        label: "Lower arms",
    },
    {
        label: "Get ready to bow forward",
        color: "#f80",
        step: CalibrationStep.CALIB_IDLE,
    },
    {
        label: "Bow forward",
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

// FIXME: WE MIGHT NEED TO CALL CONNECT/DISCONNECT BEFORE/AFTER THE CALIBRATION
function CalibrationButton() {
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
        const timeHandler = async () => {
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
            if (stepCounter !== 0 && stepCounter < script.length - 1) {
                btn.innerText = `${step.label}... ${timeCounter.toFixed(1)}s`
            } else {
                btn.innerText = `${step.label}.`
            }

            if (call) {
                if (stepCounter === 0) {
                    // await notochord.doStop()
                    await notochord.doStartPose()
                }
            }

            if (call && step.step !== undefined) {
                const ok = await notochord.calibrate(step.step)
                if (step.run) {
                    // dump captured data into file on the Notochord
                    //     /opt/chordata/notochord-control-server/data.csv
                    // of format
                    //     ,time(msec),node_label,q_w,q_x,q_y,q_z,g_x,g_y,g_z,a_x,a_y,a_z,m_x,m_y,m_z
                    //     0,4267851,base,42.0,93.0,3.0,2.0,5.0,125.0,590.0,1.0,54.0,34.0,654.0,453.0,231.0
                    //     ...
                    let msg = "data: "
                    msg += await notochord.poseData()
                    notochord.calibrationState.value = msg
                    // prints the indices into the HTTP log, TODO: also write to file
                    //     {'func_legs_l_s': 737, 'func_legs_r_i': 738, 'func_legs_l_i': 528, 'func_legs_r_s': 0, 'func_trunk_s': 527, 'func_trunk_i': 318, 'func_arms_s': 317, 'func_arms_i': 108, 'vert_s': 107, 'vert_i': 0}
                    msg += ", indices: "
                    msg += await notochord.poseIndex()
                    notochord.calibrationState.value = msg

                    // now run the calibration (and in case it crashes, we now have the data available for debugging)
                    msg += ", calibration: "
                    msg += await notochord.calibrateRun()
                    notochord.calibrationState.value = msg
                }
                // when not okay and not run (as run includes a stop), stop
                if (!ok && step.run !== true) {
                    await notochord.doStopPose()
                    reset()
                    return
                }
            }

            // if (call) {
            //     if (stepCounter >= script.length - 1) {
            //         await notochord.doStopPose()
            //     }
            // }

            if (notochord.processState.value === "RUNNING") {
                timeCounter = timeCounter - 0.1
            }
            setTimeout(timeHandler, 100)
        }
        if (!running) {
            running = true
            btn.style.color = "#000"
            btn.style.fontSize = "calc((14/16) * 1rem)"
            timeHandler()
        } else {
            reset()
            notochord.calibrate(CalibrationStep.CALIB_IDLE)
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

                <FormLabel>Sensor Calibration</FormLabel>
                <FormField>T.B.D.</FormField>

                <FormLabel>Pose Calibration</FormLabel>
                <FormField>
                    <CalibrationButton />
                    <br />
                    <Display model={notochord.calibrationState} />
                </FormField>

                <FormSwitch model={settings.mountKCeptorView}/>

                {/* <FormLabel>Makehuman.js</FormLabel>
                <FormField>
                    <Button
                        action={() => {
                            calibrateNPose()
                            updateManager.invalidateView()
                        }}
                    >
                        Calibrate N-Pose
                    </Button>
                </FormField> */}

                <FormText model={settings.X0} />
                <FormText model={settings.Y0} />
                <FormText model={settings.Z0} />

                <FormText model={settings.X1} />
                <FormText model={settings.Y1} />
                <FormText model={settings.Z1} />
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
