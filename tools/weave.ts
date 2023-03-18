// 
// add materials to Makehuman's OBJ files without damaging the vertex order by
// merging files as follows output <orig> with groups/materials from <edit>.
//
// this can be used to add multiple groups/materials to the meshes, e.g.
// for the teeth gum & teeth, for the eye cornea, iris and sclera, for the
// body skin, lips, gum, nails and hair emitter
//
// run with bun tools/weave.ts
//
// Blender import Wavefront
//   Axis Forward: -Z
//   Up          : Y
// Blender Export Wavefront
//   Axis Forward: -Z
//   Up          : Y
//   Geometry Export: Materials

import { FileSystemAdapter } from "../src/filesystem/FileSystemAdapter"
import { NodeJSFSAdapter } from "../src/filesystem/NodeJSFSAdapter"
import { WavefrontObj } from "../src/mesh/WavefrontObj"
import { OrderedMap } from "../src/lib/OrderedMap"

console.log("Weave")

FileSystemAdapter.setInstance(new NodeJSFSAdapter())

const orig = new WavefrontObj()
orig.load("data/teeth/teeth_base/teeth_base.obj")

const edit = new WavefrontObj()
orig.load("tools/teeth.obj")

// console.log(`${orig}`)

const epsilon = Number.EPSILON
const map = new OrderedMap<number[], number>((a: number[], b: number[]) =>
    !(Math.abs(a[0] - b[0]) < epsilon &&
        Math.abs(a[1] - b[1]) < epsilon &&
        Math.abs(a[2] - b[2]) < epsilon
    ) && (a[0] < b[0] || a[1] < b[1] || a[2] < b[2]))
for (let i = 0; i < orig.vertex.length; i += 3) {
    map.set([orig.vertex[i], orig.vertex[i + 1], orig.vertex[i + 2]], i / 3)
}
