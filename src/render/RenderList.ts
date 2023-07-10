import { HumanMesh } from "../mesh/HumanMesh"
import { RenderMesh } from "./RenderMesh"
import { ProxyType } from "proxy/Proxy"

export class RenderList {
    gl: WebGL2RenderingContext
    scene: HumanMesh
    base: RenderMesh
    proxies = new Map<ProxyType, RenderMesh>();
    constructor(gl: WebGL2RenderingContext, scene: HumanMesh) {
        this.gl = gl
        this.scene = scene
        this.base = new RenderMesh(gl, scene.vertexRigged, scene.baseMesh.fxyz, scene.baseMesh.uv, scene.baseMesh.fuv)
        scene.proxies.forEach((proxy) => {
            this.proxies.set(proxy.type, new RenderMesh(gl, proxy.getCoords(scene.vertexRigged), proxy.mesh.fxyz))
        })
    }

    update() {
        this.scene.update()
        this.base.update(this.scene.vertexRigged)
        this.proxies.forEach((renderMesh, type) => {
            const proxy = this.scene.proxies.get(type)!
            const vertexMorphed = proxy.getCoords(this.scene.vertexMorphed)
            const vertexWeights = proxy.getVertexWeights(this.scene.skeleton.vertexWeights!)
            const vertexRigged = this.scene.skeleton.skinMesh(vertexMorphed, vertexWeights!._data)
            renderMesh.update(vertexRigged)
        })
    }
}
