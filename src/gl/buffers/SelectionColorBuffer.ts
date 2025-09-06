import { ColorBuffer } from "./ColorBuffer"
import type { VertexBuffer } from "./VertexBuffer"

export class SelectionColorBuffer extends ColorBuffer {
    private _set = new Set<number>()
    private _rgb = [1, 1, 1]

    constructor(vertices: VertexBuffer) {
        const rgb = new Float32Array(vertices.data.length)
        super(vertices.gl, rgb)
    }
    toggle(index: number): boolean {
        const v = !this.get(index)
        this.set(index, v)
        return v
    }
    set(index: number, selected: boolean) {
        const di = index * 3
        if (selected) {
            [this._data[di], this._data[di + 1], this._data[di + 2]] = this._rgb
            this._set.add(index)
        } else {
            [this._data[di], this._data[di + 1], this._data[di + 2]] = [0, 0, 0]
            this._set.delete(index)
        }
        this.update()
    }
    get(index: number): boolean {
        return this._set.has(index)
    }

    get rgb() {
        return this._rgb
    }
    set rgb(rgb: number[]) {
        if (rgb.length !== 3) {
            throw RangeError(`SelectionColorBuffer.rgb must be an array of size 3`)
        }
        if (rgb[0] < 0 || rgb[0] > 1 || rgb[1] < 0 || rgb[1] > 1 || rgb[2] < 0 || rgb[2] > 1) {
            throw RangeError(`SelectionColorBuffer.rgb values must be within the range of [0, 1]`)
        }
        this._rgb = rgb
        for (const index of this._set) {
            const di = index * 3;
            [this._data[di], this._data[di + 1], this._data[di + 2]] = this._rgb
        }
        this.update()
    }

    private _clear() {
        for (const index of this._set) {
            const di = index * 3;
            [this._data[di], this._data[di + 1], this._data[di + 2]] = [0, 0, 0]
        }
        this._set.clear()
    }
    clear() {
        this._clear()
        this.update()
    }

    get array() {
        return Array.from(this._set)
    }
    set array(data: number[]) {
        if (data === undefined) {
            data = []
        }
        this._clear()
        this._set = new Set(data)
        for (const index of this._set) {
            const di = index * 3;
            [this._data[di], this._data[di + 1], this._data[di + 2]] = this._rgb
        }
        this.update()
    }
}
