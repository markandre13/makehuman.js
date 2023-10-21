import { NumberModel, TableAdapter, TablePos } from "toad.js"
import { PoseModel } from "pose/PoseModel"

export class PoseUnitsAdapter extends TableAdapter<PoseModel> {
    constructor(model: PoseModel) {
        super(model)
        // this.config.editMode = EditMode.EDIT_ON_ENTER
    }
    override get colCount(): number {
        return 6
    }
    override getColumnHead(col: number) {
        switch (col) {
            case 0:
                return <>Pose Unit</>
            case 2:
                return <>Bone</>
            case 3:
                return <>X</>
            case 4:
                return <>Y</>
            case 5:
                return <>Z</>
        }
        return <>Value</>
    }

    protected static wheel(model: NumberModel, e: WheelEvent) {
        // console.log(`wheel event for model ${model.label}`)
        e.preventDefault()
        if (e.deltaY > 0) {
            model.decrement()
        }
        if (e.deltaY < 0) {
            model.increment()
        }
    }

    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        // cell.style.padding = "1px" // DON'T: this breaks Table's layout algorithm
        switch (pos.col) {
            case 0:
                if (pos.row < this.model.poseUnits.length) {
                    cell.innerText = this.model.poseUnits[pos.row].label!
                }
                break
            case 1:
                if (pos.row < this.model.poseUnits.length) {
                    const poseUnit = this.model.poseUnits[pos.row]
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    cell.innerText = poseUnit.value.toString()
                    const model = this.model.poseUnits[pos.row]
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => PoseUnitsAdapter.wheel(this.model.poseUnits[pos.row], event)
                    cell.ondblclick = () => model.resetToDefault()
                    cell.onpointerenter = () => model.focus(true)
                    cell.onpointerleave = () => model.focus(false)
                }
                break
            case 2:
                if (pos.row < this.model.bone.length) {
                    const label = this.model.bone[pos.row].x.label
                    if (label !== undefined) {
                        cell.innerText = label
                    }
                }
                break
            case 3:
                if (pos.row < this.model.bone.length) {
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    const model = this.model.bone[pos.row].x
                    cell.innerText = model.value.toString()
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => PoseUnitsAdapter.wheel(model, event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
            case 4:
                if (pos.row < this.model.bone.length) {
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    const model = this.model.bone[pos.row].y
                    cell.innerText = model.value.toString()
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => PoseUnitsAdapter.wheel(model, event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
            case 5:
                if (pos.row < this.model.bone.length) {
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    const model = this.model.bone[pos.row].z
                    cell.innerText = model.value.toString()
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => PoseUnitsAdapter.wheel(model, event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
        }
    }
    // override editCell(pos: TablePos, cell: HTMLSpanElement): void {
    // }
    override saveCell(pos: TablePos, cell: HTMLSpanElement): void {
        switch (pos.col) {
            case 1:
                this.model.poseUnits[pos.row].value = parseFloat(cell.innerText)
                break
            case 3:
                // console.log(
                //     `saveCell ${pos.col}, ${pos.row}, x from ${this.model.bone[pos.row].x.value} to ${parseFloat(
                //         cell.innerText
                //     )})`
                // )
                this.model.bone[pos.row].x.value = parseFloat(cell.innerText)
                break
            case 4:
                // console.log(
                //     `saveCell ${pos.col}, ${pos.row}, y from ${this.model.bone[pos.row].y.value} to ${parseFloat(
                //         cell.innerText
                //     )})`
                // )
                this.model.bone[pos.row].y.value = parseFloat(cell.innerText)
                break
            case 5:
                // console.log(
                //     `saveCell ${pos.col}, ${pos.row}, z from ${this.model.bone[pos.row].z.value} to ${parseFloat(
                //         cell.innerText
                //     )})`
                // )
                this.model.bone[pos.row].z.value = parseFloat(cell.innerText)
                break
        }
    }
}
