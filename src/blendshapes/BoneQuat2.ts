import { quat2 } from "gl-matrix"
import { Bone } from "skeleton/Bone"


export interface BoneQuat2 {
    bone: Bone
    q: quat2
}
