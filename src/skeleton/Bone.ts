import { Human } from '../Human'
import { vec3, mat4, vec4 } from 'gl-matrix'
import { getMatrix, get_normal } from './loadSkeleton'
import { Skeleton } from "./Skeleton"

export class Bone {
    skeleton: Skeleton
    name: string
    index: number = -1;
    headJoint: string
    tailJoint: string
    headPos = [0, 0, 0];
    tailPos = [0, 0, 0];
    roll: string | Array<string>
    length = 0;
    yvector4?: vec4 // direction vector of this bone

    parent?: Bone
    children: Bone[] = [];

    level: number
    reference_bones = [];

    // user defined value
    matPose: mat4

    // calculated rest position
    matRestGlobal?: mat4   // bone relative to world
    matRestRelative?: mat4 // bone relative to parent
    // calculated pose positions
    matPoseGlobal?: mat4 // relative to world
    matPoseVerts?: mat4 // relative to world and own rest pose, used for skinning

    // shared/skeleton.py: 709
    constructor(
        skel: Skeleton,
        name: string,
        parentName: string | null,
        headJoint: string,
        tailJoint: string,
        roll: string,
        reference_bones?: any,
        weight_reference_bones?: any) {
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

        this.matPose = mat4.identity(mat4.create()) // not posed yet
    }

    get planes(): Map<string, Array<string>> {
        return this.skeleton.planes
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
        const head3 = vec3.fromValues(this.headPos[0], this.headPos[1], this.headPos[2])
        const tail3 = vec3.fromValues(this.tailPos[0], this.tailPos[1], this.tailPos[2])

        let normal
        if (ref_skel) {
            throw Error("not implemented yet")
        } else {
            normal = this.get_normal()
        }
        this.matRestGlobal = getMatrix(head3, tail3, normal)
        this.length = vec3.distance(head3, tail3)
        if (this.parent === undefined) {
            this.matRestRelative = this.matRestGlobal
        } else {
            this.matRestRelative =
                mat4.mul(
                    mat4.create(),
                    mat4.invert(mat4.create(), this.parent.matRestGlobal!),
                    this.matRestGlobal
                )
        }
        this.yvector4 = vec4.fromValues(0, this.length, 0, 1)
    }

    // calculate matPoseGlobal & matPoseVerts
    update() {
        if (this.parent !== undefined) {
            this.matPoseGlobal =
                mat4.multiply(mat4.create(), this.parent.matPoseGlobal!,
                    mat4.multiply(mat4.create(), this.matRestRelative!, this.matPose!))
        } else {
            this.matPoseGlobal = mat4.multiply(mat4.create(), this.matRestRelative!, this.matPose!)
        }
        this.matPoseVerts = mat4.multiply(mat4.create(), this.matPoseGlobal,
            mat4.invert(mat4.create(), this.matRestGlobal!))
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
        }
        else if (typeof this.roll === "string") {
            const plane_name = this.roll // TODO ugly.. why not call this something else than "roll"?
            normal = get_normal(this.skeleton, plane_name, this.planes)
            // if np.allclose(normal, np.zeros(3), atol=1e-05):
            //     normal = np.asarray([0.0, 1.0, 0.0], dtype=np.float32)
        } else {
            normal = vec3.fromValues(0, 1, 0)
        }
        return normal
    }
}
