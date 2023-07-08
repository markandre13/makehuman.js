import { TAB } from 'HistoryManager'
import { Action } from 'toad.js'
import { Button, ButtonVariant } from "toad.js/view/Button"
import { Tab } from "toad.js/view/Tab"

const start = new Action(() => {
    console.log("START")
    start.enabled = false
    stop.enabled = true
})
const stop = new Action(() => {
    console.log("STOP")
    start.enabled = true
    stop.enabled = false
})
stop.enabled = false

export default (
    <Tab label="Chordata" value={TAB.CHORDATA}>
        <Button variant={ButtonVariant.ACCENT} action={start}>Start</Button>
        <Button variant={ButtonVariant.NEGATIVE} action={stop}>Stop</Button>
    </Tab>
)
