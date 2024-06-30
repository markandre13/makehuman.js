import { BoneQuat2 } from "blendshapes/BoneQuat2"

/**
 * Maps each ARKit face blendshape to a face rig pose
 */
export class BlendshapeToPose extends Map<string, BoneQuat2[]> {}
