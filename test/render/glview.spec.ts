import { expect, use } from 'chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from '../chai/chaiAlmost'
use(chaiAlmost(0.00001))

import { FlyMode, GLView, Projection } from '../../src/render/GLView'
import { Context } from '../../src/render/Context'
import { mat4, vec3 } from 'gl-matrix'

interface ViewFake {
    ctx: Context
    canvas: {
        width: number
        height: number
    }
    invalidate: () => void
}

function makeview() {
    const glview: ViewFake = {
        ctx: {
            camera: mat4.create(),
            rotateX: 0,
            rotateY: 0,
            pos: vec3.create(),
            projection: Projection.PERSPECTIVE,
        },
        canvas: {
            width: 640,
            height: 480,
        },
        invalidate: () => {},
    }
    return glview as GLView
}

function translationOf(m: mat4) {
    return [m[12], m[13], m[14]]
}

describe('FlyMode', function () {
    describe('looking forward', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyW' } as any)
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
            expect(translationOf(glview.ctx.camera)).to.deep.equal([-0.25, 0, 0])
        })
        it('up', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])

            flymode.keydown({ code: 'KeyE' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, -0.25, 0])
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
            flymode.onpointermove({ offsetX: 320 + 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([-0.25, 0, 0])
        })
        it('left', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.onpointermove({ offsetX: 320 + 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyA' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([0, 0, 0.25])
        })
        it('right', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.onpointermove({ offsetX: 320 + 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyD' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([0, 0, -0.25])
        })
    })
    describe('looking left', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.onpointermove({ offsetX: 320 - 900, offsetY: 240 } as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([0.25, 0, 0])
        })
    })
    describe('looking left & up', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.onpointermove({ offsetX: 320 - 900, offsetY: 240 + 900} as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([0, 0.25, 0])
        })
    })
    describe('looking up', function () {
        it('forward', function () {
            const glview = makeview()
            const flymode = new FlyMode(glview)

            expect(translationOf(glview.ctx.camera)).to.deep.equal([0, 0, 0])
            flymode.onpointermove({ offsetX: 320, offsetY: 240 + 900} as any)
            console.log(mat4.str(glview.ctx.camera))

            flymode.keydown({ code: 'KeyW' } as any)
            expect(translationOf(glview.ctx.camera)).to.deep.almost.equal([0, 0.25, 0])
        })
    })
})
