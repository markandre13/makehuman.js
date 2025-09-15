export class IndexBuffer {
    protected _data: Uint16Array
    protected _gl: WebGL2RenderingContext
    protected _glbuffer?: WebGLBuffer

    constructor(gl: WebGL2RenderingContext, data: number[] | Uint16Array) {
        this._gl = gl
        if (data instanceof Uint16Array) {
            this._data = data
        } else {
            this._data = new Uint16Array(data)
        }
    }
    get gl(): WebGL2RenderingContext {
        return this._gl
    }
    get data(): Uint16Array {
        return this._data
    }
    bind() {
        if (this._glbuffer === undefined) {
            this._glbuffer = this._gl.createBuffer()
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._glbuffer)
            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, this._data, this._gl.STATIC_DRAW)
        } else {
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._glbuffer)
        }
    }
    update(data?: number[] | Uint16Array) {
        if (this._glbuffer === undefined) {
            return
        }
        if (data) {
            if (data instanceof Uint16Array) {
                this._data = data
            } else {
                this._data = new Uint16Array(data)
            }
        }
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._glbuffer)
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, this._data, this._gl.STATIC_DRAW)
    }
    drawTriangles() {
        const type = this._gl.UNSIGNED_SHORT
        const offset = 0
        this._gl!.drawElements(this._gl.TRIANGLES, this._data.length, type, offset)
    }
    drawLines() {
        const type = this._gl.UNSIGNED_SHORT
        const offset = 0
        this._gl!.drawElements(this._gl.LINES, this._data.length, type, offset)
    }
    drawPoints() {
        const type = this._gl.UNSIGNED_SHORT
        const offset = 0
        this._gl.drawElements(this._gl.POINTS, this._data.length, type, offset)
    }
}
