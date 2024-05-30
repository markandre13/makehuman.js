import { expect, use } from "@esm-bundle/chai"
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { blendshapeDescriptions } from "../../src/BlendShapeTab"
import { blendshapeNames } from "../../src/mediapipe/blendshapeNames"

describe("blendshape", function () {
    it("we have descriptions for all 52 blendshapes", function () {
        let count = 0
        let countWithoutSymmetry = 0
        const x = new Set(blendshapeNames)
        x.add("tongueOut")
        for (const d of blendshapeDescriptions) {
            let pattern = [d.pattern]
            let bracketOpen = d.pattern.indexOf("(")
            if (bracketOpen != -1) {
                let bracketClose = d.pattern.indexOf(")", bracketOpen)
                let prefix = d.pattern.substring(0, bracketOpen)
                // console.log(d.pattern)
                pattern = d.pattern
                    .substring(bracketOpen + 1, bracketClose)
                    .split("|")
                    .map((variant) => `${prefix}${variant}`)
            }
            countWithoutSymmetry += pattern.length
            if (d.symmetric === true) {
                pattern = pattern.flatMap((pattern) => [`${pattern}Left`, `${pattern}Right`])
            }
            for (const p of pattern) {
                if (x.has(p)) {
                    // console.log(`found ${p}`)
                    ++count
                }
            }
        }
        console.log(`found ${count} blendshapes out of ${blendshapeNames.length} (${countWithoutSymmetry} without left/right variants)`)
        expect(count).to.equal(52)
    })
    it("we have descriptions for all face bones", function() {
        // temporalis01.(L|R) x more brow up/down
        // but i'm not sure on how to rotate them, post units seem the way to go
    })
})
