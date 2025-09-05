import { ColorBuffer } from "./ColorBuffer"
import type { VertexBuffer } from "./VertexBuffer"

export class PickColorBuffer extends ColorBuffer {
    constructor(vertices: VertexBuffer) {
        const rgb = new Float32Array(vertices.data.length)
        for (let i = 1, o = 0; o < rgb.length; ++i) {
            const r = (i % 256) / 255
            const g = ((i >> 8) % 256) / 255
            const b = ((i >> 16) % 256) / 255
            rgb[o++] = r
            rgb[o++] = g
            rgb[o++] = b
            // console.log(`${i}: ${r}, ${g}, ${b}`)
        }
        super(vertices.gl, rgb)
    }
}
