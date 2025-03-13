import { expect } from "chai"
import { NumberModel } from "toad.js"
import { number2smpte, smpte2number, SMPTEConverter } from "../../src/lib/smpte"

describe("SMPTE", () => {
    it("class SMPTEConverter", () => {
        const frame = new NumberModel(89356)
        const fps = new NumberModel(24)

        const timecode = new SMPTEConverter(frame, fps)

        // out
        expect(timecode.value).to.equal("01:02:03:04")

        // in
        timecode.value = "04:03:02:01"
        expect(frame.value).to.equal(349969)
    })

    it("number2smpte(frame: number, fps: number): string", () => {
        expect(number2smpte(0, 24)).to.equal("00:00:00:00")
        expect(number2smpte(1, 24)).to.equal("00:00:00:01")
        expect(number2smpte(24, 24)).to.equal("00:00:01:00")
        expect(number2smpte(24 * 60, 24)).to.equal("00:01:00:00")
        expect(number2smpte(24 * 3600, 24)).to.equal("01:00:00:00")
    })
    it("smpte2number(timecode: string, fps: number): number", () => {
        expect(smpte2number("01:02:03:04", 24)).to.equal(89356)
    })
})
