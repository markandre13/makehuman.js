import { Application } from "Application"
import { ConnectionState } from "net/ConnectionState"
import { CaptureDeviceInfo, VideoCamera } from "net/makehuman"
import { ARKitFaceDevice, CaptureDevice, HolisticDevice } from "net/makehuman_stub"
import { OptionModel } from "toad.js"
// FIX in corba.js: create classes suffixed with _skel and _stub
import { ARKitFaceReceiver as ARKitFaceReceiver_skel, HolisticReceiver as HolisticReceiver_skel } from "../../net/makehuman_skel"
import { ORB } from "corba.js"

/**
 * Get list of cameras available on the backend
 * 
 * @param app 
 * @returns 
 */
export function makeCaptureDeviceModel(app: Application) {
    const devices = new OptionModel<CaptureDeviceInfo | undefined>(
        undefined,
        [[undefined, "None"]],
        { label: "Capture Device" }
    )

    let currentDevice: CaptureDevice | undefined

    app.connector.signal.add(async () => {
        const mapping: ([CaptureDeviceInfo | undefined, string | number | HTMLElement] | string)[]
            = [[undefined, "None"]]

        if (app.connector.state !== ConnectionState.CONNECTED) {
            devices.setMapping(mapping)
            devices.value = undefined
            return
        }
        for (const deviceInfo of await app.frontend.backend!.captureDevices()) {
            mapping.push([deviceInfo, deviceInfo.name])
        }
        devices.setMapping(mapping)
    })
    // update backend when camera changes
    devices.signal.add(async () => {
        // FIX in corba.ja: make setting null reference officila
        if (currentDevice instanceof ARKitFaceDevice) {
            currentDevice.receiver(undefined as any)
        }
        if (currentDevice instanceof HolisticDevice) {
            currentDevice.receiver(undefined as any)
        }

        const deviceInfo = devices.value
        if (deviceInfo === undefined) {
            return
        }
        const device = deviceInfo.device
        const orb = app.orb
        if (device instanceof ARKitFaceDevice) {
            currentDevice = device
            device.receiver(new ARKitFaceReceiver(orb, (blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint) => {
                app.blendshapeModel.set(blendshapes, transform, timestamp_ms)
            }))
        }
        if (device instanceof HolisticDevice) {
            currentDevice = device
            device.receiver(new HolisticReceiver(orb, (face: Float32Array, pose: Float32Array, lhand: Float32Array, rhand: Float32Array, timestamp_ms: bigint) => {
                app.blendshapeModel.set(face, null, timestamp_ms)
                app.poseModel.set(pose, timestamp_ms)
                app.poseModel.getXYZ(app.frontend._poseLandmarks)
                app.frontend._poseLandmarksTS.value = timestamp_ms
            }))
        }
    })

    return devices
}

class ARKitFaceReceiver extends ARKitFaceReceiver_skel {
    private _delegate: (blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint) => void
    constructor(orb: ORB, delegate: (blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint) => void) {
        super(orb)
        this._delegate = delegate
    }
    override faceLandmarks(blendshapes: Float32Array, transform: Float32Array, timestamp_ms: bigint): void {
        this._delegate(blendshapes, transform, timestamp_ms)
    }
}

class HolisticReceiver extends HolisticReceiver_skel {
    private _delegate: (face: Float32Array, pose: Float32Array, lhand: Float32Array, rhand: Float32Array, timestamp_ms: bigint) => void
    constructor(orb: ORB, delegate: (face: Float32Array, pose: Float32Array, lhand: Float32Array, rhand: Float32Array, timestamp_ms: bigint) => void) {
        super(orb)
        this._delegate = delegate
    }
    override landmarks(face: Float32Array, pose: Float32Array, lhand: Float32Array, rhand: Float32Array, timestamp_ms: bigint): void {
        // console.log(`got holistic landmarks`)
        this._delegate(face, pose, lhand, rhand, timestamp_ms)
    }
}

/**
 * Get list of cameras available on the backend
 * 
 * @param app 
 * @returns 
 */
export function makeCamerasModel(app: Application) {
    const cameras = new OptionModel<VideoCamera | undefined>(undefined, [[undefined, "None"]], { label: "Camera" })

    app.connector.signal.add(async () => {
        if (app.connector.state === ConnectionState.CONNECTED) {
            const mapping: ([VideoCamera | undefined, string | number | HTMLElement] | string)[] = [[undefined, "None"]]
            for (const camera of await app.frontend.backend!.getVideoCameras()) {
                const name = await camera.name()
                const features = await camera.features()
                mapping.push([camera, `${name} (${features})`])
            }
            const cam = await app.frontend.backend!.camera()
            if (cam) {
                console.log(`GOT CAMERA ${await cam.name()}`)
            } else {
                console.log(`GOT CAMERA undefined`)
            }
            cameras.value = cam
            cameras.setMapping(mapping)
        }
    })
    // update backend when camera changes
    cameras.signal.add(async () => {
        // [ ] can CORBA send a nil of VideoCamera to be used instead of null?
        //     test this with OmniORB
        // [ ] extend corba.cc/corba.js to send/receive a stub
        // [ ] corba.js: drop need to register stub?
        // [ ] corba.js: add method to register impl?
        console.log(`SET CAMERA ${await cameras.value?.name()}`)
        app.frontend.backend?.camera(cameras.value!)
    })

    return cameras
}
