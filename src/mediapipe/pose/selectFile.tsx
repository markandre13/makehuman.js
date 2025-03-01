import { FileSystem } from "net/fs"
import { Button } from "toad.js"

export async function selectFile(fs: FileSystem | undefined) {
    if (fs === undefined) {
        return
    }
    // console.log(await fs.path())
    const dialog = (
        <dialog>
            <p>{await fs.path()}</p>
            <Button action={() => {
                dialog.close()
                dialog.remove()
            }}>Close</Button>
        </dialog>
    ) as HTMLDialogElement
    document.body.appendChild(dialog)
    dialog.showModal()
}
