import { DirectoryEntry, FileSystem } from "net/fs"
import {
    Action,
    Button,
    OptionModel,
    SelectionModel,
    Table,
    TableEditMode,
    TableModel,
    TablePos,
    text,
    TextModel,
} from "toad.js"
import { ALL } from "toad.js/model/Model"
import { TableAdapter } from "toad.js/table/adapter/TableAdapter"
import { Form } from "toad.js/view/Form"
import { FormSelect } from "toad.js/view/FormSelect"
import { FormText } from "toad.js/view/FormText"
import { FormDisplay } from "toad.js/view/FormDisplay"

class FileListModel extends TableModel {
    _data: DirectoryEntry[]
    constructor(data: DirectoryEntry[]) {
        super()
        this._data = data
    }
    override get rowCount(): number {
        return this._data.length
    }
    override get colCount(): number {
        return 4
    }
}

function filesizeToText(entry: DirectoryEntry) {
    // KiB, MiB etc. have only existed since 1998
    const size = new Number(entry.size).valueOf()
    let t: string = "?"
    if (size < 1024) {
        return `${size} B`
    }
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(1)} MB`
    }
    if (size < 1024 * 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
    }
    return `${(size / 1024 / 1024 / 1024 / 1024).toFixed(1)} TB`
}

class FileListAdapter extends TableAdapter<FileListModel> {
    private _header = ["", "Name", "Modified", "Size"]
    override getColumnHead(col: number): Node | undefined {
        return text(this._header[col])
    }
    override showCell(pos: TablePos, cell: HTMLSpanElement): void {
        switch (pos.col) {
            case 0:
                if (this.model._data[pos.row].directory) {
                    cell.appendChild(text("📁"))
                }
                break
            case 1:
                cell.appendChild(text(this.model._data[pos.row].name))
                break
            case 2:
                cell.style.textAlign = "right"
                cell.appendChild(
                    text(new Date(new Number(this.model._data[pos.row].modified).valueOf()).toLocaleString())
                )
                break
            case 3:
                if (!this.model._data[pos.row].directory) {
                    cell.style.textAlign = "right"
                    cell.appendChild(text(filesizeToText(this.model._data[pos.row])))
                }
                break
        }
    }
}

TableAdapter.register(FileListAdapter, FileListModel)

/**
 *
 * @param fs
 * @returns
 */
export async function selectFile(fs: FileSystem | undefined, filenameX: string | undefined): Promise<string | undefined> {
    return new Promise<string | undefined>(
        async (resolve: (value: string | undefined) => void, reject: (reason?: any) => void) => {
            let dialog: HTMLDialogElement | undefined
            try {
                if (fs === undefined) {
                    throw Error("Not connected to backend filesystem")
                }

                const newFolder = new Action(() => {})
                const fileFormat = new OptionModel("*.mp4", [
                    ["*.mp4", "MPEG-4"],
                    ["*", "All Files"]
                ], {
                    label: "File Format:"
                })
                const filename = new TextModel(filenameX, {label: "Save As:"})
                const path = new TextModel(await fs.path())
                const pathSelect = new OptionModel(path.value, [[path.value, ""]])
                let flag = false
                function updatePathList() {
                    if (flag) {
                        return
                    }
                    flag = true
                    let growingPath = ""
                    let pathList: string[][] = [["/", "📁 /"]]
                    for (const segment of path.value.split("/")) {
                        if (segment != "") {
                            growingPath += `/${segment}`
                            pathList.push([growingPath, `📁 ${segment}`])
                        }
                    }
                    pathList.reverse()
                    pathSelect.setMapping(pathList as any)
                    flag = false
                }
                updatePathList()
                const list = new FileListModel(await fs.list(fileFormat.value))
                const selection = new SelectionModel(TableEditMode.SELECT_ROW)
                pathSelect.signal.add(async () => {
                    // console.log(`pathSelect.signal: open \"${pathSelect.value}\"`)
                    path.value = pathSelect.value
                    await fs.path(pathSelect.value)
                    updatePathList()
                    list._data = await fs.list(fileFormat.value)
                    list.signal.emit({ type: ALL })
                })
                fileFormat.signal.add( async () => {
                    list._data = await fs.list(fileFormat.value)
                    list.signal.emit({ type: ALL })
                })
                selection.signal.add( () => {
                    const entry = list._data[selection.row]
                    if (entry.directory) {
                        return
                    }
                    filename.value = entry.name
                })
                selection.trigger.add(async () => {
                    const entry = list._data[selection.row]
                    if (entry.directory) {
                        // TODO: this is pretty ugly because of the cross-dependencies
                        await pathSelect.signal.withLockAsync(async () => {
                            await fs.down(entry.name)
                            path.value = await fs.path()
                            updatePathList()
                            pathSelect.value = path.value
                            list._data = await fs.list(fileFormat.value)
                            list.signal.emit({ type: ALL })
                        })
                    } else {
                        if (dialog) {
                            dialog.close()
                            dialog.remove()
                            resolve(`${path.value}/${entry.name}`)
                        }
                    }
                })

                dialog = (
                    <dialog autofocus={true}>
                        <Form>
                            <FormText model={filename}/>
                            <FormDisplay model={path} />
                            <FormSelect model={pathSelect} />
                        </Form>
                        <div>
                            <Table
                                style={{ width: "512px", height: "256px" }}
                                model={list}
                                selectionModel={selection}
                            />
                        </div>
                        <Form>
                            <FormSelect model={fileFormat}/>
                        </Form>

                        <Button action={newFolder}>New Folder</Button>
                        <Button
                            action={() => {
                                dialog!.close()
                                dialog!.remove()
                                resolve(undefined)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            action={() => {
                                dialog!.close()
                                dialog!.remove()
                                resolve(`${path.value}/${filename.value}`)
                            }}
                        >
                            Save
                        </Button>

                    </dialog>
                ) as HTMLDialogElement
                document.body.appendChild(dialog)
                dialog.showModal()
            } catch (e) {
                if (dialog) {
                    dialog.close()
                    dialog.remove()
                }
                console.error(e)
                reject(e)
            }
        }
    )
}
