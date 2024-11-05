import { ORB } from "corba.js"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { UpdateManager } from "UpdateManager"
import { handleChordata } from "chordata/chordata"
import { BlendshapeModel } from "blendshapes/BlendshapeModel"
import { ValueModel } from "toad.js/model/ValueModel"

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
    _poseLandmarksTS = new ValueModel<bigint>(0n)
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
        // console.log(`got ${landmarks.length/3} pose landmarks, ${timestamp_ms}`)
        this._poseLandmarksTS.value = timestamp_ms
        this._poseLandmarks = landmarks
        // this._poseLandmarks = new Float32Array([-0.05444538965821266,0.5843923687934875,-0.4017029404640198,-0.04837760329246521,0.6226963400840759,-0.3835975229740143,-0.048121578991413116,0.6233853697776794,-0.3826240599155426,-0.04825654625892639,0.62364661693573,-0.38286760449409485,-0.08280907571315765,0.6161634922027588,-0.3843705356121063,-0.08274146914482117,0.6172120571136475,-0.3853762745857239,-0.08293389528989792,0.6186450719833374,-0.38422155380249023,0.005591020919382572,0.6077694296836853,-0.2671165466308594,-0.15272338688373566,0.5910553336143494,-0.281982421875,-0.028640534728765488,0.5599640607833862,-0.36089393496513367,-0.07467781752347946,0.5529961585998535,-0.3624519109725952,0.11460952460765839,0.43366044759750366,-0.19282573461532593,-0.23383750021457672,0.4124651253223419,-0.19728097319602966,0.232789546251297,0.23265662789344788,-0.20430104434490204,-0.3754805326461792,0.21876110136508942,-0.15696142613887787,0.4368691146373749,0.10028745234012604,-0.33116215467453003,-0.5366091728210449,0.05696064233779907,-0.23954486846923828,0.4970359802246094,0.06006837636232376,-0.3483470380306244,-0.5726102590560913,0.014595214277505875,-0.24370411038398743,0.5017258524894714,0.04950638860464096,-0.391898512840271,-0.5807675123214722,0.014078264124691486,-0.2847936749458313,0.44656944274902344,0.08483090996742249,-0.3496783375740051,-0.5398472547531128,0.04453645274043083,-0.25860315561294556,0.11389575153589249,0.035584039986133575,-0.0009873961098492146,-0.1142619326710701,-0.03526582568883896,0.0023019711952656507,0.165690615773201,-0.18784476816654205,-0.2664419114589691,-0.03401929512619972,-0.45629072189331055,-0.005514279007911682,0.36787930130958557,-0.4015267491340637,-0.057578425854444504,0.06245799362659454,-0.7947062253952026,0.15971048176288605,0.3977266550064087,-0.4334146976470947,-0.044094327837228775,0.07381922751665115,-0.8411786556243896,0.16616804897785187,0.4216490089893341,-0.5181266069412231,-0.15017837285995483,0.03076537325978279,-0.9151288270950317,0.04624907672405243])
        // flip y-axis

        // adjustments for free mocap
        const s = 0.01
        for (let i = 0; i < landmarks.length; i += 3) {
            [landmarks[i], landmarks[i + 1], landmarks[i + 2]] = [landmarks[i] * s, landmarks[i + 2] * s, -landmarks[i + 1] * s];
        }

        // adjustments for mediapipe
        // for(let i = 1; i < landmarks.length ; i += 3) {
        //     landmarks[i] = -landmarks[i]
        // }
        // console.log(`nose: ${landmarks[0]}, ${landmarks[1]}, ${landmarks[2]}`)
        this.updateManager.invalidateView()
    }
}
