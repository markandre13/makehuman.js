import { WavefrontObj } from "mesh/WavefrontObj"
import { Target } from "target/Target"
import { blendshapeNames } from "./blendshapeNames"
import { Frontend_impl } from "net/Frontend_impl"
import { isZero } from "mesh/HumanMesh"
import { mat4, vec3 } from "gl-matrix"

/**
 * Load and cache ARKit Face Blendshapes
 */
export class FaceARKitLoader {
    private static _instance?: FaceARKitLoader
    static getInstance() {
        if (FaceARKitLoader._instance === undefined) {
            FaceARKitLoader._instance = new FaceARKitLoader()
        }
        return FaceARKitLoader._instance
    }

    // private scale = 1;
    private targets: Target[]
    private name2index: Map<string, number>
    neutral?: WavefrontObj

    constructor() {
        this.targets = new Array<Target>(blendshapeNames.length)
        this.name2index = new Map<string, number>()
        blendshapeNames.forEach((name, index) => this.name2index.set(name, index))
    }

    /**
     * Load all blendshapes. Useful when doing live animation.
     */
    preload(): FaceARKitLoader {
        for (let blendshape = 1; blendshape < blendshapeNames.length; ++blendshape) {
            this.getTarget(blendshape)
        }
        return this
    }

    getNeutral(): WavefrontObj {
        if (this.neutral === undefined) {
            this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
        }
        return this.neutral
    }

    getTarget(blendshape: number | string): Target | undefined {
        this.getNeutral()
        if (typeof blendshape === "string") {
            blendshape = this.name2index.get(blendshape)!
        }
        if (blendshape === 0) {
            return undefined
        }
        if (this.targets[blendshape] !== undefined) {
            return this.targets[blendshape]
        }
        const name = blendshapeNames[blendshape]
        const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
        // for (let i = 0; i < this.neutral.xyz.length; ++i) {
        //     dst.xyz[i] = dst.xyz[i] * this.scale
        // }
        const target = new Target()
        target.diff(this.neutral!.xyz, dst.xyz)
        this.targets[blendshape] = target
        return target
    }

    getVertex(frontend: Frontend_impl): Float32Array {
        const neutral = this.getNeutral()
        const vertex = new Float32Array(neutral.xyz.length)
        vertex.set(this.neutral!.xyz)
        // apply blendshapes
        for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const weight = frontend.getBlendshapeWeight(blendshapeNames[blendshape])
            if (isZero(weight)) {
                continue
            }
            this.getTarget(blendshape)?.apply(vertex, weight)
        }

        // scale and rotate
        let m: mat4
        if (frontend.transform) {
            const t = frontend.transform!!
            // prettier-ignore
            m = mat4.fromValues(
                t[0],  t[1],  t[2], 0,
                t[4],  t[5],  t[6], 0,
                t[8],  t[9], t[10], 0,
                    0,     0,     0, 1
            )
        } else {
            m = mat4.create()
        }
        const s = 60
        mat4.scale(m, m, vec3.fromValues(s, s, s))

        const v = vec3.create()
        for (let i = 0; i < vertex.length; i += 3) {
            v[0] = vertex[i]
            v[1] = vertex[i + 1]
            v[2] = vertex[i + 2]
            vec3.transformMat4(v, v, m)
            vertex[i] = v[0]
            vertex[i + 1] = v[1]
            vertex[i + 2] = v[2]
        }
        return vertex
    }
}
