import { RenderMesh } from "./RenderMesh"

export interface Buffers {
    vertex: WebGLBuffer
    normal: WebGLBuffer
    indices: WebGLBuffer

    skeletonIndex: number

    proxies: Map<string, RenderMesh>
}
