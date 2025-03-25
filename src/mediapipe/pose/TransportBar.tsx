import { Button, TextField } from "toad.js"
import { PoseModel } from "./PoseTab"
import { Frontend_impl } from "net/Frontend_impl"

// TODO: disable/enable buttons with constraints

export function TransportBar(props: { model: PoseModel, frontend: Frontend_impl }) {
    const recorder = props.frontend.recorder
    const model = props.model
    recorder.signal.add( () => {
        if (recorder.value !== undefined) {
            recorder.value.open(props.model.videoFile.value)
            .then( size => {
                props.model.videoFile.error = undefined
                model.setSize(size)
            })
            .catch( (e) => {
                if (e instanceof Error) {
                    props.model.videoFile.error = e.message
                }
                model.setSize({fps: 24, frames: 0})
            })
        }
    } )

    return (
        <>
            <Button
                action={async () => {
                    const synth = window.speechSynthesis
                    const voice = synth.getVoices().filter((it) => it.lang.startsWith("en"))[0]

                    let countDown = props.model.delay.value
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
                            if (props.model.delay.value > 0) {
                                const utter = new SpeechSynthesisUtterance(`record`)
                                utter.voice = voice
                                synth.speak(utter)
                            }
                            // console.log(props.app.frontend._poseLandmarks?.toString())
                            recorder.value?.record() // props.model.videoFile.value)
                        }
                    }
                    schedule()
                }}
            >
                <span style={{ color: "#f00" }}>●</span>
            </Button>
            <Button action={() => props.frontend.recorder.value?.stop()}>◼︎</Button>
            {/* <Button action={() => props.app.frontend.backend?.play("video.mp4")}>▶︎</Button> */}
            <Button
                action={async () => {
                    try {
                        const size = await recorder.value?.open(props.model.videoFile.value)
                        await recorder.value?.play()
                        props.model.fps.value = size!.fps
                        props.model.frame.duration.value = size!.frames
                        
                        props.model.frame.position.max = size!.frames
                        props.model.frame.position.value = 0

                        props.model.frame.loopStart.max =  size!.frames
                        props.model.frame.loopStart.value = 0

                        props.model.frame.loopEnd.max = size!.frames
                        props.model.frame.loopEnd.value = size!.frames
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
            <Button action={() => recorder.value?.pause()}>❙ ❙</Button>
            <Button action={() => recorder.value?.seek(props.model.frame.position.value - props.model.fps.value)}>
                ◀︎◀︎
            </Button>
            <Button action={() => recorder.value?.seek(props.model.frame.position.value - 1)}>
                ❙◀︎
            </Button>
            <Button action={() => recorder.value?.seek(props.model.frame.position.value + 1)}>
                ▶︎❙
            </Button>
            <Button action={() => recorder.value?.seek(props.model.frame.position.value + props.model.fps.value)}>
                ▶︎▶︎
            </Button>
            <TextField model={props.frontend._poseLandmarksTS as any} />
        </>
    )
    //
}
