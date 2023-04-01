import { RenderMesh } from "./RenderMesh"

export interface Buffers {
    base: RenderMesh
    texCube: RenderMesh
    skeletonIndex: number
    proxies: Map<string, RenderMesh>
}
