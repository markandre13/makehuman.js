import { Application } from "Application"
import { Button, TextField } from "toad.js"

// TODO: disable/enable buttons with constraints

export function TransportBar(props: { app: Application} ) {
    return (
        <>
            {/* <Select model={delay} />
            <Button
                action={async () => {
                    if (delay.value !== 0) {
                        console.log(`sleep ${delay.value}s`)
                        await sleep(delay.value * 1000)
                    }
                    props.app.frontend.backend?.record("video.mp4")
                }}
            >
                ●
            </Button> */}
            <Button action={() => props.app.frontend.backend?.stop()}>◼︎</Button>
            {/* <Button action={() => props.app.frontend.backend?.play("video.mp4")}>▶︎</Button> */}
            <Button
                action={async () => {
                    try {
                        // cp ~/freemocap_data/recording_sessions/session_2024-10-06_13_24_28/recording_13_29_02_gmt+2__drei/output_data/mediapipe_body_3d_xyz.csv .
                        await props.app.frontend.backend?.play("mediapipe_body_3d_xyz.csv")
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
