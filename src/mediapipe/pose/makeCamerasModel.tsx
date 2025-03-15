import { Application } from "Application"
import { ConnectionState } from "net/ConnectionState"
import { VideoCamera } from "net/makehuman"
import { OptionModel } from "toad.js"

export function makeCamerasModel(app: Application) {
    const cameras = new OptionModel<VideoCamera | null>(null, [[null, "None"]], { label: "Camera" })

    app.connector.signal.add(async () => {
        if (app.connector.state === ConnectionState.CONNECTED) {
            const mapping: ([VideoCamera | null, string | number | HTMLElement] | string)[] = [[null, "None"]]
            for (const camera of await app.frontend.backend!.getVideoCameras()) {
                const name = await camera.name()
                const features = await camera.features()
                mapping.push([camera, `${name} (${features})`])
            }
            cameras.setMapping(mapping)
        }
    })
    cameras.signal.add(() => {
        // [ ] can CORBA send a nil of VideoCamera to be used instead of null?
        //     test this with OmniORB
        // [ ] extend corba.cc/corba.js to send/receive a stub
        // [ ] corba.js: drop need to register stub?
        // [ ] corba.js: add method to register impl?
        app.frontend.backend?.camera(cameras.value ? cameras.value : (null as any))
    })

    return cameras
}
