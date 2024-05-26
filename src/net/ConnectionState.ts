// IBM 3270 terminology
// * Operator Information Area: the status line at the bottom of the terminal window
// * Communication Check: the area displaying the communication status to the host
// * Communication Reminder Symbol: the crossed out Z symbol

export enum ConnectionState {
    NOT_CONNECTED,
    CONNECTING,
    CONNECTED
}
