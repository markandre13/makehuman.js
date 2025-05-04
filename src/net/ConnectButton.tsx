import { ConnectionState } from "net/ConnectionState"
import { Connector } from "net/Connector"

export function ConnectButton(props: { connector: Connector} ) {
    const connector = props.connector
    const s = document.createElement("span")
    // s.replaceChildren(document.createTextNode(connector.peer))
    const update = () => {
        switch (connector.state) {
            case ConnectionState.NOT_CONNECTED:
                s.classList.remove("connecting")
                s.style.color = "var(--tx-warning-color)"
                s.title = "Not connected to backend."
                s.replaceChildren(document.createTextNode("X"))
                break
            case ConnectionState.CONNECTING:
                s.classList.add("connecting")
                s.style.color = ""
                s.title = "Connecting to backend..."
                s.replaceChildren(document.createTextNode("…"))
                break
            case ConnectionState.CONNECTED:
                s.classList.remove("connecting")
                s.style.color = "var(--tx-gray-700)"
                s.title = "Connected to backend."
                s.replaceChildren(document.createTextNode("↯"))
                break
        }
    }
    update()
    connector.signal.add(update)
    s.style.cursor = "default"
    s.onpointerdown = (ev: MouseEvent) => {
        ev.preventDefault()
        connector.connectToBackend()
    }
    return s
}
