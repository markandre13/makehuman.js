import { RenderMesh } from "./RenderMesh"

export interface Buffers {
    base: RenderMesh
    skeletonIndex: number
    proxies: Map<string, RenderMesh>
}
