import { Application } from "Application"
import { ConnectionState } from "net/ConnectionState"
import { MediaPipeTask } from "net/makehuman"
import { OptionModel } from "toad.js"

// TODO: make this an object
export function makeMediaPipeTasksModel(app: Application) {
    const tasks = new OptionModel<MediaPipeTask | null>(null, [[null, "None"]], { label: "Mediapipe Task" })

    app.connector.signal.add(async () => {
        if (app.connector.state === ConnectionState.CONNECTED) {
            const mapping: ([MediaPipeTask | null, string | number | HTMLElement] | string)[] = [[null, "None"]]
            for (const camera of await app.frontend.backend!.getMediaPipeTasks()) {
                mapping.push([camera, await camera.name()])
            }
            tasks.setMapping(mapping)
        }
    })
    tasks.signal.add(() => {
        app.frontend.backend?.mediaPipeTask(tasks.value ? tasks.value : (null as any))
    })

    return tasks
}
