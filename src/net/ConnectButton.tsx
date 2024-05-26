import { ConnectionState } from "net/ConnectionState"
import { Connector } from "net/Connector"

export function ConnectButton(props: { connector: Connector} ) {
    const connector = props.connector
    const s = document.createElement("span")
    // s.replaceChildren(document.createTextNode(connector.peer))
    const update = () => {
        // console.log(`update state to ${connector.state}`)
        switch (connector.state) {
            case ConnectionState.NOT_CONNECTED:
                s.classList.remove("connecting")
                s.style.color = "var(--tx-warning-color)"
                // s.title = "NOT CONNECTED"
                s.replaceChildren(document.createTextNode("NOT CONNECTED"))
                break
            case ConnectionState.CONNECTING:
                s.classList.add("connecting")
                s.style.color = ""
                // s.title = "CONNECTING"
                s.replaceChildren(document.createTextNode("CONNECTING"))
                break
            case ConnectionState.CONNECTED:
                s.classList.remove("connecting")
                s.style.color = "var(--tx-gray-700)"
                // s.title = "CONNECTED"
                s.replaceChildren(document.createTextNode("CONNECTED"))
                break
        }
    }
    update()
    connector.signal.add(update)
    s.style.cursor = "default"
    s.onpointerdown = (ev: MouseEvent) => {
        ev.preventDefault()
        connector.connect()
    }
    return s
}
