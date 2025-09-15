import { Bone } from "./Bone"
import { FileInformation } from "./loadSkeleton"
import { FileSystemAdapter } from "../filesystem/FileSystemAdapter"
import { VertexBoneWeights, VertexBoneMapping } from "./VertexBoneWeights"
import { mat4, vec3 } from "gl-matrix"
import { HumanMesh } from "../mesh/HumanMesh"
import { PoseNode } from "expression/PoseNode"
import { Signal } from "toad.js/Signal"
import { AnimationTrack } from "lib/BiovisionHierarchy"
import { ChordataSkeleton as ChordataSkeleton } from "chordata/Skeleton"
import { matrix2euler } from "gl/algorithms/euler"
import { isZero } from "gl/algorithms/isZero"

export class Skeleton {
    poseNodes: PoseNode
    poseChanged = new Signal<PoseNode>()

    humanMesh: HumanMesh

    info: FileInformation

    bones = new Map<string, Bone>() // Bone lookup list by name
    boneslist?: Bone[] // Breadth-first ordered list of all bones
    roots: Bone[] = [] // bones with no parents (aka root bones) of this skeleton, a skeleton can have multiple root bones.

    joint_pos_idxs = new Map<string, Array<number>>() // Lookup by joint name referencing vertex indices on the human, to determine joint position
    planes = new Map<string, string[]>() // Named planes defined between joints, used for calculating bone roll angle
    plane_map_strategy?: number = 3 // The remapping strategy used by addReferencePlanes() for remapping orientation planes from a reference skeleton

    vertexWeights?: VertexBoneWeights
    // Source vertex weights, defined on the basemesh, for this skeleton
    has_custom_weights = false // True if this skeleton has its own .mhw file

    scale: number = 1

    // makehuman/shared/skeleton.py:88 fromFile()
    constructor(humanMesh: HumanMesh, filename: string, data: any) {
        this.humanMesh = humanMesh
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
                    if (parent === null) {
                        // root bone
                        breadthfirst_bones_set.add(bone_name)
                        breadthfirst_bones.push(bone_name)
                    } else if (breadthfirst_bones_set.has(parent)) {
                        // parent has already been added
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
            console.log(
                `Some bones defined in file '${filename}' could not be added to skeleton '${this.info.name}', because they have an invalid parent bone (${missing})`
            )
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
                console.log(
                    `Invalid rotation plane '${JSON.stringify(
                        rotation_plane
                    )}' specified for bone ${bone_name}. Please make sure that you edited the .mhskel file by hand to include roll plane joints."`
                )
                rotation_plane = null
            }
            // console.log(`${bone_name}, parent=${bone_defs.parent}, head=${bone_defs.head}, tail=${bone_defs.tail}, rotation_plane=${rotation_plane}, reference=${bone_defs.reference}, weights_reference=${bone_defs.reference}`)
            this.addBone(
                bone_name,
                bone_defs.parent,
                bone_defs.head,
                bone_defs.tail,
                rotation_plane,
                bone_defs.reference,
                bone_defs.weights_reference
            )
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
            } catch (error) {
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

    /**
     * return the pose as an *.mhp file
     *
     * *.mhp files are a makehuman.js extension.
     *
     * MakeHuman stores poses in BVH files, which is nice if one wants to exchange a
     * pose/animation with other programs but
     *
     * * it needs some computation (convert matPose from relative to global coordinate space
     *   and euler rotations).
     * * BVH files are rather large as they also include the whole skeleton.
     * * I had some trouble getting it to work correctly (and sometimes it still doesn't)
     * * I intend to use Collada to export animations so I don't want to spend more time on BVH
     *   other than needed to import the face-poseunits.bvh file.
     *
     * Hence I added *.mhp and made it similar to the already existing *.mhm format.
     *
     * NOTE: not sure yet if storing relative matPoses will work across different morphs.
     *       well, global matPoses also won't yield perfect results
     */
    // should i use the pose nodes instead?
    toMHP(): string {
        let out = `version v1.2.0\n`
        out += `name makehuman.js\n`
        this.poseNodes.forEach((node) => {
            out += `bone ${node.bone.name} ${node.x.value} ${node.y.value} ${node.z.value}\n`
        })
        return out
    }
    fromMHP(content: string) {
        // this.reset()
        for (const line of content.split("\n")) {
            const token = line.split(" ")
            if (token[0] === "bone") {
                const poseNode = this.poseNodes.find(token[1])
                if (poseNode === undefined) {
                    console.log(`unknown bone '${token[1]}' in mhp file`)
                } else {
                    poseNode.x.value = parseFloat(token[2])
                    poseNode.y.value = parseFloat(token[3])
                    poseNode.z.value = parseFloat(token[4])
                }
            }
        }
    }

    getPose(): mat4[] {
        return this.boneslist!.map((bone) => {
            // convert relative pose to global pose
            const m = mat4.invert(mat4.create(), bone.matRestGlobal!)!
            mat4.mul(m, bone.matUserPoseRelative!, m)
            mat4.mul(m, bone.matRestGlobal!, m)
            return m
        })
    }

    setPose(anim: AnimationTrack, frame: number) {
        if (frame >= anim.nFrames) {
            throw new Error(`requested ${frame} frame does not exist, only ${anim.nFrames} available`)
        }
        if (anim.nBones !== this.boneslist?.length) {
            throw new Error(`requested ${anim.nBones} bone count is wrong, ${this.boneslist!.length} is needed`)
        }
        const offset = frame * anim.nBones

        // from plugins/3_libraries_pose.py: loadBvh()

        // const COMPARE_BONE = "upperleg02.L"
        // if (!bvh_file.joints.has(COMPARE_BONE)) {
        //     throw Error(`The pose file cannot be loaded. It uses a different rig then MakeHuman's default rig`)
        // }

        // let bvh_root_translation: vec3
        // if (bvh_file.joints.has("root")) {
        //     const root_bone = anim[0]
        //     bvh_root_translation = vec3.fromValues(root_bone[12], root_bone[13], root_bone[14])
        // } else {
        //     bvh_root_translation = vec3.create()
        // }

        // function calculateBvhBoneLength(bvh_file: BiovisionHierarchy) {
        //     const bvh_joint = bvh_file.joints.get(COMPARE_BONE)
        //     const j0 = bvh_joint!.children[0].position
        //     const j1 = bvh_joint!.position
        //     const v0 = vec3.fromValues(j0[0], j0[1], j0[2])
        //     const v1 = vec3.fromValues(j1[0], j1[1], j1[2])
        //     const joint_length = vec3.len(vec3.sub(v0, v0, v1))
        //     console.log(`joint_length = ${joint_length}`)
        //     return joint_length
        // }
        // const bvh_bone_length = calculateBvhBoneLength(bvh_file)

        /**
         * Auto scale BVH translations by comparing upper leg length to make the
         * human stand on the ground plane, independent of body length.
         */
        // function autoScaleAnim() {
        //     const bone = humanMesh.skeleton.getBone(COMPARE_BONE)
        //     console.log(`bone.length=${bone.length}, bvh_bone_length=${bvh_bone_length}`)
        //     const scale_factor = bone.length / bvh_bone_length
        //     const trans = vec3.scale(vec3.create(), bvh_root_translation, scale_factor)
        //     console.log(`Scaling animation with factor ${scale_factor}`)
        //     // It's possible to use anim.scale() as well, but by repeated scaling we accumulate error
        //     // It's easier to simply set the translation, as poses only have a translation on
        //     // root joint

        //     // Set pose root bone translation
        //     // root_bone_idx = 0
        //     // posedata = anim.getAtFramePos(0, noBake=True)
        //     // posedata[root_bone_idx, :3, 3] = trans
        //     // anim.resetBaked()
        // }
        // autoScaleAnim()

        // PYTHON
        // joint_length = 3.228637218475342
        // bone.length=3.415726664182774, bvh_bone_length=3.228637218475342
        // Scaling animation run01 with factor 1.0579468775980292

        // TYPESCRIPT (in the test setup the numbers are correct...)
        // joint_length = 3.228636702652367 (main.js, line 317)
        // bone.length=3.155047920856258, bvh_bone_length=3.228636702652367 (main.js, line 328)
        // Scaling animation with factor 0.9772074752988917 (main.js, line 331)

        // => bone length differs

        for (let boneIdx = 0; boneIdx < this.boneslist!.length; ++boneIdx) {
            const bone = this.boneslist![boneIdx + frame * this.boneslist!.length]

            // TODO: I have no idea what this formula is doing...
            const m = mat4.invert(mat4.create(), bone.matRestGlobal!)!
            mat4.mul(m, m, anim.data[offset + boneIdx])
            mat4.mul(m, m, bone.matRestGlobal!) // WTF? in the original it's mat4.mul(m, m, bone.matPoseGlobal!)
            // const m = mat4.copy(mat4.create(), anim.data[offset + boneIdx])

            let { x, y, z } = matrix2euler(m)
            // enforce zero: looks nicer in the ui and also avoids the math going crazy in some situations
            if (isZero(x)) {
                x = 0
            }
            if (isZero(y)) {
                y = 0
            }
            if (isZero(z)) {
                z = 0
            }

            // const check = euler_matrix(x, y, z)
            // if (!mat4.equals(check, m)) {
            //     console.log(`failed to set bone ${bone.name}`)
            // }

            const poseNode = this.poseNodes.find(bone.name)
            if (!poseNode) {
                console.log(`Skeleton.setPose(): no pose node found for bone ${bone.name}`)
                continue
            }
            poseNode.x.value = poseNode.x.default = (x * 360) / (2 * Math.PI)
            poseNode.y.value = poseNode.y.default = (y * 360) / (2 * Math.PI)
            poseNode.z.value = poseNode.z.default = (z * 360) / (2 * Math.PI)
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
    getJointPosition(joint_name: string, rest_coord = true): number[] {
        if (this.joint_pos_idxs.has(joint_name)) {
            // console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from skeleton`)
            const v_idx = this.joint_pos_idxs.get(joint_name)!
            //
            let verts
            if (rest_coord) {
                const meshCoords = this.humanMesh.getVertexMorphed()
                verts = v_idx.map((i) => {
                    i = i * 3
                    return vec3.fromValues(meshCoords[i], meshCoords[i + 1], meshCoords[i + 2])
                })
                // console.log(verts.length)
                // console.log(verts)
            } else {
                throw Error(`NOT IMPLEMENTED YET`)
                // verts = human.meshData.getCoords(v_idx)
            }
            // return verts.mean(axis=0)
            const a = vec3.create()
            verts.forEach((v) => vec3.add(a, a, v))
            vec3.scale(a, a, 1 / verts.length)
            return [a[0], a[1], a[2]]
        }
        throw Error(`not implemented`)
        // console.log(`Skeleton.getJointPosition(joint_name='${joint_name}', human=${human}, rest_coord=${rest_coord}) -> from base mesh`)
        // return _getHumanJointPosition(human, joint_name, rest_coord)
    }

    updateJoints() {
        for (const bone of this.getBones()) {
            bone.updateJointPositions()
        }
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
        // this.humanMesh.setUpdate(Update.POSE)
    }

    updateChordata(skeleton: ChordataSkeleton) {
        for (const bone of this.getBones()) {
            bone.updateChordata(skeleton)
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
        weight_reference_bones?: any
    ) {
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
        const bone = new Bone(
            this,
            name,
            parentName,
            headJoint,
            tailJoint,
            roll,
            reference_bones,
            weight_reference_bones
        )
        this.bones.set(name, bone)
        if (!parentName) {
            this.roots.push(bone)
        }
        return bone
    }

    hasBone(name: string) {
        return this.bones.has(name)
    }

    // line 666
    getBone(name: string): Bone {
        const bone = this.bones.get(name)
        if (bone === undefined) {
            let txt = ``
            this.bones.forEach((v, k) => {
                txt = `${txt} ${k}`
            })

            console.trace(`Skeleton.getBone(${name}): no such bone (have ${txt})`)
            throw Error(`Skeleton.getBone(${name}): no such bone (have ${txt})`)
        }
        return bone
    }

    skinMesh(meshCoords: Float32Array, vertBoneMapping: VertexBoneMapping): Float32Array {
        const coords = new Float32Array(meshCoords.length)
        const v = vec3.create()
        for (let [bname, mapping] of vertBoneMapping.entries()) {
            const [verts, weights] = mapping
            const bone = this.getBone(bname)
            for (let i = 0; i < verts.length; ++i) {
                const vert = verts[i] * 3
                const weight = weights[i]
                // assert(bone.matPoseVerts !== undefined)
                vec3.transformMat4(
                    v,
                    vec3.fromValues(meshCoords[vert], meshCoords[vert + 1], meshCoords[vert + 2]),
                    bone.matPoseVerts!
                )
                vec3.scale(v, v, weight)
                coords[vert] += v[0]
                coords[vert + 1] += v[1]
                coords[vert + 2] += v[2]
            }
        }
        return coords
    }

    /**
     *
     * @returns a list of all joints defining the bone positions (minus end
     * effectors for leaf bones). The names are the same as the corresponding
     * bones in this skeleton.
     *
     * List is in depth-first order (usually the order of joints in a BVH file).
     *
     * Which is NOT the same as a breadth-first ordered list of all bones.
     *
     */
    getJointNames(): string[] {
        return this._retrieveJointNames(this.roots[0])
    }

    containsBone(name: string): boolean {
        return this.bones.has(name)
    }

    protected _retrieveJointNames(parentBone: Bone): string[] {
        const result = [parentBone.name]
        for (const child of parentBone.children) {
            result.push(...this._retrieveJointNames(child))
        }
        return result
    }
}
