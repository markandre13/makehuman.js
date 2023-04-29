import { FileInformation } from './loadSkeleton'

// makehuman/shared/skeleton.py
// General skeleton, rig or armature class.
// A skeleton is a hierarchic structure of bones, defined between a head and tail
// joint position. Bones can be detached from each other (their head joint doesn't
// necessarily need to be at the same position as the tail joint of their parent
// bone).
// A pose can be applied to the skeleton by setting a pose matrix for each of the
// bones, allowing static posing or animation playback.
// The skeleton supports skinning of a mesh using a list of vertex-to-bone
// assignments.
// skeleton file
//   data: bones, joints, planes, weights_file, plane_map_strategy
//   info: name, version, tags, description, copyright, license
// weights files
//   data: weights
//   info: name, version, description, copyright, license

// Map<boneName, [vertexIndex[], vertexWeight[]]
//                ^              ^
//                |              how much the vertex is influenced by the bone
//                index of vertex influenced by the bone
export type VertexBoneMapping = Map<string, Array<Array<number>>>

export class VertexBoneWeights {
    info!: FileInformation
    _vertexCount!: number
    _data: VertexBoneMapping
    constructor(filename: string, data: any) {
        if (data.name) {
            this.info = {
                name: data.name,
                version: data.version,
                // tags: data.tags,
                description: data.description,
                copyright: data.copyright,
                license: data.license,
            }
        }
        this._data = this._build_vertex_weights_data(data.weights)
    }

    // name -> [[i,w]], ...]
    protected _build_vertex_weights_data(vertexWeightsDict: any, vertexCount: number | undefined = undefined, rootBone: string = "root"): VertexBoneMapping {
        const WEIGHT_THRESHOLD = 1e-4 // Threshold for including bone weight

        if (vertexWeightsDict === undefined) {
            throw Error(`vertexWeightsDict must not be undefined`)
        }

        // first_entry = list(vertexWeightsDict.keys())[0] if len(vertexWeightsDict) > 0 else None
        // if len(vertexWeightsDict) > 0 and \
        //    len(vertexWeightsDict[first_entry]) == 2 and \
        //    isinstance(vertexWeightsDict[first_entry], tuple) and \
        //    isinstance(vertexWeightsDict[first_entry][1], np.ndarray) and \
        //    isinstance(vertexWeightsDict[first_entry][2], np.ndarray):
        //     # Input dict is already in the expected format, presume it does not
        //     # need to be built again
        //     if vertexCount is not None:
        //         self._vertexCount = vertexCount
        //     else:
        //         self._vertexCount = max([vn for vg in list(vertexWeightsDict.values()) for vn in vg[0]])+1
        //     return vertexWeightsDict

        // calculate vertex count
        let vcount: number
        if (vertexCount !== undefined) {
            vcount = vertexCount
        } else {
            vcount = 0
            for (let bone_name of Object.getOwnPropertyNames(vertexWeightsDict)) {
                const weight_list = vertexWeightsDict[bone_name]
                weight_list.forEach((item: any) => {
                    const vertex_index = item[0]
                    vcount = Math.max(vcount, vertex_index)
                })
            }
            ++vcount
        }
        this._vertexCount = vcount

        // prepare to normalize weights by calculating the total weight for each bone
        const totalWeightPerVertex = new Array<number>(vcount).fill(0)
        for (let bone_name of Object.getOwnPropertyNames(vertexWeightsDict)) {
            const weight_list = vertexWeightsDict[bone_name]
            weight_list.forEach((item: any) => {
                const vertex_index = item[0]
                const vertex_weight = item[1]
                totalWeightPerVertex[vertex_index] += vertex_weight
            })
        }

        const boneWeights: VertexBoneMapping = new Map<string, any>()
        for (let bname of Object.getOwnPropertyNames(vertexWeightsDict)) {
            const vgroup = vertexWeightsDict[bname]
            if (vgroup.length === 0) {
                continue
            }
            let weights: number[] = [], verts: number[] = [], v_lookup = new Map<number, number>(), n = 0
            for (let [vn, w] of vgroup) {
                const wn = w / totalWeightPerVertex[vn]
                if (!v_lookup.has(vn)) {
                    v_lookup.set(vn, verts.length)
                    verts.push(vn)
                    weights.push(wn)
                } else {
                    const v_idx = v_lookup.get(vn)!
                    weights[v_idx] += wn
                }
            }
            // filter out weights under the threshold and sort by vertex index
            const i_s = weights
                .map((weight, index) => weight > WEIGHT_THRESHOLD ? index : undefined)
                .filter(index => index !== undefined)
                .sort((a, b) => verts[a!] - verts[b!])

            verts = i_s.map(i => verts[i!])
            weights = i_s.map(i => weights[i!])
            boneWeights.set(bname, [verts, weights])
        }

        // assign unweighted vertices to root bone with weight 1
        let vs: number[], ws: number[]
        if (!boneWeights.has(rootBone)) {
            vs = []
            ws = []
        } else {
            [vs, ws] = boneWeights.get(rootBone)!
        }
        const rw_i = totalWeightPerVertex
            .map((value, index) => value === 0 ? index : -1)
            .filter(index => index >= 0)
        vs = vs.concat(rw_i)
        ws = ws.concat(new Array<number>(rw_i.length).fill(1))
        if (rw_i.length > 0) {
            if (rw_i.length < 100) {
                // To avoid spamming the log, only print vertex indices if there's less than 100
                console.log(`Adding trivial bone weights to root bone ${rootBone} for ${rw_i.length} unweighted vertices. [${rw_i}]`) // ', '.join([str(s) for s in rw_i]))`)
            } else {
                console.log(`Adding trivial bone weights to root bone ${rootBone} for ${rw_i.length} unweighted vertices.`)
            }
        }
        if (vs.length > 0) {
            boneWeights.set(rootBone, [vs, ws])
        }

        return boneWeights
    }
}
