import { OptionModel } from "toad.js/appkit/OptionModel"

export class RemoteOptionModel<V> extends OptionModel<V> {
    protected _callback?: (value: V) => void

    // sets a callback to be called when the view changes the model's value
    callback(cb: (value: V) => void) {
        this._callback = cb
        return this
    }
    // instead of setting the value, invoke the callback
    override set value(value: V) {
        if (this._callback) this._callback(value)
    }
    // actually set the model's value
    setLocalValue(value: V) {
        super.value = value
    }
    override get value(): V {
        return super.value
    }
}
