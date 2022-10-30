import { Skeleton, Bone } from "./loadSkeleton"

type BoneType = "Prism" | "Box" | "Cube" | "Line"

// shared/skeleton_drawing.py

// def meshFromSkeleton(skel, type="Prism")
export function renderSkeleton(skeleton: Skeleton, type: BoneType = "Prism") {
    shapeFromSkeleton(skeleton, type)
}

function shapeFromSkeleton(skeleton: Skeleton, type: BoneType) {
    const bones = skeleton.getBones()
    if (bones === undefined) {
        console.log(`Skeleton.getBones() returned undefined`)
        return
    }
    for(const bone of bones) {
        shapeFromBone(bone, type)
        // merge all the bone meshes
        // ...
    }
}

function shapeFromBone(bone: Bone, type: BoneType) {
    // get the position and length of the bone...

    // const mat = bone.matPoseGlobal
    // const length = bone.getLength()

    // ...and return a suitable mesh
}
