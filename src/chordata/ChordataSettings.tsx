import { vec3 } from "gl-matrix"
import { BooleanModel, NumberModel, Signal } from "toad.js"
import { NumberModelEvent } from "toad.js/model/NumberModel"
import { ValueModel } from "toad.js/model/ValueModel"

export class Rot3Model extends ValueModel<vec3, NumberModelEvent> {
    x: NumberModel
    y: NumberModel
    z: NumberModel

    constructor(value: vec3 = vec3.create()) {
        super(value)
        this.x = new NumberModel(value[0], { min: -180, max: 180, step: 5 })
        this.y = new NumberModel(value[0], { min: -180, max: 180, step: 5 })
        this.z = new NumberModel(value[0], { min: -180, max: 180, step: 5 })
        this.x.signal.add( (event) => {
            this._value[0] = this.x.value
            this.signal.emit(event)
        })
        this.y.signal.add( (event) => {
            this._value[1] = this.y.value
            this.signal.emit(event)
        })
        this.z.signal.add( (event) => {
            this._value[2] = this.z.value
            this.signal.emit(event)
        })
    }
}

export class ChordataSettings {
    modified = new Signal()
    v0 = new Rot3Model()
    v1 = new Rot3Model()

    constructor() {
        this.mountKCeptorView.signal.add( () => this.modified.emit() )
        this.v0.signal.add( () => this.modified.emit() )
        this.v1.signal.add( () => this.modified.emit() )
    }
    mountKCeptorView = new BooleanModel(false, {
        label: "Mount KCeptor View"
    })
}
