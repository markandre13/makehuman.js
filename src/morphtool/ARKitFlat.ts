import { RenderMesh } from 'render/RenderMesh'
import { NumberModel } from 'toad.js'
import { FlatMesh } from './FlatMesh'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { MorphTarget } from 'target/MorphTarget'
import { di } from 'lib/di'
import { FaceARKitLoader2 } from './FaceARKitLoader2'

export class ARKitFlat extends FlatMesh {

    map = new Map<number, number[]>()
    // adjust to plain MH base mesh
    // scale = new NumberModel(10.8, { min: 9, max: 11, step: 0.1, label: "scale" })
    // dy = new NumberModel(7.0312, { min: 0, max: 7.4, step: 0.01, label: "dy" })
    // dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" })

    // adjust to morphed MH base mesh
    // scale = new NumberModel(9.4, { min: 9, max: 11, step: 0.1, label: "scale" })
    // dy = new NumberModel(7.08, { min: 0, max: 7.4, step: 0.01, label: "dy" })
    // dz = new NumberModel(0.93, { min: 0, max: 2, step: 0.01, label: "dz" })

    constructor(gl: WebGL2RenderingContext) {
        super()
        const loader = di.get(FaceARKitLoader2).preload()

        this.facesFlat = loader._neutral!.fxyz
        this.vertexOrig = this.vertexFlat = loader.getNeutral().xyz
        const xyz = new Float32Array(this.vertexFlat)
        // apply blendshape
        // this.blendshapeSet.getTarget(this.blendshape.value)?.apply(this.xyz, 1)
        const target = loader.getMorphTarget(Blendshape.jawOpen)
        target?.apply(xyz, 0.5)

        // for (let i = 0; i < xyz.length; ++i) {
        //     xyz[i] *= this.scale.value
        // }
        // for (let i = 1; i < xyz.length; i += 3) {
        //     xyz[i] += this.dy.value
        // }
        // for (let i = 2; i < xyz.length; i += 3) {
        //     xyz[i] += this.dz.value
        // }
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
        const f2 = new Array<number>(this.facesFlat.length)
        for (let i = 0, vo = 0, fo = 0; i < this.facesFlat.length;) {
            let i0 = this.facesFlat[i++] * 3
            let i1 = this.facesFlat[i++] * 3
            let i2 = this.facesFlat[i++] * 3

            add(i0 / 3, vo / 3)
            add(i1 / 3, vo / 3 + 1)
            add(i2 / 3, vo / 3 + 2)

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

        // RenderMesh takes care of calculating the normals
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
        const arkit = di.get(FaceARKitLoader2)
        const orig = arkit.getMorphTarget(blendshape)!
        const t = new MorphTarget()
        const indices = new Array(orig.indices.length * 3)
        const dxyz = new Array(orig.dxyz.length * 3)

        let indexOut = 0, vertexOut = 0, indexIn = 0
        for (const index of orig.indices) {
            const newIndices = this.map.get(index)!
            const v = [
                orig.dxyz[indexIn++], //* this.scale.value,
                orig.dxyz[indexIn++], //* this.scale.value, //+ this.dy.value,
                orig.dxyz[indexIn++] //* this.scale.value //+ this.dz.value
            ]
            for (const x of newIndices) {
                indices[indexOut++] = x
                dxyz[vertexOut++] = v[0]
                dxyz[vertexOut++] = v[1]
                dxyz[vertexOut++] = v[2]
            }
        }
        indices.length = indexOut
        t.indices = new Uint16Array(indices)
        dxyz.length = vertexOut
        t.dxyz = new Float32Array(dxyz)
        return t
    }
}