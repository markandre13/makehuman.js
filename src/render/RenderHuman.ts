import { BaseMeshGroup } from "../mesh/BaseMeshGroup"
import { ProxyType } from "proxy/Proxy"
import { RenderHandler } from './RenderHandler'
import { Application } from "Application"
import { RenderMesh } from "./RenderMesh"
import { RenderView } from "./RenderView"
import { di } from "lib/di"
import { Texture } from "gl/Texture"
import { IndexBuffer } from "gl/buffers/IndexBuffer"
import { VertexBuffer } from "gl/buffers/VertexBuffer"
import { NormalBuffer } from "gl/buffers/NormalBuffer"

export class RenderHuman extends RenderHandler {
    private viewHead: boolean
    constructor(viewHead: boolean = false) {
        super()
        this.viewHead = viewHead
    }
    override defaultCamera() {
        const app = di.get(Application)
        return this.viewHead ? app.headCamera : app.bodyCamera
    }
    override paint(app: Application, view: RenderView): void {
        if (view.overlay.children.length !== 0) {
            view.overlay.replaceChildren()
        }
        const humanMesh = app.humanMesh
        const renderList = view.renderList

        // one proxy has changed
        // TODO: changedProxy should be in updateManager
        if (humanMesh.changedProxy !== undefined) {
            if (humanMesh.proxies.has(humanMesh.changedProxy)) {
                const proxy = humanMesh.proxies.get(humanMesh.changedProxy)!
                renderList.proxies.set(
                    proxy.type,
                    new RenderMesh(
                        view.gl,
                        proxy.getCoords(humanMesh.vertexRigged),
                        proxy.getMesh().fxyz,
                        proxy.getMesh().uv,
                        proxy.getMesh().fuv
                    )
                )
            } else {
                renderList.proxies.delete(humanMesh.changedProxy)
            }
            humanMesh.changedProxy = undefined
        }

        const gl = view.gl
        const shaderShadedMono = view.shaderShadedMono
        const shaderShadedTexture = view.shaderShadedTexture

        view.prepareCanvas()
        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()

        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)
        shaderShadedTexture.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)

        app.updateManager.updateIt()
        drawHumanCore(app, view)
    }
}

export function drawHumanCore(app: Application, view: RenderView) {
    const gl = view.gl
    const shaderShadedMono = view.shaderShadedMono
    const shaderShadedTexture = view.shaderShadedTexture
    const wireframe = app.wireframe.value

    gl.disable(gl.CULL_FACE)
    // gl.depthFunc(gl.LESS) // default is LESS
    // gl.enable(gl.CULL_FACE)
    // gl.cullFace(gl.BACK)

    let alpha: number
    if (wireframe) {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        alpha = 0.3
        // because of transparency, we also want to draw hidden faces
        gl.depthMask(false)
        // gl.disable(gl.DEPTH_TEST)
    } else {
        gl.disable(gl.BLEND)
        alpha = 1
        gl.depthMask(true)
        // gl.enable(gl.DEPTH_TEST)
    }
    shaderShadedTexture.setAlpha(alpha)

    //
    // draw base mesh
    //

    const WORD_LENGTH = 2
    const renderList = view.renderList
    const base = renderList.base
    const baseMesh = app.humanMesh.baseMesh

    interface MeshDefinition {
        group: BaseMeshGroup[],
        proxyType?: ProxyType,
        rgba: number[],
        baseTexture?: Texture,
        proxyTexture?: Texture,
        glMode: number
    }
    const meshDefinitions: MeshDefinition[] = [{
        group: [BaseMeshGroup.SKIN],
        proxyType: ProxyType.Proxymeshes,
        rgba: [1, 0.8, 0.7, alpha], glMode: gl.TRIANGLES,
        baseTexture: view.bodyTexture,
        proxyTexture: view.bodyTexture
    }, {
        group: [BaseMeshGroup.EYEBALL0, BaseMeshGroup.EYEBALL1],
        proxyType: ProxyType.Eyes,
        rgba: [0, 0.5, 1, alpha], glMode: gl.TRIANGLES,
        baseTexture: view.bodyTexture,
        proxyTexture: view.eyeTexture
    }, {
        group: [BaseMeshGroup.TEETH_TOP, BaseMeshGroup.TEETH_BOTTOM],
        proxyType: ProxyType.Teeth,
        rgba: [1, 1, 1, alpha], glMode: gl.TRIANGLES,
        baseTexture: view.bodyTexture,
    }, {
        group: [BaseMeshGroup.TOUNGE],
        proxyType: ProxyType.Tongue,
        rgba: [1, 0, 0, alpha], glMode: gl.TRIANGLES,
        baseTexture: view.bodyTexture,
    }, {
        group: [BaseMeshGroup.CUBE], rgba: [1, 0, 0.5, alpha], glMode: gl.LINE_STRIP
    }]

    // NOTE: base.glIndices has the quads from the wavefront file as triangles,
    //       hence we do ... / 4 * 6 in the drawElements calls below

    //
    // draw base mesh with base texture
    //
    shaderShadedTexture.use(gl)
    base.glVertex.bind(shaderShadedTexture)
    base.glNormal.bind(shaderShadedTexture)
    base.glUVCoords!.bind(shaderShadedTexture)
    base.glIndices.bind()
    view.bodyTexture.bind()

    for (let def of meshDefinitions) {
        if (def.proxyType !== undefined && renderList.proxies.has(def.proxyType)) {
            continue
        }
        if (def.baseTexture) {
            for (const group of def.group) {
                const offset = baseMesh.groups[group].startIndex * WORD_LENGTH
                const length = baseMesh.groups[group].length
                gl.drawElements(gl.TRIANGLES, (length / 4) * 6, gl.UNSIGNED_SHORT, (offset / 4) * 6)
            }
        }
    }

    //
    // draw base mesh with single color
    //
    shaderShadedMono.use(gl)
    base.glVertex.bind(shaderShadedMono)
    base.glNormal.bind(shaderShadedMono)
    for (let def of meshDefinitions) {
        if (def.proxyType !== undefined && renderList.proxies.has(def.proxyType)) {
            continue
        }
        if (!def.baseTexture) {
            for (const group of def.group) {
                shaderShadedMono.setColor(gl, def.rgba)
                const offset = baseMesh.groups[group].startIndex * WORD_LENGTH
                const length = baseMesh.groups[group].length
                gl.drawElements(def.glMode, (length / 4) * 6, gl.UNSIGNED_SHORT, (offset / 4) * 6)
            }
        }
    }

    //
    // draw proxy meshes
    //
    for (let def of meshDefinitions) {
        if (def.proxyType === undefined || !renderList.proxies.has(def.proxyType)) {
            continue
        }
        const renderMesh = renderList.proxies.get(def.proxyType)!

        if (def.proxyTexture === undefined) {
            shaderShadedMono.use(gl)
            shaderShadedMono.setColor(gl, def.rgba)
            renderMesh.draw(shaderShadedMono, gl.TRIANGLES)
        } else {
            shaderShadedTexture.use(gl)
            def.proxyTexture.bind()
            renderMesh.draw(shaderShadedTexture, gl.TRIANGLES)
        }
    }

    //
    // draw skeleton
    //
    if (wireframe) {
        renderList.base.bind(shaderShadedMono)

        const NUMBER_OF_JOINTS = BaseMeshGroup.JOINT_LAST - BaseMeshGroup.JOINT_FIRST + 1
        const offset = baseMesh.groups[2].startIndex * WORD_LENGTH
        const length = baseMesh.groups[2].length * NUMBER_OF_JOINTS

        shaderShadedMono.use(gl)
        shaderShadedMono.setColor(gl, [1, 1, 1, 1])

        gl.disable(gl.BLEND)
        gl.depthMask(true)
        gl.enable(gl.DEPTH_TEST)
        renderList.base.drawSubset(gl.TRIANGLES, offset, length)
        renderList.skeleton.draw(shaderShadedMono, gl.LINES)
    }
}
