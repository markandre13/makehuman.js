import { Application } from "Application"
import { ConnectionState } from "net/ConnectionState"
import { MediaPipeTask } from "net/makehuman"
import { OptionModel } from "toad.js"

// TODO: make this an object
export function makeMediaPipeTasksModel(app: Application) {
    const tasks = new OptionModel<MediaPipeTask | undefined>(undefined, [[undefined, "None"]], { label: "Mediapipe Task" })

    app.connector.signal.add(async () => {
        if (app.connector.state === ConnectionState.CONNECTED) {
            const mapping: ([MediaPipeTask | undefined, string | number | HTMLElement] | string)[] = [[undefined, "None"]]
            for (const camera of await app.frontend.backend!.getMediaPipeTasks()) {
                mapping.push([camera, await camera.name()])
            }
            tasks.value = await app.frontend.backend!.mediaPipeTask()
            tasks.setMapping(mapping)
        }
    })
    tasks.signal.add(() => {
        app.frontend.backend?.mediaPipeTask(tasks.value!)
    })

    return tasks
}
