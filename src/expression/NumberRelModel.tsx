import { NumberModel } from "toad.js"
import { NumberModelOptions } from "toad.js/model/NumberModel"

export class NumberRelModel extends NumberModel {
    constructor(value: number, options?: NumberModelOptions) {
        super(value, options)
        this.change = this.change.bind(this)
    }

    protected observed: NumberModel[] = [];

    // note: relations can change at runtime
    observe(model: NumberModel) {
        this.observed.push(model)
        model.modified.add(this.change, this)
    }
    clear() {
        this.observed.forEach((it) => it.modified.remove(this))
        this.observed.length = 0
    }
    change() {
        let changed = false
        for (let observed of this.observed) {
            if (observed.value !== observed.default) {
                changed = true
                break
            }
        }
        if (changed) {
            this.color = "italic"
        } else {
            if (this.value === this.default) {
                // this.color = ""
                this.color = "bold"
            } else {
                // this.color = "#999"
                this.color = ""
            }
        }
    }

    override set value(value: number | string) {
        if (this._value === value) {
            return
        }
        super.value = value
        this.change()
    }
    override get value(): number {
        return super.value
    }
}
