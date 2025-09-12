import { BaseMeshGroup } from "../mesh/BaseMeshGroup"
import { ProxyType } from "proxy/Proxy"
import { RenderHandler } from './RenderHandler'
import { Application } from "Application"
import { RenderMesh } from "./RenderMesh"
import { RenderView } from "./RenderView"
import { di } from "lib/di"

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
    const humanMesh = app.humanMesh
    const renderList = view.renderList
    const gl = view.gl
    const shaderShadedMono = view.shaderShadedMono
    const shaderShadedTexture = view.shaderShadedTexture
    const wireframe = app.humanMesh.wireframe.value

    const WORD_LENGTH = 2

    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.depthMask(true)

    let alpha: number
    if (wireframe) {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        alpha = 0.3
    } else {
        gl.disable(gl.BLEND)
        alpha = 1
    }
    shaderShadedTexture.setAlpha(alpha)

    shaderShadedMono.use(gl)
    //
    // JOINTS AND SKELETON
    //
    if (wireframe) {
        renderList.base.bind(shaderShadedMono)

        const NUMBER_OF_JOINTS = 124
        const offset = humanMesh.baseMesh.groups[2].startIndex * WORD_LENGTH
        const count = humanMesh.baseMesh.groups[2].length * NUMBER_OF_JOINTS

        shaderShadedMono.setColor(gl, [1, 1, 1, 1])
        renderList.base.drawSubset(gl.TRIANGLES, offset, count)
        renderList.skeleton.draw(shaderShadedMono, gl.LINES)
    }

    //
    // BASEMESH
    //
    renderList.base.bind(shaderShadedMono)

    const MESH_GROUP_INDEX = 0
    const COLOR_INDEX = 1
    const GLMODE_INDEX = 2
    for (let x of [
        [BaseMeshGroup.SKIN, [1, 0.8, 0.7, alpha], gl.TRIANGLES],
        [BaseMeshGroup.EYEBALL0, [0, 0.5, 1, alpha], gl.TRIANGLES],
        [BaseMeshGroup.EYEBALL1, [0, 0.5, 1, alpha], gl.TRIANGLES],
        [BaseMeshGroup.TEETH_TOP, [1, 1, 1, alpha], gl.TRIANGLES],
        [BaseMeshGroup.TEETH_BOTTOM, [1, 1, 1, alpha], gl.TRIANGLES],
        [BaseMeshGroup.TOUNGE, [1, 0, 0, alpha], gl.TRIANGLES],
        [BaseMeshGroup.CUBE, [1, 0, 0.5, alpha], gl.LINE_STRIP],
    ]) {
        const idx = x[MESH_GROUP_INDEX] as number

        if (idx !== BaseMeshGroup.SKIN && wireframe) {
            gl.depthMask(false)
        } else {
            gl.depthMask(true)
        }

        if (idx === BaseMeshGroup.SKIN) {
            continue
        }
        if (renderList.proxies.has(ProxyType.Eyes) &&
            (idx === BaseMeshGroup.EYEBALL0 || idx === BaseMeshGroup.EYEBALL1)) {
            continue
        }
        // if (idx === BaseMeshGroup.EYEBALL0 || idx === BaseMeshGroup.EYEBALL1) {
        //     continue
        // }
        if (renderList.proxies.has(ProxyType.Teeth) &&
            (idx === BaseMeshGroup.TEETH_TOP || idx === BaseMeshGroup.TEETH_BOTTOM)) {
            continue
        }
        if (renderList.proxies.has(ProxyType.Tongue) && idx === BaseMeshGroup.TOUNGE) {
            continue
        }

        // render
        const rgba = x[COLOR_INDEX] as number[]
        shaderShadedMono.setColor(gl, rgba)
        let offset = humanMesh.baseMesh.groups[idx].startIndex * WORD_LENGTH
        let length = humanMesh.baseMesh.groups[idx].length

        const mode = x[GLMODE_INDEX] as number
        renderList.base.drawSubset(mode, offset, length)
    }

    //
    // PROXIES
    //
    renderList.proxies.forEach((renderMesh, proxyType) => {
        let rgba: number[] = [0.5, 0.5, 0.5, alpha]
        if (proxyType !== ProxyType.Proxymeshes && wireframe) {
            gl.depthMask(false)
        } else {
            gl.depthMask(true)
        }
        switch (proxyType) {
            case ProxyType.Proxymeshes:
                return
                rgba = [1, 0.8, 0.7, alpha]
                break
            case ProxyType.Clothes:
                rgba = [0.5, 0.5, 0.5, alpha]
                break
            case ProxyType.Hair:
                rgba = [0.2, 0.1, 0.1, alpha]
                break
            case ProxyType.Eyes:
                return
                //     rgba = [0, 0.5, 1, alpha]
                break
            case ProxyType.Eyebrows:
                rgba = [0, 0, 0, alpha]
                break
            case ProxyType.Eyelashes:
                rgba = [0, 0, 0, alpha]
                break
            case ProxyType.Teeth:
                rgba = [1, 1, 1, alpha]
                break
            case ProxyType.Tongue:
                rgba = [1, 0, 0, alpha]
                break
        }
        shaderShadedMono.setColor(gl, rgba)
        renderMesh.draw(shaderShadedMono, gl.TRIANGLES)
    })

    //
    // TEXTURED SKIN
    //

    shaderShadedTexture.use(gl)
    // programTex.texture(view.bodyTexture!, alpha)
    view.bodyTexture.bind()
    if (!renderList.proxies.has(ProxyType.Proxymeshes)) {
        let offset = humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
        let length = humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        renderList.base.bind(shaderShadedTexture)
        renderList.base.drawSubset(gl.TRIANGLES, offset, length)
    }

    {
        // // if (!renderList.proxies.has(ProxyType.Proxymeshes)) {
        gl.depthMask(false) // must be false, otherwise the texture ain't visible
        const renderMesh = renderList.proxies.get(ProxyType.Eyes)!
        // programTex.texture(view.eyeTexture!, alpha)           
        view.eyeTexture.bind()
        renderMesh.bind(shaderShadedTexture)
        renderMesh.draw(shaderShadedTexture, gl.TRIANGLES)
    }

    // renderList.base.bind(programTex)

    // let offset = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex * WORD_LENGTH
    // let length = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].length
    // renderList.base.drawSubset(gl.TRIANGLES, offset, length)

    // offset = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex * WORD_LENGTH
    // length = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].length
    // renderList.base.drawSubset(gl.TRIANGLES, offset, length)
}