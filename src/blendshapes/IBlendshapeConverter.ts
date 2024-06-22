import { Skeleton } from "skeleton/Skeleton"
import { BlendshapeModel } from "./BlendshapeModel"

export interface IBlendshapeConverter {
    convert(blendshapeModel: BlendshapeModel, skeleton: Skeleton): void
}
