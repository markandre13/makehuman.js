import { NumberModel, Signal } from "toad.js"

function makeNumber(signal: Signal, label: string) {
    const value = new NumberModel(0, { min: -180, max: 180, step: 5, label })
    value.modified.add( () => signal.trigger() )
    return value
}

export class ChordataSettings {
    modified = new Signal()
    // 1st vector: n-pose
    X0 = makeNumber(this.modified, "X0")
    Y0 = makeNumber(this.modified, "Y0")
    Z0 = makeNumber(this.modified, "Z0")

    // 2nd vector: rotation axis
    X1 = makeNumber(this.modified, "X1")
    Y1 = makeNumber(this.modified, "Y1")
    Z1 = makeNumber(this.modified, "Z1")

    // this R should also be returned as output as long as the 2nd vector isn't modified
    R = makeNumber(this.modified, "R")
}
