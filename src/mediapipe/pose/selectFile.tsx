import { DirectoryEntry, FileSystem } from "net/fs"
import { Button, Display, SelectionModel, Table, TableEditMode, TableModel, TablePos, text, TextModel } from "toad.js"
import { ALL } from "toad.js/model/Model"
import { TableAdapter } from "toad.js/table/adapter/TableAdapter"

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
                    cell.appendChild(text(">"))
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
export async function selectFile(fs: FileSystem | undefined): Promise<string | undefined> {
    return new Promise<string | undefined>(
        async (resolve: (value: string | undefined) => void, reject: (reason?: any) => void) => {
            let dialog: HTMLDialogElement | undefined
            try {
                if (fs === undefined) {
                    throw Error("Not connected to backend filesystem")
                }

                const path = new TextModel(await fs.path())
                const list = new FileListModel(await fs.list())
                const selection = new SelectionModel(TableEditMode.SELECT_ROW)

                dialog = (
                    <dialog>
                        <p>
                            <Display model={path} />
                        </p>
                        <div>
                            <Table
                                style={{ color: "#fff", width: "512px", height: "256px" }}
                                model={list}
                                selectionModel={selection}
                            />
                        </div>
                        <Button
                            action={async () => {
                                await fs.up()
                                path.value = await fs.path()
                                list._data = await fs.list()
                                list.signal.emit({ type: ALL })
                            }}
                        >
                            Up
                        </Button>
                        <Button
                            action={() => {
                                dialog!.close()
                                dialog!.remove()
                            }}
                        >
                            Close
                        </Button>
                    </dialog>
                ) as HTMLDialogElement

                selection.trigger.add(async () => {
                    const entry = list._data[selection.row]
                    if (entry.directory) {
                        await fs.down(entry.name)
                        path.value = await fs.path()
                        list._data = await fs.list()
                        list.signal.emit({ type: ALL })
                    } else {
                        if (dialog) {
                            dialog.close()
                            dialog.remove()
                            resolve(`${path.value}/${entry.name}`)
                        }
                    }
                })
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
