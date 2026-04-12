import { ORB } from "corba.js"
import { Backend, Recorder } from "net/makehuman"
import { FileSystem } from "net/fs"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { UpdateManager } from "UpdateManager"
import { handleChordata } from "chordata/chordata"
import { ValueModel } from "toad.js/appkit/ValueModel"

export class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager

    backend?: Backend
    filesystem?: FileSystem
    recorder = new ValueModel<Recorder | undefined>(undefined)

    constructor(orb: ORB, updateManager: UpdateManager) {
        super(orb)
        this.updateManager = updateManager
        // this.blendshapeModel = blendshapeModel
    }

    /*
     *
     */
    override chordata(data: Uint8Array): void {
        // console.log(`got ${data.length} byte chordata packet`)
        handleChordata(this.updateManager, data)
    }

    /*
     * blendshapes
     */

    // data received from mediapipe/freemocap
    _poseLandmarksTS = new ValueModel<bigint>(0n)
    _poseLandmarks = new Float32Array(3 * 33)

    frameHandler?: (frame: number) => void
    override frame(frame: number): void {
        // console.log(`at frame ${frame}`)
        if (this.frameHandler) {
            this.frameHandler(frame)
        }
    }
}
