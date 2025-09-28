import { Application } from "Application"
import { SMPTEConverter } from "lib/smpte"
import { VideoCamera, MediaPipeTask, VideoSize } from "net/makehuman"
import { OptionModel, TextModel, BooleanModel } from "toad.js"
import { IntegerModel } from "toad.js/model/IntegerModel"
import { makeCamerasModel } from "./makeCamerasModel"
import { makeMediaPipeTasksModel } from "./makeMediaPipeTasksModel"

export class PoseModel {
    // animation sources
    body: OptionModel<undefined | number>
    face: OptionModel<undefined | number>
    hand: OptionModel<undefined | number>
    // body: none, mediapipe, freemocap, chordata
    // face: none, mediapipe, facelink
    // hand: none, mediapipe

    // mediapipe configuration
    camera: OptionModel<VideoCamera | undefined>
    mediaPipeTask: OptionModel<MediaPipeTask | undefined> // face, pose, hand, holistic

    // configure record/playback
    videoFile: TextModel
    newFile: BooleanModel
    delay: OptionModel<number>

    frame: {
        duration: IntegerModel
        position: IntegerModel
        loopStart: IntegerModel
        loopEnd: IntegerModel
    }
    timecode: {
        duration: SMPTEConverter
        position: SMPTEConverter
        loopStart: SMPTEConverter
        loopEnd: SMPTEConverter
    }
    fps: IntegerModel

    constructor(app: Application) {
        this.body = new OptionModel(undefined, [[undefined, "None"], [0, "Mediapipe"], [1, "FreeMoCap"], [2, "Chordata"]], {
            label: "Body"
        })
        this.face = new OptionModel(undefined, [[undefined, "None"], [0, "Mediapipe"], [2, "Live Link Face"]], {
            label: "Face"
        })
        this.hand = new OptionModel(undefined, [[undefined, "None"], [0, "Mediapipe"]], {
            label: "Hand"
        })
        this.camera = makeCamerasModel(app)
        this.mediaPipeTask = makeMediaPipeTasksModel(app)
        this.videoFile = new TextModel("video.mp4", { label: "Filename" })
        this.newFile = new BooleanModel(true, {
            label: "Timestamp",
            description: "Create new files by appending a timestamp to the file name.",
        })
        this.delay = new OptionModel(
            0,
            [
                [0, "None"],
                [5, "5s"],
                [10, "10s"],
            ],
            {
                label: "Timer",
                description: "Delay between pressing Record button and actual recording.",
            }
        )
        this.frame = {
            duration: new IntegerModel(0, { label: "Duration" }),
            position: new IntegerModel(0, { label: "Position", step: 1, min: 0 }),
            loopStart: new IntegerModel(0, { label: "Loop Start", step: 1, min: 0, max: 0 }),
            loopEnd: new IntegerModel(0, { label: "Loop End", step: 1, min: 0, max: 0 }),
        }
        this.fps = new IntegerModel(24, { label: "fps", step: 1, min: 1 })

        this.timecode = {
            duration: new SMPTEConverter(this.frame.duration, this.fps, { label: "Duration" }),
            position: new SMPTEConverter(this.frame.position, this.fps, { label: "Position" }),
            loopStart: new SMPTEConverter(this.frame.loopStart, this.fps, { label: "Loop Start" }),
            loopEnd: new SMPTEConverter(this.frame.loopEnd, this.fps, { label: "Loop End" }),
        }
        this.frame.position.signal.add(() => {
            if (app.frontend.recorder) {
                app.frontend.recorder.value?.seek(this.frame.position.value)
            }
        })
        // recorder.value?.seek(props.model.frame.position.value - props.model.fps.value)
        app.frontend.frameHandler = (frame) => {
            this.frame.position.value = frame
        }
    }

    setSize(size: VideoSize) {
        this.fps.value = size.fps

        this.frame.position.max = size.frames
        this.frame.position.value = 0

        this.frame.loopStart.max = size.frames
        this.frame.loopStart.value = 0

        this.frame.loopEnd.max = size.frames
        this.frame.loopEnd.value = size.frames

        this.frame.duration.value = size.frames
    }
}
