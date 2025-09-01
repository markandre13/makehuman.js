export class Float32Buffer {
    protected _gl: WebGL2RenderingContext
    protected _target: GLenum
    protected _data: Float32Array
    protected _glbuffer?: WebGLBuffer

    constructor(
        gl: WebGL2RenderingContext,
        data: number[] | Float32Array,
        target: GLenum = gl.ARRAY_BUFFER
    ) {
        this._gl = gl
        this._target = target
        if (data instanceof Float32Array) {
            this._data = data
        } else {
            this._data = new Float32Array(data)
        }
    }
    get gl(): WebGL2RenderingContext {
        return this._gl
    }
    get data(): Float32Array {
        return this._data
    }
    get glbuffer() {
        if (this._glbuffer === undefined) {
            this._glbuffer = this._gl.createBuffer()
            this._gl.bindBuffer(this._target, this._glbuffer)
            this._gl.bufferData(this._target, this._data, this._gl.STATIC_DRAW)
        }
        return this._glbuffer
    }
    update() {
        if (this._glbuffer === undefined) {
            return
        }
        this._gl.bindBuffer(this._target, this._glbuffer)
        this._gl.bufferData(this._target, this._data, this._gl.STATIC_DRAW)
    }
}
