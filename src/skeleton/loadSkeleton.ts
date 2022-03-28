import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'

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
    roots = new Array<Bone>()     // bones with not parents (aka root bones) of this skeleton, a skeleton can have multiple root bones.

    joint_pos_idxs = new Map<string, any>()  // Lookup by joint name referencing vertex indices on the human, to determine joint position
    planes = new Map<string, string[]>()    // Named planes defined between joints, used for calculating bone roll angle
    plane_map_strategy?: number = 3  // The remapping strategy used by addReferencePlanes() for remapping orientation planes from a reference skeleton

    vertexWeights: any  // Source vertex weights, defined on the basemesh, for this skeleton
    has_custom_weights = false  // True if this skeleton has its own .mhw file

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
        // JOINTS
        //

        // for joint_name, v_idxs in list(skelData.get("joints", dict()).items()):
        // if isinstance(v_idxs, list) and len(v_idxs) > 0:
        //     self.joint_pos_idxs[joint_name] = v_idxs
        for (let joint_name in Object.getOwnPropertyNames(data.joints)) {
            const v_idxs = data.joints[joint_name]
            if (v_idxs && v_idxs.length > 0) {
                this.joint_pos_idxs.set(joint_name, v_idxs)
            }
        }

        //
        // PLANES
        //

        // self.planes = skelData.get("planes", dict())
        for(let plane in Object.getOwnPropertyNames(data.planes)) {
            this.planes.set(plane, data.planes[plane])
        }

        // Order bones breadth-first (parents preceed children)
        const breadthfirst_bones_set = new Set<string>()
        const breadthfirst_bones = new Array<string>()
        let prev_len = -1 // anti-deadlock
        // while(len(breadthfirst_bones) != len(skelData["bones"]) and prev_len != len(breadthfirst_bones)):
        while (breadthfirst_bones_set.size != data.bones.length && prev_len != breadthfirst_bones_set.size) {
            //     prev_len = len(breadthfirst_bones)
            prev_len = breadthfirst_bones_set.size
            //     for bone_name, bone_defs in list(skelData["bones"].items()):
            for (let bone_name of Object.getOwnPropertyNames(data.bones)) {
                const bone_defs = data.bones[bone_name]
                //         if bone_name not in breadthfirst_bones:
                if (!breadthfirst_bones_set.has(bone_name)) {
                    //             if not bone_defs.get("parent", None):
                    //                 breadthfirst_bones.append(bone_name)
                    //             elif bone_defs["parent"] in breadthfirst_bones:
                    //                 breadthfirst_bones.append(bone_name)
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

        // if len(breadthfirst_bones) != len(skelData["bones"]):
        //     missing = [bname for bname in list(skelData["bones"].keys()) if bname not in breadthfirst_bones]
        //     log.warning("Some bones defined in file %s could not be added to skeleton %s, because they have an invalid parent bone (%s)", filepath, self.name, ', '.join(missing))
        if (breadthfirst_bones_set.size !== Object.getOwnPropertyNames(data.bones).length) {
            let missing = []
            for(let bname in data.bones) {
                if (!breadthfirst_bones_set.has(bname)) {
                    missing.push(bname)
                }
            }
            console.log(`Some bones defined in file '${filename}' could not be added to skeleton '${this.info.name}', because they have an invalid parent bone (${missing})`)
        }

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
            this.addBone(bone_name, bone_defs.parent, bone_defs.head, bone_defs.tail, rotation_plane, bone_defs.reference, bone_defs.weights_reference)
        }
        this.build()

        // if "weights_file" in skelData and skelData["weights_file"]:
        //     weights_file = skelData["weights_file"]
        //     weights_file = getpath.thoroughFindFile(weights_file, os.path.dirname(getpath.canonicalPath(filepath)), True)

        //     self.vertexWeights = VertexBoneWeights.fromFile(weights_file, mesh.getVertexCount() if mesh else None, rootBone=self.roots[0].name)
        //     self.has_custom_weights = True
        // }
    }

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

    getBone(name: string): Bone {
        const bone = this.bones.get(name)
        if (bone === undefined) {
            console.trace(`Skeleton.getBone(${name}): no such bone`)
            throw Error(`Skeleton.getBone(${name}): no such bone`)
        }
        return bone
    }

    // Rebuild bone rest matrices and determine local bone orientation
    // (roll or bone normal). Pass a ref_skel to copy the bone orientation from
    // the reference skeleton to the bones of this skeleton.
    build(ref_skel?: any) {
        //     self.__cacheGetBones()
        //     for bone in self.getBones():
        //         bone.build(ref_skel)
    }

    // Returns linear list of all bones in breadth-first order.
    getBones() {
        if (this.boneslist === undefined) {
            this.__cacheGetBones()
        }
        return this.boneslist!
    }

    __cacheGetBones() {
        // ??? didn't we create that one earlier?
    }
}

class Bone {
    skeleton: Skeleton
    name: string
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
    // matPose
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
        
        // this.updateJointPosition()

        if (parentName !== null) {
            this.parent = this.skeleton.getBone(parentName)
            this.parent!.children.push(this)
        }

        if (this.parent) {
            this.level = this.parent.level + 1
        } else {
            this.level = 0
        }

        // ... MORE ...
    }
}