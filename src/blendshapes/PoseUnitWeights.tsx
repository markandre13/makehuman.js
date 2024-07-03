import { TableModel, NumberModel } from "toad.js"
import { MHFacePoseUnits } from "./MHFacePoseUnits"

export interface PoseUnitWeight {
    name: string
    weight: NumberModel
}

export class PoseUnitWeights extends TableModel {
    private facePoseUnits: PoseUnitWeight[]

    constructor(facePoseUnits: MHFacePoseUnits) {
        super()
        this.facePoseUnits = Array.from(facePoseUnits.blendshape2bone, ([name, weight]) => ({
            name,
            weight: new NumberModel(0, {
                min: 0,
                max: 1,
                step: 0.01,
                label: name,
            }),
        }))
    }
    get colCount(): number {
        return 2
    }
    get rowCount(): number {
        return this.facePoseUnits.length
    }
    getName(row: number): string {
        return this.facePoseUnits[row].name
    }
    getWeight(row: number | string): NumberModel {
        if (typeof row === "string") {
            for (let i = 0; i < this.facePoseUnits.length; ++i) {
                if (this.facePoseUnits[i].name === row) {
                    row = i
                    break
                }
            }
        }
        if (typeof row === "string") {
            throw Error(`${this.constructor.name}: no weight name '${row}'`)
        }
        return this.facePoseUnits[row].weight
    }
    reset() {
        this.facePoseUnits.forEach(m => m.weight.value = 0)
    }
    forEach(callbackfn: (value: PoseUnitWeight) => void) {
        this.facePoseUnits.forEach(callbackfn)
    }
}
