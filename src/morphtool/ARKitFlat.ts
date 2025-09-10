import { Application } from 'Application'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'
import { RenderMesh } from 'render/RenderMesh'
import { NumberModel } from 'toad.js'
import { FlatMesh } from './FlatMesh'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { Target } from 'target/Target'
import { di } from 'lib/di'

export class ARKitFlat extends FlatMesh {

    map = new Map<number, number[]>()
    scale = new NumberModel(10.8, { min: 9, max: 11, step: 0.1, label: "scale" })
    dy = new NumberModel(7.0312, { min: 0, max: 7.4, step: 0.01, label: "dy" })
    dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" })

    constructor(gl: WebGL2RenderingContext) {
        super()
        const arkit = di.get(FaceARKitLoader).preload()

        this.facesFlat = arkit.neutral!.fxyz
        this.vertexOrig = this.vertexFlat = arkit.getNeutral().xyz
        const xyz = new Float32Array(this.vertexFlat)
        // this.blendshapeSet.getTarget(this.blendshape.value)?.apply(this.xyz, 1)
        for (let i = 0; i < xyz.length; ++i) {
            xyz[i] *= this.scale.value
        }
        for (let i = 1; i < xyz.length; i += 3) {
            xyz[i] += this.dy.value
        }
        for (let i = 2; i < xyz.length; i += 3) {
            xyz[i] += this.dz.value
        }
        this.vertexOrig = this.vertexFlat = xyz

        const add = (indexIn: number, indexOut: number) => {
            const a = this.map.get(indexIn)
            if (a === undefined) {
                this.map.set(indexIn, [indexOut])
            } else {
                a.push(indexOut)
            }
        }

        // duplicate triangles to achieve flat shading
        const v2 = new Float32Array(this.facesFlat.length * 3)
        const f2 = new Array<number>(this.facesFlat.length * 3)
        for (let i = 0, vo = 0, fo = 0; i < this.facesFlat.length;) {
            let i0 = this.facesFlat[i++] * 3
            let i1 = this.facesFlat[i++] * 3
            let i2 = this.facesFlat[i++] * 3

            add(i0, vo / 3)
            add(i1, vo / 3 + 1)
            add(i2, vo / 3 + 2)

            v2[vo++] = this.vertexFlat[i0++]
            v2[vo++] = this.vertexFlat[i0++]
            v2[vo++] = this.vertexFlat[i0++]
            v2[vo++] = this.vertexFlat[i1++]
            v2[vo++] = this.vertexFlat[i1++]
            v2[vo++] = this.vertexFlat[i1++]
            v2[vo++] = this.vertexFlat[i2++]
            v2[vo++] = this.vertexFlat[i2++]
            v2[vo++] = this.vertexFlat[i2++]
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
            f2[fo] = fo
            ++fo
        }
        this.facesFlat = f2
        this.vertexFlat = v2

        this.renderMesh = new RenderMesh(
            gl,
            this.vertexFlat,
            this.facesFlat,
            undefined,
            undefined,
            false
        )
    }

    getTarget(blendshape: Blendshape) {
        const arkit = di.get(FaceARKitLoader)
        const orig = arkit.getTarget(blendshape)!
        const t = new Target()
        // t.data = new Uint16Array(0)
        // t.verts = new Float32Array(0)
        t.data = new Uint16Array(orig.data.length * 3)
        t.verts = new Float32Array(orig.verts.length * 3)

        // for (let i = 0, vo = 0, fo = 0; i < this.facesFlat.length;) {
        //     let i0 = this.facesFlat[i++] * 3
        //     let i1 = this.facesFlat[i++] * 3
        //     let i2 = this.facesFlat[i++] * 3
    
        //     v2[vo++] = this.vertexFlat[i0++]
        //     v2[vo++] = this.vertexFlat[i0++]
        //     v2[vo++] = this.vertexFlat[i0++]
        //     v2[vo++] = this.vertexFlat[i1++]
        //     v2[vo++] = this.vertexFlat[i1++]
        //     v2[vo++] = this.vertexFlat[i1++]
        //     v2[vo++] = this.vertexFlat[i2++]
        //     v2[vo++] = this.vertexFlat[i2++]
        //     v2[vo++] = this.vertexFlat[i2++]
        //     f2[fo] = fo
        //     ++fo
        //     f2[fo] = fo
        //     ++fo
        //     f2[fo] = fo
        //     ++fo
        // }
        // this.facesFlat = f2
        // this.vertexFlat = v2


        // for(let i=0; i<t.data.length; ++i) {
        //     t.data[i] = i
        // }

        // let indexOut = 0, vertexOut = 0, indexIn = 0
        // for (const index of orig.data) {
        //     const newIndices = this.map.get(index)!
        //     const v = [
        //         orig.verts[indexIn++] * this.scale.value,
        //         orig.verts[indexIn++] * this.scale.value + this.dy.value,
        //         orig.verts[indexIn++] * this.scale.value + this.dz.value
        //     ]
        //     for (const x of newIndices) {
        //         t.data[indexOut++] = x
        //         t.verts[vertexOut++] = v[0]
        //         t.verts[vertexOut++] = v[1]
        //         t.verts[vertexOut++] = v[2]
        //     }
        // }
        return t
    }
}