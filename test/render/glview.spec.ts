import { expect, use } from 'chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from '../chai/chaiAlmost'
use(chaiAlmost(0.00001))

// import { RenderView } from '../../src/render/glview/RenderView.tsx'
import { Projection } from '../../src/gl/Projection'
import { FlyMode } from '../../src/gl/input/FlyMode'
import { Context } from '../../src/gl/input/Context'
import { mat4, vec3 } from 'gl-matrix'
import { GLView } from '../../src/gl/GLView'

interface ViewFake {
    ctx: Context
    overlaySVG: SVGGElement
    canvas: {
        width: number
        height: number
    }
    invalidate: () => void
}

function makeview(): GLView {
    const glview: ViewFake = {
        overlaySVG: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
        ctx: {
            camera: mat4.create(),
            // rotateX: 0,
            // rotateY: 0,
            // pos: vec3.create(),
            projection: Projection.PERSPECTIVE,
            rotateCameraTo: () => {}
        },
        canvas: {
            width: 640,
            height: 480,
        },
        invalidate: () => {},
       
    }
    return glview as any
}

function translationOf(m: mat4) {
    return [m[12], m[13], m[14]]
}

describe('FlyMode', function () {
    describe('looking forward', function () {
        it.only('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            // we expect this not to change the position but trigger a call to invalidate
            flymode.keydown({ code: 'KeyW' } as any)

            // we expect this to change the position based on time
            flymode.paint()

            // and again
            flymode.paint()

            // until key is up

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0.25])
        })
        it('backward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyS' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.equal([
                0, 0, -0.25,
            ])
        })
        it('left', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyA' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.equal([0.25, 0, 0])
        })
        it('right', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyD' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.equal([
                -0.25, 0, 0,
            ])
        })
        it('up', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyE' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.equal([
                0, -0.25, 0,
            ])
        })
        it('down', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyQ' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0.25, 0])
        })
    })
    describe('looking right', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.pointermove({ offsetX: 320 + 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([
                -0.25, 0, 0,
            ])
        })
        it('left', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.pointermove({ offsetX: 320 + 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyA' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([
                0, 0, 0.25,
            ])
        })
        it('right', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.pointermove({ offsetX: 320 + 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyD' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([
                0, 0, -0.25,
            ])
        })
    })
    describe('looking left', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.pointermove({ offsetX: 320 - 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([
                0.25, 0, 0,
            ])
        })
    })
    describe('looking left & up', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.pointermove({
                offsetX: 320 - 900,
                offsetY: 240 + 900,
            } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([
                0, 0.25, 0,
            ])
        })
    })
    describe('looking up', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.pointermove({ offsetX: 320, offsetY: 240 + 900 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([
                0, 0.25, 0,
            ])
        })
    })
    // the order of operations:
    // 1 rotate around camera
    // 2 translate world/camera
    // 3 rotate around object
    ///
    describe('grok opengl', function () {
        it('alpha', function () {
            const t = mat4.create()
            mat4.translate(t, t, [0, -7, -5])

            // rotate object
            const r = mat4.create()
            mat4.rotateY(r, r, (45 / 360) * 2 * Math.PI)

            const m = mat4.create()
            mat4.mul(m, m, t)
            // mat4.mul(m,m,r)

            const v0 = vec3.fromValues(3, 5, 7)
            vec3.transformMat4(v0, v0, m)

            // console.log(vec3.str(v0))
            expect(v0).to.deep.equal(vec3.fromValues(3, -2, 2))
        })
        it('bravo', function () {
            const r = mat4.create()
            mat4.rotateY(r, r, (45 / 360) * 2 * Math.PI)

            const t = mat4.create()
            mat4.translate(t, t, [0, -7, -5])

            const m = mat4.create()
            mat4.mul(m, m, t)
            mat4.mul(m, m, r)

            const v0 = vec3.fromValues(0, 0, 0)
            vec3.transformMat4(v0, v0, m)

            expect(v0).to.deep.equal(vec3.fromValues(0, -7, -5))

            // now move m
            const d = mat4.create()
            mat4.translate(d, d, [3, 5, 7])

            const iM = mat4.create()
            mat4.invert(iM, m)

            const j = mat4.create()
            mat4.mul(j, j, iM)
            mat4.mul(j, j, d)
            mat4.mul(j, j, m)

            mat4.mul(m, m, j)

            const v1 = vec3.fromValues(0, 0, 0)
            vec3.transformMat4(v1, v1, m)

            expect(v1).to.deep.almost.equal(vec3.fromValues(0 + 3, -7 + 5, -5 + 7))
        })
    })
})
