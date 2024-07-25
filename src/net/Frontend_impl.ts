import { ORB } from "corba.js"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { UpdateManager } from "UpdateManager"
import { handleChordata } from "chordata/chordata"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"

export class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager
    blendshapeModel: BlendshapeModel

    backend?: Backend

    constructor(orb: ORB, updateManager: UpdateManager, blendshapeModel: BlendshapeModel) {
        super(orb)
        this.updateManager = updateManager
        this.blendshapeModel = blendshapeModel
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

    // // data received from mediapipe
    landmarks?: Float32Array
    _poseLandmarks?: Float32Array

    // list of blendshape names that will be send to faceLandmarks()
    override faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        this.blendshapeModel.setBlendshapeNames(faceBlendshapeNames)
    }

    override faceLandmarks(
        landmarks: Float32Array,
        blendshapes: Float32Array,
        transform: Float32Array,
        timestamp_ms: bigint
    ): void {
        this.landmarks = landmarks
        this.updateManager.invalidateView()
        this.blendshapeModel.setBlendshapeWeights(blendshapes, transform)
    }

    override poseLandmarks(landmarks: Float32Array, timestamp_ms: bigint): void {
        console.log(`got ${landmarks.length/3} pose landmarks`)
        this._poseLandmarks = landmarks
        for(let i = 1; i < landmarks.length ; ++i) {
            landmarks[i] = -landmarks[i]
        }
        this.updateManager.invalidateView()
    }
}
