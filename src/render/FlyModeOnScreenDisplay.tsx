import { vec3, mat4 } from 'gl-matrix'
import { matrix2euler } from 'gl/algorithms/euler'
import { GLView } from 'gl/GLView'

/**
 * On Screen Display while the Fly Mode is active
 *
 * Displays a caret in the center of the view and the current position and rotation
 */
export class FlyModeOnScreenDisplay {
    private _glview: GLView
    private _caret: SVGGElement
    constructor(glview: GLView) {
        const overlaySVG = glview.overlaySVG
        // if (overlaySVG === undefined) {
        //     return
        // }
        // if (this._cartet !== undefined) {
        //     return
        // }
        this._glview = glview
        const canvas = glview.canvas

        const centerX = Math.round(canvas.width / 2)
        const centerY = Math.round(canvas.height / 2)

        // also display pos & rotation in overlay?
        this._caret = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'g'
        )
        function rect(x: number, y: number, w: number, h: number) {
            const rect: SVGRectElement = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'rect'
            )
            rect.setAttributeNS(null, 'x', `${x}`)
            rect.setAttributeNS(null, 'y', `${y}`)
            rect.setAttributeNS(null, 'rx', `3`)
            rect.setAttributeNS(null, 'ry', `3`)
            rect.setAttributeNS(null, 'width', `${w}`)
            rect.setAttributeNS(null, 'height', `${h}`)
            rect.setAttributeNS(null, 'stroke', `#fff`)
            rect.setAttributeNS(null, 'stroke-width', `1`)
            rect.setAttributeNS(null, 'fill', `#000`)
            return rect
        }
        this._caret.appendChild(rect(centerX - 40.5, centerY, 30, 3))
        this._caret.appendChild(rect(centerX + 10.5, centerY, 30, 3))
        this._caret.appendChild(rect(centerX, centerY + 10.5, 3, 30))
        this._caret.appendChild(rect(centerX, centerY - 40.5, 3, 30))

        const cam = glview.ctx.camera
        const v = vec3.create()
        const ic = mat4.invert(mat4.create(), cam)!
        vec3.transformMat4(v, v, ic)
        let text = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        )
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `20`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(
            document.createTextNode(
                `POS: ${cam[12].toFixed(2)}, ${cam[13].toFixed(
                    2
                )}, ${cam[14].toFixed(2)}`
            )
        )
        this._caret.appendChild(text)

        const r = matrix2euler(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D
        text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttributeNS(null, 'x', `10`)
        text.setAttributeNS(null, 'y', `40`)
        text.setAttributeNS(null, 'fill', `#fff`)
        text.appendChild(
            document.createTextNode(
                `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)}`
            )
        )
        this._caret.appendChild(text)

        overlaySVG.appendChild(this._caret)
    }
    destructor() {
        this._glview.overlaySVG.removeChild(this._caret)
    }
    update() {
        const canvas = this._glview.canvas
        const centerX = Math.round(canvas.width / 2)
        const centerY = Math.round(canvas.height / 2)
        this._caret.children[0].setAttributeNS(null, 'x', `${centerX - 40.5}`)
        this._caret.children[0].setAttributeNS(null, 'y', `${centerY}`)
        this._caret.children[1].setAttributeNS(null, 'x', `${centerX + 10.5}`)
        this._caret.children[1].setAttributeNS(null, 'y', `${centerY}`)
        this._caret.children[2].setAttributeNS(null, 'x', `${centerX}`)
        this._caret.children[2].setAttributeNS(null, 'y', `${centerY + 10.5}`)
        this._caret.children[3].setAttributeNS(null, 'x', `${centerX}`)
        this._caret.children[3].setAttributeNS(null, 'y', `${centerY - 40.5}`)

        const cam = this._glview.ctx.camera
        const v = vec3.create()
        const ic = mat4.invert(mat4.create(), cam)!
        vec3.transformMat4(v, v, ic); (
            this._caret.children[4] as SVGTextElement
        ).innerHTML = `POS: ${v[0].toFixed(2)}, ${v[1].toFixed(
            2
        )}, ${v[2].toFixed(2)}`
        const r = matrix2euler(cam, 'syxz')
        const D = 360 / 2 / Math.PI
        r.x *= D
        r.y *= D
        r.z *= D; (
            this._caret.children[5] as SVGTextElement
        ).innerHTML = `ROT: ${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(
            2
        )}`
    }
}
