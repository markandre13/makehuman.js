import { vec3, mat4, vec4 } from "gl-matrix"
import { Skeleton } from "./Skeleton"
import { ChordataSkeleton as ChordataSkeleton } from "chordata/Skeleton"

/**
 * Bone
 * 
 * (head|tail)Joint: string         // (head|tail)JointName
 * ⬇ ︎updateJointPositions()
 * (head|tail)Pose: vec3            // rest(Head|Tail)Pose
 * ⬇ ︎build()
 * matRestGlobal   := move & rotate // to head
 * this.yvector4                    // to tail
 * matRestRelative := parent.matRestGlobal^-1 * matRestGlobal
 */
export class Bone {
    skeleton: Skeleton

    name: string
    headJoint: string
    tailJoint: string
    headPos = [0, 0, 0] // FIXME: vec3
    tailPos = [0, 0, 0] // FIXME: vec3
    roll: string | Array<string>

    /** index of this bone in Skeleton.boneslist */
    index: number = -1

    parent?: Bone
    children: Bone[] = []

    /** distance from root bone */
    level: number
    reference_bones = []

    // rest position derived from morphed mesh
    /** bone relative to world (move, rotate) */
    matRestGlobal?: mat4
    /** bone relative to parent */
    matRestRelative?: mat4

    /** length of bone */
    length = 0
    /** direction and length along y-axis of bone */
    yvector4?: vec4

    /** user defined relative pose */
    matUserPoseRelative: mat4
    /** user defined global pose (when set, update() calculates matUserPoseRelative from it) */
    matUserPoseGlobal?: mat4

    // calculated pose positions
    /** relative to world, use to render the skeleton */
    matPoseGlobal?: mat4
    /** relative to world and own rest pose, used to transform mesh during skinning */
    matPoseVerts?: mat4

    // shared/skeleton.py: 709
    constructor(
        skeleton: Skeleton,
        name: string,
        parentName: string | null,
        headJoint: string,
        tailJoint: string,
        roll: string,
        reference_bones?: any,
        weight_reference_bones?: any
    ) {
        this.skeleton = skeleton
        this.name = name
        this.headJoint = headJoint
        this.tailJoint = tailJoint
        this.roll = roll

        this.updateJointPositions()

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

        this.matUserPoseRelative = mat4.create() // not posed yet
    }

    toString() {
        return `Bone { ${this.name} }`
    }

    // FIXME: WTF???
    get planes(): Map<string, Array<string>> {
        return this.skeleton.planes
    }

    getRestHeadPos(): vec3 {
        return vec3.fromValues(this.headPos[0], this.headPos[1], this.headPos[2])
    }

    getRestTailPos(): vec3 {
        return vec3.fromValues(this.tailPos[0], this.tailPos[1], this.tailPos[2])
    }

    getRestOffset(): vec3 {
        if (this.parent) {
            return vec3.sub(vec3.create(), this.getRestHeadPos(), this.parent.getRestHeadPos())
        } else {
            return this.getRestHeadPos()
        }
    }

    hasChild(name: string): boolean {
        for (const child of this.children) {
            if (this.name === name) {
                return true
            }
            if (child.hasChild(name)) {
                return true
            }
        }
        return false
    }

    hasChildren(): boolean {
        return this.children.length !== 0
    }

    // line 768
    /**
     * Update the joint positions of this bone based on the current state
     * of the human mesh.
     * Remember to call build() after calling this method.
     */
    updateJointPositions(in_rest: boolean = true) {
        // if not human:
        //   from core import G
        //   human = G.app.selectedHuman
        // self.headPos[:] = self.skeleton.getJointPosition(self.headJoint, human, in_rest)[:3] * self.skeleton.scale
        // self.tailPos[:] = self.skeleton.getJointPosition(self.tailJoint, human, in_rest)[:3] * self.skeleton.scale
        this.headPos = this.skeleton.getJointPosition(this.headJoint, in_rest)!
        this.tailPos = this.skeleton.getJointPosition(this.tailJoint, in_rest)!
    }

    // line 826
    /**
     *  called from Skeleton.build(ref_skel), which is called from Skeleton.constructor()
     *
     * Calculate this bone's rest matrices and determine its local axis (roll
     * or bone normal).
     * Sets matPoseVerts, matPoseGlobal and matRestRelative.
     * This method needs to be called everytime the skeleton structure is
     * changed, the rest pose is changed or joint positions are updated.
     * Pass a ref_skel to copy the bone normals from a reference skeleton
     * instead of recalculating them (Recalculating bone normals generally
     * only works if the skeleton is in rest pose).
     */
    build(ref_skel?: any) {
        const head3 = this.getRestHeadPos()
        const tail3 = this.getRestTailPos()
        this.length = vec3.distance(head3, tail3)
        this.yvector4 = vec4.fromValues(0, this.length, 0, 1)

        let normal
        if (ref_skel) {
            throw Error("not implemented yet")
        } else {
            normal = this.get_normal()
        }
        this.matRestGlobal = getMatrix(head3, tail3, normal)
        if (this.parent === undefined) {
            this.matRestRelative = this.matRestGlobal
        } else {
            this.matRestRelative = mat4.mul(
                mat4.create(),
                mat4.invert(mat4.create(), this.parent.matRestGlobal!)!,
                this.matRestGlobal
            )
        }
    }

    /** 
     * calculate matPoseGlobal & matPoseVerts
     */
    update() {
        if (this.matUserPoseGlobal !== undefined) {
            mat4.identity(this.matUserPoseRelative)
        }

        if (this.parent !== undefined) {
            this.matPoseGlobal = mat4.multiply(
                mat4.create(),
                this.parent.matPoseGlobal!,
                mat4.multiply(mat4.create(), this.matRestRelative!, this.matUserPoseRelative!)
            )
        } else {
            this.matPoseGlobal = mat4.multiply(mat4.create(), this.matRestRelative!, this.matUserPoseRelative!)
        }

        if (this.matUserPoseGlobal !== undefined) {
            this.matUserPoseRelative = mat4.invert(mat4.create(), this.matPoseGlobal)!
            const m = this.matUserPoseRelative
            // FIXME: the following line is not covered in test as Skeleton.spec.ts just checks rotations
            m[12] = m[13] = m[14] = 0
            mat4.mul(this.matUserPoseRelative, this.matUserPoseRelative, this.matUserPoseGlobal)

            if (this.parent !== undefined) {
                this.matPoseGlobal = mat4.multiply(
                    mat4.create(),
                    this.parent.matPoseGlobal!,
                    mat4.multiply(mat4.create(), this.matRestRelative!, this.matUserPoseRelative!)
                )
            } else {
                this.matPoseGlobal = mat4.multiply(mat4.create(), this.matRestRelative!, this.matUserPoseRelative!)
            }    
        }

        this.matPoseVerts = mat4.multiply(
            mat4.create(),
            this.matPoseGlobal,
            mat4.invert(mat4.create(), this.matRestGlobal!)!
        )
    }

    updateChordata(skeleton: ChordataSkeleton) {
        const joint = skeleton.getMHJoint(this.name)
        let chordata: mat4
        if (joint === undefined) {
            chordata = mat4.create()
        } else {
            chordata = joint.relative! // getCalibrated()
        }

        let P: mat4
        if (this.parent !== undefined) {
            P = mat4.multiply(mat4.create(), this.parent.matPoseGlobal!, this.matRestRelative!)
        } else {
            P = mat4.clone(this.matRestRelative!)
        }

        const matPose = mat4.multiply(mat4.create(), chordata, P)
        this.matPoseGlobal = matPose
        this.matPoseGlobal[12] = P[12]
        this.matPoseGlobal[13] = P[13]
        this.matPoseGlobal[14] = P[14]

        // N-POSE
        const D = Math.PI / 180
        switch (this.name) {
            case "upperarm01.R":
                mat4.rotateZ(this.matPoseGlobal, this.matPoseGlobal, 40 * D)
                break
            case "lowerarm01.R":
                mat4.rotateX(this.matPoseGlobal, this.matPoseGlobal, -45 * D)
                break
            case "upperleg01.R":
                mat4.rotateZ(this.matPoseGlobal, this.matPoseGlobal, -10 * D)
                break
            case "upperarm01.L":
                mat4.rotateZ(this.matPoseGlobal, this.matPoseGlobal, -40 * D)
                break
            case "lowerarm01.L":
                mat4.rotateX(this.matPoseGlobal, this.matPoseGlobal, -45 * D)
                break
            case "upperleg01.L":
                mat4.rotateZ(this.matPoseGlobal, this.matPoseGlobal, 10 * D)
                break
        }
        this.matPoseVerts = mat4.multiply(
            mat4.create(),
            this.matPoseGlobal,
            mat4.invert(mat4.create(), this.matRestGlobal!)!
        )
    }

    get_normal(): vec3 {
        let normal
        if (this.roll instanceof Array) {
            throw Error("Not implemented yet")
            // # Average the normal over multiple planes
            // count = 0
            // normal = np.zeros(3, dtype=np.float32)
            // for plane_name in self.roll:
            //     norm = get_normal(self.skeleton, plane_name, self.planes)
            //     if not np.allclose(norm, np.zeros(3), atol=1e-05):
            //         count += 1
            //         normal += norm
            // if count > 0 and not np.allclose(normal, np.zeros(3), atol=1e-05):
            //     normal /= count
            // else:
            //     normal = np.asarray([0.0, 1.0, 0.0], dtype=np.float32)
        } else if (typeof this.roll === "string") {
            const plane_name = this.roll // TODO ugly.. why not call this something else than "roll"?
            normal = getNormal(this.skeleton, plane_name, this.planes)
            // if np.allclose(normal, np.zeros(3), atol=1e-05):
            //     normal = np.asarray([0.0, 1.0, 0.0], dtype=np.float32)
        } else {
            normal = vec3.fromValues(0, 1, 0)
        }
        return normal
    }
}

/**
 * Create a matrix which moves to head, and then rotates towards tail
 */
function getMatrix(head: vec3, tail: vec3, normal: vec3): mat4 {
    let bone_direction = vec3.subtract(vec3.create(), tail, head)
    vec3.normalize(bone_direction, bone_direction)
    const norm = vec3.normalize(vec3.create(), normal)
    const z_axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), norm, bone_direction))
    const x_axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), bone_direction, z_axis))
    return mat4.fromValues(
        x_axis[0], x_axis[1], x_axis[2], 0,                         // bone local X axis
        bone_direction[0], bone_direction[1], bone_direction[2], 0, // bone local Y axis
        z_axis[0], z_axis[1], z_axis[2], 0,                         // bone local Z axis
        head[0], head[1], head[2], 1                                // head position as translation
    )
}

function a2vec3(a: number[] | undefined) {
    if (a === undefined) {
        throw Error()
    }
    return vec3.fromValues(a[0], a[1], a[2])
}

// Return the normal of a triangle plane defined between three joint positions,
// using counter-clockwise winding order (right-handed).
function getNormal(skel: Skeleton, plane_name: string, plane_defs: Map<string, Array<string>>) {
    if (!plane_defs.has(plane_name)) {
        console.warn(`No plane with name ${plane_name} defined for skeleton.`)
        vec3.fromValues(0, 1, 0)
    }
    const joint_names = plane_defs.get(plane_name)!
    const [j1, j2, j3] = joint_names
    const p1 = vec3.scale(vec3.create(), a2vec3(skel.getJointPosition(j1)), skel.scale)
    const p2 = vec3.scale(vec3.create(), a2vec3(skel.getJointPosition(j2)), skel.scale)
    const p3 = vec3.scale(vec3.create(), a2vec3(skel.getJointPosition(j3)), skel.scale)
    const pvec = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), p2, p1))
    const yvec = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), p3, p2))
    return vec3.normalize(vec3.create(), vec3.cross(vec3.create(), yvec, pvec))
}