import { Skeleton } from "skeleton/Skeleton"
import { BlendshapeModel } from "./BlendshapeModel"

export interface IBlendshapeConverter {
    applyToSkeleton(blendshapeModel: BlendshapeModel, skeleton: Skeleton): void
}
