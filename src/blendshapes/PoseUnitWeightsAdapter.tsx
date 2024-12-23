import { TableAdapter, TablePos, NumberModel } from "toad.js"
import { PoseUnitWeights } from "./PoseUnitWeights"
import { CELL_CHANGED } from "toad.js/table/TableEvent"

export class PoseUnitWeightsAdapter extends TableAdapter<PoseUnitWeights> {
    override getColumnHead(col: number) {
        switch (col) {
            case 0:
                return <>Pose Unit</>
            case 1:
                return <>Weight</>
        }
    }
    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        // cell.style.padding = "1px" // DON'T: this breaks Table's layout algorithm
        switch (pos.col) {
            case 0:
                cell.innerText = this.model.getName(pos.row)
                break
            case 1:
                // cell.innerText = this.model.getWeight(pos.row).toString()
                const poseUnit = this.model.getWeight(pos.row)
                if (poseUnit.signal.count() == 0) {
                    poseUnit.signal.add(
                        () => this.model.signal.emit({type: CELL_CHANGED, col: pos.col, row: pos.row})
                        // ALSO
                        // o accumulate MHFacePoseUnits and copy them to BlendshapeConverter
                        // source
                        //   this.model has the weights
                        //   MHFacePoseUnits has the quads for each weight
                        // destination
                        //   MHFaceBlendshapes
                        // algorithm
                        //   BlendshapeConverter combines BlendshapeModel, MHFaceBlendshapes
                        //   and copies it to the polygon
                    )
                }
                cell.style.width = "50px"
                cell.style.textAlign = "right"
                cell.innerText = poseUnit.value.toString()
                // const model = this.model.poseUnits[pos.row]
                poseUnit.applyStyle(cell)
                cell.onwheel = (event: WheelEvent) => {
                    PoseUnitWeightsAdapter.wheel(poseUnit, event)
                }
                cell.ondblclick = () => poseUnit.resetToDefault()
                // cell.onpointerenter = () => poseUnit.focus(true)
                // cell.onpointerleave = () => poseUnit.focus(false)
                break
        }
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
    override saveCell(pos: TablePos, cell: HTMLSpanElement): void {
        switch (pos.col) {
            case 1:
                this.model.getWeight(pos.row).value = parseFloat(cell.innerText)
                break
        }
    }
}
