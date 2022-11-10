import { Human } from '../Human'
import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { version } from 'os'

export function loadSkeleton(filename: string) {
    const root = parseSkeleton(
        FileSystemAdapter.getInstance().readFile(filename),
        filename)
    console.log(`Loaded skeleton with ${root.bones.size} bones from file ${filename}`)
    return root
}

export function parseSkeleton(data: string, filename = 'memory') {
    let json
    try {
        json = JSON.parse(data)
    }
    catch (error) {
        console.log(`Failed to parse JSON in ${filename}:\n${data.substring(0, 256)}`)
        throw error
    }
    return new Skeleton(filename, json)
}

export interface FileInformation {
    name: string
    version: string
    tags?: string[]
    description: string
    copyright: string
    license: string
}

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
export class Skeleton {
    info: FileInformation

    bones = new Map<string, Bone>() // Bone lookup list by name
    boneslist?: Bone[] // Breadth-first ordered list of all bones
    roots: Bone[] = [] // bones with no parents (aka root bones) of this skeleton, a skeleton can have multiple root bones.

    joint_pos_idxs = new Map<string, Array<number>>()  // Lookup by joint name referencing vertex indices on the human, to determine joint position
    planes = new Map<string, string[]>()    // Named planes defined between joints, used for calculating bone roll angle
    plane_map_strategy?: number = 3  // The remapping strategy used by addReferencePlanes() for remapping orientation planes from a reference skeleton

    vertexWeights: any  // Source vertex weights, defined on the basemesh, for this skeleton
    has_custom_weights = false  // True if this skeleton has its own .mhw file

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
        for(let plane of Object.getOwnPropertyNames(data.planes)) {
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
                    } else
                    if (breadthfirst_bones_set.has(parent)) { // parent has already been added
                        breadthfirst_bones_set.add(bone_name)
                        breadthfirst_bones.push(bone_name)
                    }
                }
            }
        }
        if (breadthfirst_bones_set.size !== Object.getOwnPropertyNames(data.bones).length) {
            let missing = []
            for(let bname in data.bones) {
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
            console.log(`have weights file`)
            // TODO: load weights file
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

    getJointPosition(joint_name: string, human: Human, rest_coord=true) {
        if (this.joint_pos_idxs.has(joint_name)) {
            // console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from skeleton`)
            const v_idx = this.joint_pos_idxs.get(joint_name)!
            // 
            let verts
            if (rest_coord) {
                const meshCoords = human.getRestposeCoordinates()
                verts = v_idx.map( i => { 
                    i = i * 3
                    return [meshCoords[i], meshCoords[i+1], meshCoords[i+2]]
                })
                // console.log(verts.length)
                // console.log(verts)
            } else {
                throw Error(`NOT IMPLEMENTED YET`)
                // verts = human.meshData.getCoords(v_idx)
            }
            // return verts.mean(axis=0)
            let x=0, y=0, z=0
            verts.forEach(v => {
                x += v[0]
                y += v[1]
                z += v[2]
            })
            x /= verts.length
            y /= verts.length
            z /= verts.length
            return [x,y,z]
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
        for(const bone of this.getBones()) {
            bone.build(ref_skel)
        }
    }

    // line 631
    // Returns linear list of all bones in breadth-first order.
    getBones(): Bone[] {
        if (this.boneslist === undefined) {
            this.boneslist  = this.buildBoneList()
        }
        return this.boneslist
    }

    // makehuman/shared/skeleton.py:518: __cacheGetBones()
    private buildBoneList(): Bone[] {
        const result: Bone[] = []
        let queue = [...this.roots]
        while(queue.length > 0) {
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
        roll = 0,
        reference_bones?: any,
        weight_reference_bones?: any)
    {
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

export class Bone {
    skeleton: Skeleton
    name: string
    index: number = -1
    headJoint: string
    tailJoint: string
    headPos = [0, 0, 0]
    tailPos = [0, 0, 0]
    roll: number
    length = 0
    yvector4 = undefined // direction vector of this bone

    parent?: Bone
    children: Bone[] = []

    level: number
    reference_bones = []

    // rest position
    matRestGlobal?: number[]   // 4x4 rest matrix, relative world (bind pose matrix)
    matRestRelative?: number[] // 4x4 rest matrix, relative parent

    matPose?: number[]         // 4x4 pose matrix, relative parent and own rest pose
    matPoseGlobal?: number[]   // 4x4 matrix, relative world
    matPoseVerts?: number[]    // 4x4 matrix, relative world and own rest pose

    // shared/skeleton.py: 709
    constructor(
        skel: Skeleton,
        name: string,
        parentName: string | null,
        headJoint: string,
        tailJoint: string,
        roll = 0,
        reference_bones?: any,
        weight_reference_bones?: any)
    {
        this.skeleton = skel
        this.name = name
        this.headJoint = headJoint
        this.tailJoint = tailJoint
        this.roll = roll
        
        this.updateJointPositions(Human.getInstance())

        if (parentName !== null) {
            this.parent = this.skeleton.getBone(parentName)
            this.parent!.children.push(this)
        }

        if (this.parent) {
            this.level = this.parent.level + 1
        } else {
            this.level = 0
        }

        // self.reference_bones = []  # Used for mapping animations and poses
        // if reference_bones is not None:
        //     if not isinstance(reference_bones, list):
        //         reference_bones = [ reference_bones ]
        //     self.reference_bones.extend( set(reference_bones) )

        // self._weight_reference_bones = None  # For mapping vertex weights (can be automatically set by c
        // if weight_reference_bones is not None:
        //     if not isinstance(weight_reference_bones, list):
        //         weight_reference_bones = [ weight_reference_bones ]
        //     self._weight_reference_bones = list( set(weight_reference_bones) )

        // self.matPose = np.identity(4, np.float32)  # Set pose matrix to rest pose
    }

    // line 768
    // Update the joint positions of this bone based on the current state
    // of the human mesh.
    // Remember to call build() after calling this method.
    updateJointPositions(human: Human, in_rest: boolean = true) {
    // if not human:
    //   from core import G
    //   human = G.app.selectedHuman
    // self.headPos[:] = self.skeleton.getJointPosition(self.headJoint, human, in_rest)[:3] * self.skeleton.scale
    // self.tailPos[:] = self.skeleton.getJointPosition(self.tailJoint, human, in_rest)[:3] * self.skeleton.scale
        this.headPos = this.skeleton.getJointPosition(this.headJoint, human, in_rest)!
        this.tailPos = this.skeleton.getJointPosition(this.tailJoint, human, in_rest)!
    }

    // line 826
    // called from Skeleton.build(ref_skel), which is called from Skeleton.constructor()

    // Calculate this bone's rest matrices and determine its local axis (roll
    // or bone normal).
    // Sets matPoseVerts, matPoseGlobal and matRestRelative.
    // This method needs to be called everytime the skeleton structure is
    // changed, the rest pose is changed or joint positions are updated.
    // Pass a ref_skel to copy the bone normals from a reference skeleton
    // instead of recalculating them (Recalculating bone normals generally
    // only works if the skeleton is in rest pose).
    build(ref_skel?: any) {
        // needs this.headPos and this.tailPos
    }
}

// line 1368
// Get the position of a joint from the human mesh.
// This position is determined by the center of the joint helper with the
// specified name.
// Note: you probably want to use Skeleton.getJointPosition()
function _getHumanJointPosition(human: Human, jointName: string, rest_coord = true) {
    throw Error(`NOT IMPLEMENTED: _getHumanJointPosition(..., jointName='${jointName}', rest_coord=${rest_coord})`)
    // if (!jointName.startsWith("joint-")) {
    //     jointName = "joint-" + jointName
    // }
    const fg =  human.meshData.getFaceGroup(jointName)
    if (fg === undefined) {
        console.warn(`Cannot find position for joint ${jointName}`)
        console.log(human.meshData)
        return // [0,0,0]
    }
    console.log(`found face group for joint ${jointName}`)
    // human.obj.group.get()
    // fg = human.meshData.getFaceGroup(jointName)
    // if fg is None:
    //     log.warning('Cannot find position for joint %s', jointName)
    //     return np.asarray([0,0,0], dtype=np.float32)
    // v_idx = human.meshData.getVerticesForGroups([fg.name])
    // if rest_coord:
    //     verts = human.getRestposeCoordinates()[v_idx]
    // else:
    //     verts = human.meshData.getCoords(v_idx)
    // return verts.mean(axis=0)
}