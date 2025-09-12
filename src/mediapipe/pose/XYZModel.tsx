import { euler2matrix } from "gl/algorithms/euler"
import { deg2rad } from "lib/calculateNormals"
import { Model, NumberModel } from "toad.js"
import { ModelOptions } from "toad.js/model/Model"

export class XYZModel extends Model {
    x = new NumberModel(0, { label: "X", min: -190, max: 190, step: 5 });
    y = new NumberModel(0, { label: "X", min: -190, max: 190, step: 5 });
    z = new NumberModel(0, { label: "X", min: -190, max: 190, step: 5 });

    constructor(options?: ModelOptions) {
        super(options)
        const t = () => this.signal.emit()
        this.x.signal.add(t)
        this.y.signal.add(t)
        this.z.signal.add(t)
    }

    toMatrix() {
        return euler2matrix(deg2rad(this.x.value), deg2rad(this.y.value), deg2rad(this.z.value))
    }
}
