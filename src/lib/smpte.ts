import { NumberModel } from "toad.js/model/NumberModel"
import { Converter } from "toad.js/model/Converter"
import { ValueModelOptions } from "toad.js/model/ValueModel"

export class SMPTEConverter extends Converter<string> {
    private _frame: NumberModel
    private _fps: NumberModel

    constructor(frame: NumberModel, fps: NumberModel, options?: ValueModelOptions<string>) {
        super(options)
        this._frame = frame
        this._fps = fps
    }
    override output(): string {
        return number2smpte(this._frame.value, this._fps.value)
    }
    override input(value: string): void {
        if (value.match(/^\d{0,2}:\d{0,2}:\d{0,2}:\d{0,2}$/) !== null) {
            this._frame.value = smpte2number(value, this._fps.value)
            this.error = undefined
        } else {
            this.error = "The required format is hour:minute:second:frame."
        }
    }
    increment() {
        this._frame.increment()
    }
    decrement() {
        this._frame.decrement()
    }
}

function pad(n: number) {
    return n.toString().padStart(2, "0")
}
function dap(n: string): number {
    return n.length === 0 ? 0 : parseInt(n)
}

export function number2smpte(frame: number, fps: number) {
    const f = frame % fps
    const s = Math.floor(frame / fps) % 60
    const m = Math.floor(frame / (fps * 60)) % 60
    const h = Math.floor(frame / (fps * 3600)) % 24
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
}

export function smpte2number(timecode: string, fps: number): number {
    const a = timecode.split(":")
    const h = dap(a[0])
    const m = dap(a[1])
    const s = dap(a[2])
    const f = dap(a[3])
    return f + s * fps + m * fps * 60 + h * fps * 3600
}
