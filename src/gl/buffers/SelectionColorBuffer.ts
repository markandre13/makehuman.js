import { ColorBuffer } from "./ColorBuffer"
import type { VertexBuffer } from "./VertexBuffer"

export class SelectionColorBuffer extends ColorBuffer {
    constructor(vertices: VertexBuffer) {
        const rgb = new Float32Array(vertices.data.length)
        super(vertices.gl, rgb)
    }
    toggle(index: number): boolean {
        index *= 3
        const value = this._data[index] ? 0 : 1
        // console.log(`toggle ${index} to ${value}`)
        this._data[index++] = value
        this._data[index++] = value
        this._data[index] = value
        this.update()
        return value ? true : false
    }
    set(index: number, selected: boolean) {
        const v = selected ? 1 : 0
        index *= 3
        this._data[index++] = v
        this._data[index++] = v
        this._data[index] = v
        this.update()
    }
    get(index: number): boolean {
        return this._data[index * 3] ? false : true
    }
}
