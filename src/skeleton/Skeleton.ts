import { Human } from '../Human'
import { Bone } from './Bone'
import { FileInformation, _getHumanJointPosition } from './loadSkeleton'
import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'

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

export class VertexBoneWeights {
    info: FileInformation
    _vertexCount!: number
    _data: Map<string, Array<Array<number>>>
    constructor(filename: string, data: any) {
        // data.weights = []
        console.log(`VertexBoneWeights: filename='${filename}', data=${data}`)
        this.info = {
            name: data.name,
            version: data.version,
            // tags: data.tags,
            description: data.description,
            copyright: data.copyright,
            license: data.license,
        }
        this._data = this._build_vertex_weights_data(data.weights)
        this._calculate_num_weights()
    }

    protected _build_vertex_weights_data(vertexWeightsDict: any, vertexCount: number | undefined = undefined, rootBone: string = "root"): Map<string, Array<Array<number>>> {
        const WEIGHT_THRESHOLD = 1e-4  // Threshold for including bone weight

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

        // if vertexCount is not None:
        //     vcount = vertexCount
        // else:
        //     vcount = max([vn for vg in list(vertexWeightsDict.values()) for vn,_ in vg])+1
        // self._vertexCount = vcount
        let vcount = 0
        for (let bone_name of Object.getOwnPropertyNames(vertexWeightsDict)) {
            const weight_list = vertexWeightsDict[bone_name]
            weight_list.forEach((item: any) => {
                const vertex_index = item[0]
                vcount = Math.max(vcount, vertex_index)
            })
        }
        ++vcount
        this._vertexCount = vcount

        // prepare to normalize weights by calculating the total weight for each bone
        // wtot = np.zeros(vcount, np.float32)
        // for vgroup in list(vertexWeightsDict.values()):
        //     for item in vgroup:
        //         vn,w = item
        //         # Calculate total weight per vertex
        //         wtot[vn] += w
        const wtot = new Array<number>(vcount).fill(0)
        for (let bone_name of Object.getOwnPropertyNames(vertexWeightsDict)) {
            const weight_list = vertexWeightsDict[bone_name]
            weight_list.forEach((item: any) => {
                const vertex_index = item[0]
                const vertex_weight = item[1]
                wtot[vertex_index] += vertex_weight
            })
        }

        // from collections import OrderedDict
        // boneWeights = OrderedDict()
        const boneWeights = new Map<string, any>()
        // for bname,vgroup in list(vertexWeightsDict.items()):
        for (let bname of Object.getOwnPropertyNames(vertexWeightsDict)) {
            const vgroup = vertexWeightsDict[bname]
            //     if len(vgroup) == 0:
            //         continue
            if (vgroup.length === 0) {
                continue
            }
            //     weights = []
            //     verts = []
            //     v_lookup = {}
            //     n = 0
            let weights: number[] = [],
                verts: number[] = [],
                v_lookup = new Map<number, number>(),
                n = 0
            //     for vn,w in vgroup:
            for (let [vn, w] of vgroup) {
                //         if vn in v_lookup:
                if (v_lookup.has(vn)) {
                    // Merge doubles
                    //             v_idx = v_lookup[vn]
                    //             weights[v_idx] += w/wtot[vn]
                    const v_idx = v_lookup.get(vn)!
                    weights[v_idx] + - w / wtot[vn]
                    //         else:
                } else {
                    //             v_lookup[vn] = len(verts)
                    v_lookup.set(vn, verts.length)
                    //             verts.append(vn)
                    verts.push(vn)
                    //             weights.append(w/wtot[vn])
                    weights.push(w / wtot[vn])
                }
            }

            //     verts = np.asarray(verts, dtype=np.uint32)
            //     weights = np.asarray(weights, np.float32)

            // Sort by vertex index
            //     i_s = np.argsort(verts)
            //     verts = verts[i_s]
            //     weights = weights[i_s]
            // Filter out weights under the threshold
            //     i_s = np.argwhere(weights > WEIGHT_THRESHOLD)[:,0]
            //     verts = verts[i_s]
            //     weights = weights[i_s]
            const i_s = weights
                .map((weight, index) => weight > WEIGHT_THRESHOLD ? index : undefined)
                .filter(index => index !== undefined)
                .sort((a,b) => verts[a!] - verts[b!])
            verts = i_s.map(i => verts[i!])
            weights = i_s.map(i => weights[i!])
            // if (bname === "spine05") {
            //     console.log(`i_s.length = ${i_s.length}`)
            //     console.log(i_s)
            // }
            boneWeights.set(bname, [verts, weights])
        }

        // Assign unweighted vertices to root bone with weight 1
        // if rootBone not in list(boneWeights.keys()):
        //     vs = []
        //     ws = []
        // else:
        //     vs,ws = boneWeights[rootBone]
        //     vs = list(vs)
        //     ws = list(ws)
        let vs: number[], ws: number[]
        if (!boneWeights.has(rootBone)) {
            vs = []
            ws = []
        } else {
            [vs, ws] = boneWeights.get(rootBone)
        }      
        // rw_i = np.argwhere(wtot == 0)[:,0]
        console.log(wtot)
        const rw_i = wtot
            .map((value, index) => value === 0 ? index : -1 )
            .filter( index => index >= 0)
        // vs.extend(rw_i)
        vs = vs.concat(rw_i)
        // ws.extend(np.ones(len(rw_i), dtype=np.float32))
        ws = ws.concat(new Array<number>(rw_i.length).fill(1))
        // if len(rw_i) > 0:
        //     if len(rw_i) < 100:
        //         # To avoid spamming the log, only print vertex indices if there's less than 100
        //         log.debug("Adding trivial bone weights to root bone %s for %s unweighted vertices. [%s]", rootBone, len(rw_i), ', '.join([str(s) for s in rw_i]))
        //     else:
        //         log.debug("Adding trivial bone weights to root bone %s for %s unweighted vertices.", rootBone, len(rw_i))
        if (rw_i.length > 0) {
            if (rw_i.length < 100) {
                // To avoid spamming the log, only print vertex indices if there's less than 100
                console.log(`Adding trivial bone weights to root bone ${rootBone} for ${rw_i.length} unweighted vertices. [${rw_i}]`) // ', '.join([str(s) for s in rw_i]))`)
            } else {
                console.log(`Adding trivial bone weights to root bone ${rootBone} for ${rw_i.length} unweighted vertices.`)
            }
        }
        // if len(vs) > 0:
        //     boneWeights[rootBone] = (np.asarray(vs, dtype=np.uint32), np.asarray(ws, dtype=np.float32))
        if (vs.length > 0) {
            boneWeights.set(rootBone, [vs, ws])
        }

        return boneWeights
    }

    protected _calculate_num_weights() {

    }
}

export class Skeleton {
    info: FileInformation

    bones = new Map<string, Bone>(); // Bone lookup list by name
    boneslist?: Bone[] // Breadth-first ordered list of all bones
    roots: Bone[] = []; // bones with no parents (aka root bones) of this skeleton, a skeleton can have multiple root bones.

    joint_pos_idxs = new Map<string, Array<number>>(); // Lookup by joint name referencing vertex indices on the human, to determine joint position
    planes = new Map<string, string[]>(); // Named planes defined between joints, used for calculating bone roll angle
    plane_map_strategy?: number = 3; // The remapping strategy used by addReferencePlanes() for remapping orientation planes from a reference skeleton

    vertexWeights?: VertexBoneWeights
    // Source vertex weights, defined on the basemesh, for this skeleton
    has_custom_weights = false; // True if this skeleton has its own .mhw file

    scale: number = 1;

    // makehuman/shared/skeleton.py:88 fromFile()
    constructor(filename: string, data: any) {
        this.info = {
            name: data.name,
            version: data.version,
            tags: data.tags,
            description: data.description,
            copyright: data.copyright,
            license: data.license,
        }
        this.plane_map_strategy = data.plane_map_strategy

        //
        // joint_pos_idxs[name] := vertex index
        //
        // console.log(Object.getOwnPropertyNames(data.joints).length)
        for (let joint_name of Object.getOwnPropertyNames(data.joints)) {
            // console.log(joint_name)
            const v_idxs = data.joints[joint_name]
            if (v_idxs && v_idxs.length > 0) {
                this.joint_pos_idxs.set(joint_name, v_idxs)
            }
        }
        console.log(`Skeleton.construction(): this.joint_pos_idxs.size = ${this.joint_pos_idxs.size}`)

        // planes[name] = ...
        for (let plane of Object.getOwnPropertyNames(data.planes)) {
            this.planes.set(plane, data.planes[plane])
        }

        // Order bones breadth-first (parents preceed children)
        const breadthfirst_bones_set = new Set<string>()
        const breadthfirst_bones = new Array<string>()
        let prev_len = -1 // anti-deadlock
        while (breadthfirst_bones_set.size != data.bones.length && prev_len != breadthfirst_bones_set.size) {
            prev_len = breadthfirst_bones_set.size
            for (let bone_name of Object.getOwnPropertyNames(data.bones)) {
                const bone_defs = data.bones[bone_name]
                if (!breadthfirst_bones_set.has(bone_name)) {
                    const parent = bone_defs["parent"]
                    if (parent !== null && typeof parent !== "string") {
                        console.log(`Bone '${bone_name}' has invalid parent '${parent}'`)
                        continue
                    }
                    if (parent === null) { // root bone
                        breadthfirst_bones_set.add(bone_name)
                        breadthfirst_bones.push(bone_name)
                    }
                    else if (breadthfirst_bones_set.has(parent)) { // parent has already been added
                        breadthfirst_bones_set.add(bone_name)
                        breadthfirst_bones.push(bone_name)
                    }
                }
            }
        }
        if (breadthfirst_bones_set.size !== Object.getOwnPropertyNames(data.bones).length) {
            let missing = []
            for (let bname in data.bones) {
                if (!breadthfirst_bones_set.has(bname)) {
                    missing.push(bname)
                }
            }
            console.log(`Some bones defined in file '${filename}' could not be added to skeleton '${this.info.name}', because they have an invalid parent bone (${missing})`)
        }

        console.log(`breadthfirst_bones.length: ${breadthfirst_bones.length}`)

        // for bone_name in breadthfirst_bones:
        //     bone_defs = skelData["bones"][bone_name]
        //     rotation_plane = bone_defs.get("rotation_plane", 0) // is 0 the default?
        //     if rotation_plane == [None, None, None]:
        //         log.warning("Invalid rotation plane specified for bone %s. Please make sure that you edited the .mhskel file by hand to include roll plane joints." % bone_name)
        //         rotation_plane = 0
        //     self.addBone(bone_name, bone_defs.get("parent", None), bone_defs["head"], bone_defs["tail"], rotation_plane, bone_defs.get("reference",None), bone_defs.get("weights_reference",None))
        for (let bone_name of breadthfirst_bones) {
            const bone_defs = data.bones[bone_name]
            let rotation_plane = bone_defs.rotation_plane
            // This data was intended to be filled by hand in file exported with 
            //   https://github.com/makehumancommunity/makehuman-utils/blob/master/io_mhrigging_mhskel/export_mh_rigging.py
            // from Blender
            // if rotation_plane == [None, None, None]
            if (typeof rotation_plane !== "string") {
                console.log(`Invalid rotation plane '${JSON.stringify(rotation_plane)}' specified for bone ${bone_name}. Please make sure that you edited the .mhskel file by hand to include roll plane joints."`)
                rotation_plane = null
            }
            // console.log(`${bone_name}, parent=${bone_defs.parent}, head=${bone_defs.head}, tail=${bone_defs.tail}, rotation_plane=${rotation_plane}, reference=${bone_defs.reference}, weights_reference=${bone_defs.reference}`)
            this.addBone(bone_name, bone_defs.parent, bone_defs.head, bone_defs.tail, rotation_plane, bone_defs.reference, bone_defs.weights_reference)
        }

        this.build()

        const weights_file = data["weights_file"]
        if (weights_file !== undefined) {
            const filename = `data/rigs/${weights_file}`
            const data = FileSystemAdapter.getInstance().readFile(filename)
            let json
            try {
                json = JSON.parse(data)
            }
            catch (error) {
                console.log(`Failed to parse JSON in ${filename}:\n${data.substring(0, 256)}`)
                throw error
            }
            this.vertexWeights = new VertexBoneWeights(filename, json)
            this.has_custom_weights = true
            console.log(`loaded weights...`)
            //     weights_file = getpath.thoroughFindFile(weights_file, os.path.dirname(getpath.canonicalPath(filepath)), True)
            //     self.vertexWeights = VertexBoneWeights.fromFile(weights_file, mesh.getVertexCount() if mesh else None, rootBone=self.roots[0].name)
            //     self.has_custom_weights = True
        }
    }

    // line 122: toFile(self, filename, ref_weights=None)
    // line 192: getVertexWeights(self, referenceWeights=None, force_remap=False)
    // line 266: hasCustomVertexWeights(self)
    // line 269: autoBuildWeightReferences(self, referenceSkel)
    // line 341: addReferencePlanes(self, referenceSkel)
    // skeleton.py, line 421: getJointPosition(self, joint_name, human, rest_coord=True)
    // Calculate the position of specified named joint from the current
    // state of the human mesh. If this skeleton contains no vertex mapping
    // for that joint name, it falls back to looking for a vertex group in the
    // human basemesh with that joint name.
    // okay, so in the .mhskel file, ["joints"][joint_name]["head"|"tail"] will point to a list of
    // indices into mesh.coord, whose coords surround the head|tail position
    getJointPosition(joint_name: string, human: Human, rest_coord = true): number[] {
        if (this.joint_pos_idxs.has(joint_name)) {
            // console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from skeleton`)
            const v_idx = this.joint_pos_idxs.get(joint_name)!
            // 
            let verts
            if (rest_coord) {
                const meshCoords = human.getRestposeCoordinates()
                verts = v_idx.map(i => {
                    i = i * 3
                    return [meshCoords[i], meshCoords[i + 1], meshCoords[i + 2]]
                })
                // console.log(verts.length)
                // console.log(verts)
            } else {
                throw Error(`NOT IMPLEMENTED YET`)
                // verts = human.meshData.getCoords(v_idx)
            }
            // return verts.mean(axis=0)
            let x = 0, y = 0, z = 0
            verts.forEach(v => {
                x += v[0]
                y += v[1]
                z += v[2]
            })
            x /= verts.length
            y /= verts.length
            z /= verts.length
            return [x, y, z]
        }
        console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from base mesh`)
        return _getHumanJointPosition(human, joint_name, rest_coord)
    }

    // makehuman/shared/skeleton.py:518
    // Rebuild bone rest matrices and determine local bone orientation
    // (roll or bone normal). Pass a ref_skel to copy the bone orientation from
    // the reference skeleton to the bones of this skeleton.
    build(ref_skel?: any) {
        this.boneslist = undefined
        for (const bone of this.getBones()) {
            bone.build(ref_skel)
        }
    }

    // line 631
    // Returns linear list of all bones in breadth-first order.
    getBones(): Bone[] {
        if (this.boneslist === undefined) {
            this.boneslist = this.buildBoneList()
        }
        return this.boneslist
    }

    // makehuman/shared/skeleton.py:518: __cacheGetBones()
    private buildBoneList(): Bone[] {
        const result: Bone[] = []
        let queue = [...this.roots]
        while (queue.length > 0) {
            const bone = queue.shift()!
            bone.index = result.length
            result.push(bone)
            queue = queue.concat(...bone!.children)
        }
        return result
    }

    // line 509
    addBone(
        name: string,
        parentName: string,
        headJoint: string,
        tailJoint: string,
        roll: string,
        reference_bones?: any,
        weight_reference_bones?: any) {
        // if name in list(self.bones.keys()):
        //     raise RuntimeError("The skeleton %s already contains a bone named %s." % (self.__repr__(), name))
        // bone = Bone(self, name, parentName, headJoint, tailJoint, roll, reference_bones, weight_reference_bones)
        // self.bones[name] = bone
        // if not parentName:
        //     self.roots.append(bone)
        // return bone
        if (name in this.bones) {
            throw Error(`The skeleton ${this.info.name} already contains a bone named ${name}.`)
        }
        const bone = new Bone(this, name, parentName, headJoint, tailJoint, roll, reference_bones, weight_reference_bones)
        this.bones.set(name, bone)
        if (!parentName) {
            this.roots.push(bone)
        }
        return bone
    }

    // line 666
    getBone(name: string): Bone {
        const bone = this.bones.get(name)
        if (bone === undefined) {
            console.trace(`Skeleton.getBone(${name}): no such bone`)
            throw Error(`Skeleton.getBone(${name}): no such bone`)
        }
        return bone
    }

}
