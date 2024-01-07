import { vec3 } from "gl-matrix"
import { BooleanModel, NumberModel, Signal } from "toad.js"
import { ModelReason } from "toad.js/model/Model"
import { NumberModelReason } from "toad.js/model/NumberModel"
import { ValueModel, ValueModelReason } from "toad.js/model/ValueModel"

function makeNumber(signal: Signal, label: string) {
    const value = new NumberModel(0, { min: -180, max: 180, step: 5, label })
    value.modified.add( () => signal.trigger() )
    return value
}

export class Rot3Model extends ValueModel<vec3, NumberModelReason> {
    x: NumberModel
    y: NumberModel
    z: NumberModel

    constructor(value: vec3 = vec3.create()) {
        super(value)
        this.x = new NumberModel(value[0], { min: -180, max: 180, step: 1 })
        this.y = new NumberModel(value[0], { min: -180, max: 180, step: 1 })
        this.z = new NumberModel(value[0], { min: -180, max: 180, step: 1 })
        this.x.modified.add( (reason) => {
            this._value[0] = this.x.value
            this.modified.trigger(reason)
        })
        this.y.modified.add( (reason) => {
            this._value[1] = this.y.value
            this.modified.trigger(reason)
        })
        this.z.modified.add( (reason) => {
            this._value[2] = this.z.value
            this.modified.trigger(reason)
        })
    }
}

export class ChordataSettings {
    modified = new Signal()
    v0 = new Rot3Model()
    v1 = new Rot3Model()

    constructor() {
        this.mountKCeptorView.modified.add( () => this.modified.trigger() )
        this.v0.modified.add( () => this.modified.trigger() )
        this.v1.modified.add( () => this.modified.trigger() )
    }
    mountKCeptorView = new BooleanModel(true, {
        label: "Mount KCeptor View"
    })

    // // 1st vector for playing
    // X0 = makeNumber(this.modified, "X0")
    // Y0 = makeNumber(this.modified, "Y0")
    // Z0 = makeNumber(this.modified, "Z0")

    // // 2nd vector for playing
    // X1 = makeNumber(this.modified, "X1")
    // Y1 = makeNumber(this.modified, "Y1")
    // Z1 = makeNumber(this.modified, "Z1")
}
