import { Application } from "Application"
import { ConnectionState } from "net/ConnectionState"
import { VideoCamera } from "net/makehuman"
import { OptionModel } from "toad.js"

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
