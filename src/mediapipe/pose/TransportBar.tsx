import { Application } from "Application"
import { sleep } from "lib/sleep"
import { Button, TextField, TextModel } from "toad.js"
import { ValueModel } from "toad.js/model/ValueModel"

// TODO: disable/enable buttons with constraints

export function TransportBar(props: { app: Application; file: TextModel; delay: ValueModel<number> }) {
    return (
        <>
            <Button
                action={async () => {
                    const synth = window.speechSynthesis
                    const voice = synth.getVoices().filter((it) => it.lang.startsWith("en"))[0]

                    let countDown = props.delay.value
                    const schedule = () => {
                        if (countDown > 0) {
                            const utter = new SpeechSynthesisUtterance(`${countDown}`)
                            utter.voice = voice
                            synth.speak(utter)
                            --countDown
                            window.setTimeout(() => {
                                if (countDown > 0) {
                                    schedule()
                                }
                            }, 1000)
                        }
                        if (countDown === 0) {
                            if (props.delay.value > 0) {
                                const utter = new SpeechSynthesisUtterance(`record`)
                                utter.voice = voice
                                synth.speak(utter)
                            }
                            // console.log(props.app.frontend._poseLandmarks?.toString())
                            props.app.frontend.backend?.record(props.file.value)
                        }
                    }
                    schedule()
                }}
            >
                <span style={{ color: "#f00" }}>●</span>
            </Button>
            <Button action={() => props.app.frontend.backend?.stop()}>◼︎</Button>
            {/* <Button action={() => props.app.frontend.backend?.play("video.mp4")}>▶︎</Button> */}
            <Button
                action={async () => {
                    try {
                        const range = await props.app.frontend.backend?.play(props.file.value)
                    } catch (e) {
                        console.log("UPSY DAISY")
                        if (e instanceof Error) {
                            alert(`${e.name}: ${e.message}`)
                        }
                    }
                }}
            >
                ▶︎
            </Button>
            <Button action={() => props.app.frontend.backend?.pause()}>❙ ❙</Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value - 30n)}>
                ◀︎◀︎
            </Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value - 1n)}>
                ❙◀︎
            </Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value + 1n)}>
                ▶︎❙
            </Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value + 30n)}>
                ▶︎▶︎
            </Button>
            <TextField model={props.app.frontend._poseLandmarksTS as any} />
        </>
    )
    //
}
