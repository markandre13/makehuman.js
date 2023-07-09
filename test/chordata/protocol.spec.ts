// Chordata Open Pose Protocol (COPP), based on Open Sound Control protocol
// https://chordata.cc/blog/the-new-chordata-api-a-detailed-explanation/#open-pose
// https://opensoundcontrol.stanford.edu/spec-1_0.html
// * atomic types
//   * numbers are big-endian
//   * padding is 0-3 zeros
//   * 'i' int32
//   * 'f' float32
//   * 't' timetag 64bit
//   * 's' string: null terminated, padding
//   * 'b' blob: size: int32, data, padding
// * packet
//   * sender is 'client', receiver is 'server'
//   * int32, data, padding
// * message
//   * address pattern, type tag string, arguments*
//   * address pattern := string beginning with '/'
//   * type tag string := string beginning with ',' followed by types
//   *
// * bundle
//   * string '#bundle', time tag, bundle element*
//   *

import { expect, use } from "@esm-bundle/chai"
import { chaiAlmost } from "../chai/chaiAlmost"
import { COOPDecoder } from "../../src/chordata/COOPDecoder"
use(chaiAlmost())

describe("chordata", function () {
    it("decode()", function () {
        const data = fromHexdump(message)
        const decoder = new COOPDecoder(data)
        const bones = decoder.decode()

        const e = new Map<string, number[]>([
            ["/%/kc_0x42branch6", [-0.0116586, 0.351683, 0.928858, -0.115784]],
            ["/%/kc_0x41branch6", [-0.0157049, 0.612659, 0.789144, -0.0406618]],
            ["/%/kc_0x40branch6", [-0.0206191, 0.282804, 0.95885, -0.0142731]],
            ["/%/kc_0x42branch5", [-0.437385, 0.408202, 0.547886, -0.584711]],
            ["/%/kc_0x41branch5", [-0.740224, -0.437169, 0.169961, -0.481731]],
            ["/%/kc_0x40branch5", [-0.281567, -0.781, 0.219733, -0.512325]],
            ["/%/kc_0x42branch4", [-0.0397931, 0.449987, 0.892107, 0.00862156]],
            ["/%/kc_0x41branch4", [-0.0155865, 0.737169, 0.674928, -0.0285038]],
            ["/%/kc_0x40branch4", [-0.0438127, 0.157583, 0.98258, -0.088229]],
            ["/%/kc_0x42branch3", [0.0170646, 0.948076, 0.313278, 0.0521385]],
            ["/%/kc_0x41branch3", [0.0807505, 0.524097, 0.358437, -0.768326]],
            ["/%/kc_0x40branch3", [-0.0202535, 0.48423, 0.462811, -0.742238]],
            ["/%/kc_0x42branch1", [0.113668, 0.315253, 0.921183, -0.197781]],
            ["/%/kc_0x41branch1", [-0.392768, -0.498948, 0.532651, -0.559524]],
            ["/%/kc_0x40branch1", [-0.428276, -0.163105, 0.552124, -0.696517]],
        ]);
        expect(bones).to.deep.almost.equal(e)
    })

    it("s(), t(), i(), f()", function () {
        const data = fromHexdump(message)
        const decoder = new COOPDecoder(data)
        expect(decoder.s()).to.equal("#bundle")
        expect(decoder.offset).to.equal(8)

        const timetag = decoder.t()
        expect(timetag).to.deep.equal({ epoch: 9487430, fraction: 0 })
        expect(decoder.offset).to.equal(16)

        // 1st bundle
        expect(decoder.i()).to.equal(20)
        expect(decoder.offset).to.equal(20)

        expect(decoder.s()).to.equal("/%%/Chordata/q")
        expect(decoder.s()).to.equal(",N")
        expect(decoder.offset).to.equal(40)

        // 2nd bundle
        expect(decoder.i()).to.equal(44)
        expect(decoder.s()).to.equal("/%/kc_0x42branch6")
        expect(decoder.s()).to.equal(",ffff")
        expect(decoder.f()).to.almost.equal(-0.0116586)
        expect(decoder.f()).to.almost.equal(0.351683)
        expect(decoder.f()).to.almost.equal(0.928858)
        expect(decoder.f()).to.almost.equal(-0.115784)
    })
})

function fromHexdump(dump: string) {
    const buffer = dump.split("\n")
    const x: number[] = []
    while (true) {
        const line = buffer.shift()
        // console.log(`line: ${line}`)
        if (line === undefined) {
            break
        }
        // if (line.charCodeAt(0) < 0x30 || 0x39 < line.charCodeAt(0)) {
        //     buffer.unshift(line)
        //     break
        // }
        for (let i = 0; i < 16; ++i) {
            const offset = 0 + i * 3
            const byte = parseInt(line.substring(offset, offset + 2), 16)
            if (Number.isNaN(byte)) {
                break
            }
            // console.log(byte.toString(16))
            x.push(byte)
        }
    }
    return new Uint8Array(x).buffer
}

const message = `23 62 75 6e 64 6c 65 00 00 00 00 00 00 90 c4 46 #bundle........F
00 00 00 14 2f 25 25 2f 43 68 6f 72 64 61 74 61 ..../%%/Chordata
2f 71 00 00 2c 4e 00 00 00 00 00 2c 2f 25 2f 6b /q..,N.....,/%/k
63 5f 30 78 34 32 62 72 61 6e 63 68 36 00 00 00 c_0x42branch6...
2c 66 66 66 66 00 00 00 bc 3f 03 c0 3e b4 0f d1 ,ffff....?..>...
3f 6d c9 a4 bd ed 20 43 00 00 00 2c 2f 25 2f 6b ?m.... C...,/%/k
63 5f 30 78 34 31 62 72 61 6e 63 68 36 00 00 00 c_0x41branch6...
2c 66 66 66 66 00 00 00 bc 80 a7 a8 3f 1c d7 3e ,ffff.......?..>
3f 4a 05 5b bd 26 8d 06 00 00 00 2c 2f 25 2f 6b ?J.[.&.....,/%/k
63 5f 30 78 34 30 62 72 61 6e 63 68 36 00 00 00 c_0x40branch6...
2c 66 66 66 66 00 00 00 bc a8 e9 50 3e 90 cb a4 ,ffff......P>...
3f 75 77 32 bc 69 d9 d4 00 00 00 2c 2f 25 2f 6b ?uw2.i.....,/%/k
63 5f 30 78 34 32 62 72 61 6e 63 68 35 00 00 00 c_0x42branch5...
2c 66 66 66 66 00 00 00 be df f0 e8 3e d0 ff d2 ,ffff.......>...
3f 0c 42 3f bf 15 af a0 00 00 00 2c 2f 25 2f 6b ?.B?.......,/%/k
63 5f 30 78 34 31 62 72 61 6e 63 68 35 00 00 00 c_0x41branch5...
2c 66 66 66 66 00 00 00 bf 3d 7f 5a be df d4 90 ,ffff....=Z....
3e 2e 0a 5b be f6 a5 69 00 00 00 2c 2f 25 2f 6b >..[...i...,/%/k
63 5f 30 78 34 30 62 72 61 6e 63 68 35 00 00 00 c_0x40branch5...
2c 66 66 66 66 00 00 00 be 90 29 80 bf 47 ef a1 ,ffff.....)..G..
3e 61 01 a8 bf 03 27 b5 00 00 00 2c 2f 25 2f 6b >a....'....,/%/k
63 5f 30 78 34 32 62 72 61 6e 63 68 34 00 00 00 c_0x42branch4...
2c 66 66 66 66 00 00 00 bd 22 fe 21 3e e6 64 ab ,ffff....".!>.d.
3f 64 61 19 3c 0d 41 70 00 00 00 2c 2f 25 2f 6b ?da.<.Ap...,/%/k
63 5f 30 78 34 31 62 72 61 6e 63 68 34 00 00 00 c_0x41branch4...
2c 66 66 66 66 00 00 00 bc 7f 5e 8a 3f 3c b7 14 ,ffff....^.?<..
3f 2c c8 0e bc e9 80 c5 00 00 00 2c 2f 25 2f 6b ?,.........,/%/k
63 5f 30 78 34 30 62 72 61 6e 63 68 34 00 00 00 c_0x40branch4...
2c 66 66 66 66 00 00 00 bd 33 74 f3 3e 21 5d 51 ,ffff....3t.>!]Q
3f 7b 8a 61 bd b4 b1 67 00 00 00 2c 2f 25 2f 6b ?{.a...g...,/%/k
63 5f 30 78 34 32 62 72 61 6e 63 68 33 00 00 00 c_0x42branch3...
2c 66 66 66 66 00 00 00 3c 8b ca fa 3f 72 b5 14 ,ffff...<...?r..
3e a0 66 05 3d 55 8f 27 00 00 00 2c 2f 25 2f 6b >.f.=U.'...,/%/k
63 5f 30 78 34 31 62 72 61 6e 63 68 33 00 00 00 c_0x41branch3...
2c 66 66 66 66 00 00 00 3d a5 60 7e 3f 06 2b 31 ,ffff...=..~?.+1
3e b7 85 1c bf 44 b1 03 00 00 00 2c 2f 25 2f 6b >....D.....,/%/k
63 5f 30 78 34 30 62 72 61 6e 63 68 33 00 00 00 c_0x40branch3...
2c 66 66 66 66 00 00 00 bc a5 ea a9 3e f7 ec f6 ,ffff.......>...
3e ec f5 86 bf 3e 03 55 00 00 00 2c 2f 25 2f 6b >....>.U...,/%/k
63 5f 30 78 34 32 62 72 61 6e 63 68 31 00 00 00 c_0x42branch1...
2c 66 66 66 66 00 00 00 3d e8 cb 06 3e a1 68 dc ,ffff...=...>.h.
3f 6b d2 a2 be 4a 87 27 00 00 00 2c 2f 25 2f 6b ?k...J.'...,/%/k
63 5f 30 78 34 31 62 72 61 6e 63 68 31 00 00 00 c_0x41branch1...
2c 66 66 66 66 00 00 00 be c9 18 ef be ff 76 14 ,ffff.........v.
3f 08 5b d0 bf 0f 3c f8 00 00 00 2c 2f 25 2f 6b ?.[...<....,/%/k
63 5f 30 78 34 30 62 72 61 6e 63 68 31 00 00 00 c_0x40branch1...
2c 66 66 66 66 00 00 00 be db 47 03 be 27 04 f4 ,ffff.....G..'..
3f 0d 58 04 bf 32 4e e8                         ?.X..2N.        
`
