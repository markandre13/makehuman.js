import { Bone } from './Bone'
import { FileInformation } from './loadSkeleton'
import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { VertexBoneWeights, VertexBoneMapping } from './VertexBoneWeights'
import { vec3 } from 'gl-matrix'
import { HumanMesh, Update } from '../mesh/HumanMesh'
import { PoseNode } from 'expression/PoseNode'
import { Signal } from 'toad.js/Signal'

export class Skeleton {
    poseNodes: PoseNode
    poseChanged = new Signal<PoseNode>()

    scene: HumanMesh

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
    constructor(scene: HumanMesh, filename: string, data: any) {
        this.scene = scene
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
            // FIXME: copy'n pasted into Proxy
            const filename = `data/rigs/${weights_file}`
            const data = FileSystemAdapter.readFile(filename)
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
        this.poseNodes = new PoseNode(this.roots[0], this.poseChanged)
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
    getJointPosition(joint_name: string, rest_coord = true): number[] {
        if (this.joint_pos_idxs.has(joint_name)) {
            // console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from skeleton`)
            const v_idx = this.joint_pos_idxs.get(joint_name)!
            // 
            let verts
            if (rest_coord) {
                const meshCoords = this.scene.getRestposeCoordinates()
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
        throw Error(`not implemented`)
        // console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from base mesh`)
        // return _getHumanJointPosition(human, joint_name, rest_coord)
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

    update() {
        for (const bone of this.getBones()) {
            bone.update()
        }
        this.scene.updateRequired = Update.POSE
    }

    updateJoints() {
        for (const bone of this.getBones()) {
            bone.updateJointPositions()
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

    skinMesh(meshCoords: Float32Array, vertBoneMapping: VertexBoneMapping): Float32Array {
        const coords = new Float32Array(meshCoords.length)
        for (let [bname, mapping] of vertBoneMapping.entries()) {
            const [verts, weights] = mapping
            const bone = this.getBone(bname)
            for (let i = 0; i < verts.length; ++i) {
                const vert = verts[i] * 3
                const weight = weights[i]
                const vec = vec3.transformMat4(
                    vec3.create(),
                    vec3.fromValues(meshCoords[vert], meshCoords[vert + 1], meshCoords[vert + 2]),
                    bone.matPoseVerts!)
                coords[vert] += vec[0] * weight
                coords[vert+1] += vec[1] * weight
                coords[vert+2] += vec[2] * weight
            }
        }
        return coords
    }
}
