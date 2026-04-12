import { Application } from "Application"
import { SMPTEConverter } from "lib/smpte"
import { VideoCamera, MediaPipeTask, VideoSize, CaptureDeviceInfo } from "net/makehuman"
import { IntegerModel } from "toad.js/appkit/IntegerModel"
import { makeCamerasModel, makeCaptureDeviceModel } from "./makeCaptureDeviceModel"
import { OptionModel } from "toad.js/appkit/OptionModel"
import { TextModel } from "toad.js/appkit/TextModel"
import { BooleanModel } from "toad.js/appkit/BooleanModel"

export class PoseModel {
    // animation sources
    device: OptionModel<undefined | CaptureDeviceInfo>
    // body: none, mediapipe, freemocap, chordata
    // face: none, mediapipe, facelink
    // hand: none, mediapipe

    // mediapipe configuration
    camera: OptionModel<VideoCamera | undefined>

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
        this.device = makeCaptureDeviceModel(app)
        this.camera = makeCamerasModel(app)
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
