import { NumberModel } from "toad.js/model/NumberModel"
import { Convert } from "toad.js/model/Computed"

export class SMPTEConverter extends Convert<string> {
    constructor(frame: NumberModel, fps: NumberModel) {
        const _frame = new WeakRef(frame)
        const _fps = new WeakRef(fps)
        super(
            (v: string) => {
                const frame = _frame.deref()
                const fps = _fps.deref()
                if(frame  && fps) {
                    frame.value = smpte2number(v, fps.value)
                }
            },
            () => {
                const frame = _frame.deref()
                const fps = _fps.deref()
                if(frame  && fps) {
                    return number2smpte(frame.value, fps.value)
                } else {
                    return "00:00:00:00"
                }
            }
        )
    }
}

function pad(n: number) {
    return n.toString().padStart(2, "0")
}

export function number2smpte(frame: number, fps: number) {
    const f = frame % fps
    const s = Math.floor(frame / fps) % 60
    const m = Math.floor(frame / (fps * 60)) % 60
    const h = Math.floor(frame / (fps * 3600)) % 24
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
}

export function smpte2number(timecode: string, fps: number): number {
    const a = timecode.split(':')
    const h = parseInt(a[0])
    const m = parseInt(a[1])
    const s = parseInt(a[2])
    const f = parseInt(a[3])
    return f + s * fps + m * fps * 60 + h * fps * 3600
}
