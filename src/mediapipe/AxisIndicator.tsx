import { ColorBuffer } from 'gl/buffers/ColorBuffer'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { di } from 'lib/di'
import { RenderView } from 'render/RenderView'

export class AxisIndicator {
    private _vertex?: VertexBuffer
    private _index?: IndexBuffer
    private _color?: ColorBuffer

    paint(view: RenderView) {
        this._init(view)
        view.shaderColored.use(view.gl)
        this._vertex!.bind(view.shaderColored)
        this._color!.bind(view.shaderColored)
        this._index!.bind()
        this._index!.drawLines()
    }

    private _init(view: RenderView) {
        if (this._vertex !== undefined) {
            return
        }
        this._vertex = new VertexBuffer(view.gl, [
            0, 0, 0,
            1, 0, 0,
            0, 0, 0,
            0, 1, 0,
            0, 0, 0,
            0, 0, 1
        ])
        this._index = new IndexBuffer(view.gl, [
            0, 1,
            2, 3,
            4, 5
        ])
        this._color = new ColorBuffer(view.gl, [
            1, 0, 0,
            1, 0, 0,
            0, 1, 0,
            0, 1, 0,
            0, 0.5, 1,
            0, 0.5, 1,
        ])
    }
}

di.single(AxisIndicator, () => new AxisIndicator() )
