import { BaseMeshGroup } from "../mesh/BaseMeshGroup"
import { ProxyType } from "proxy/Proxy"
import { RenderHandler } from './RenderHandler'
import { Application } from "Application"
import { RenderMesh } from "./RenderMesh"
import { RenderView } from "./RenderView"
import { di } from "lib/di"
import { Texture } from "gl/Texture"

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
    const wireframe = app.wireframe.value

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

    interface MeshDefinition {
        group: BaseMeshGroup[],
        proxyType?: ProxyType,
        rgba: number[],
        baseTexture?: Texture,
        proxyTexture?: Texture,
        glMode: number
    }
    const meshDefinitions: MeshDefinition[] = [
        {
            group: [BaseMeshGroup.SKIN],
            proxyType: ProxyType.Proxymeshes,
            rgba: [1, 0.8, 0.7, alpha], glMode: gl.TRIANGLES,
            baseTexture: view.bodyTexture,
            proxyTexture: view.bodyTexture
        },
        {
            group: [BaseMeshGroup.EYEBALL0, BaseMeshGroup.EYEBALL1],
            proxyType: ProxyType.Eyes,
            rgba: [0, 0.5, 1, alpha], glMode: gl.TRIANGLES,
            baseTexture: view.bodyTexture,
            proxyTexture: view.eyeTexture
        },
        {
            group: [BaseMeshGroup.TEETH_TOP, BaseMeshGroup.TEETH_BOTTOM],
            proxyType: ProxyType.Teeth,
            rgba: [1, 1, 1, alpha], glMode: gl.TRIANGLES,
            baseTexture: view.bodyTexture,
        },
        {
            group: [BaseMeshGroup.TOUNGE],
            proxyType: ProxyType.Tongue,
            rgba: [1, 0, 0, alpha], glMode: gl.TRIANGLES,
            baseTexture: view.bodyTexture,
        },
        { group: [BaseMeshGroup.CUBE], rgba: [1, 0, 0.5, alpha], glMode: gl.LINE_STRIP },
    ]

    for (let def of meshDefinitions) {
        if (def.proxyType === undefined || !renderList.proxies.has(def.proxyType)) {
            //
            // render from base mesh
            //
            for (const group of def.group) {
                let offset = humanMesh.baseMesh.groups[group].startIndex * WORD_LENGTH
                let length = humanMesh.baseMesh.groups[group].length
                if (def.baseTexture !== undefined) {
                    shaderShadedTexture.use(gl)
                    // gl.depthMask(false) // must be false, otherwise the texture ain't visible WHUT????
                    if (def.proxyType !== ProxyType.Proxymeshes) {
                        gl.depthMask(false)
                    } else {
                        gl.depthMask(true)
                    }

                    def.baseTexture.bind()
                    renderList.base.bind(shaderShadedTexture)
                    renderList.base.drawSubset(def.glMode, offset, length)
                } else {
                    // if (group !== BaseMeshGroup.SKIN && wireframe) {
                    //     gl.depthMask(false)
                    // } else {
                    gl.depthMask(true)
                    // }

                    shaderShadedMono.use(gl)
                    shaderShadedMono.setColor(gl, def.rgba)

                    renderList.base.bind(shaderShadedMono)
                    renderList.base.drawSubset(def.glMode, offset, length)
                }
            }
        } else {
            //
            // render from proxy mesh
            //
            if (def.proxyType === undefined) {
                continue
            }
            // render from proxy
            // console.log(`render proxy ${ProxyType[def.proxyType]}`)
            const renderMesh = renderList.proxies.get(def.proxyType)!

            if (def.proxyTexture !== undefined) {
                shaderShadedTexture.use(gl)
                // gl.depthMask(false) // must be false, otherwise the texture ain't visible WHUT????
                if (def.proxyType !== ProxyType.Proxymeshes) {
                    gl.depthMask(false)
                } else {
                    gl.depthMask(true)
                }

                def.proxyTexture.bind()
                renderMesh.bind(shaderShadedTexture)
                renderMesh.draw(shaderShadedTexture, gl.TRIANGLES)
            } else {
                // if (def.proxyType !== ProxyType.Proxymeshes && wireframe) {
                //     gl.depthMask(false)
                // } else {
                gl.depthMask(true)
                // }
                shaderShadedMono.use(gl)
                shaderShadedMono.setColor(gl, def.rgba)
                renderMesh.draw(shaderShadedMono, gl.TRIANGLES)
            }
        }
    }

    //
    // TEXTURED SKIN
    //

    // shaderShadedTexture.use(gl)
    // // programTex.texture(view.bodyTexture!, alpha)
    // view.bodyTexture.bind()
    // if (!renderList.proxies.has(ProxyType.Proxymeshes)) {
    //     let offset = humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
    //     let length = humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
    //     renderList.base.bind(shaderShadedTexture)
    //     renderList.base.drawSubset(gl.TRIANGLES, offset, length)
    // }

    // if (renderList.proxies.has(ProxyType.Eyes)) {
    //     gl.depthMask(false) // must be false, otherwise the texture ain't visible
    //     const renderMesh = renderList.proxies.get(ProxyType.Eyes)!
    //     // programTex.texture(view.eyeTexture!, alpha)           
    //     view.eyeTexture.bind()
    //     renderMesh.bind(shaderShadedTexture)
    //     renderMesh.draw(shaderShadedTexture, gl.TRIANGLES)
    // }

    // renderList.base.bind(programTex)

    // let offset = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex * WORD_LENGTH
    // let length = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].length
    // renderList.base.drawSubset(gl.TRIANGLES, offset, length)

    // offset = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex * WORD_LENGTH
    // length = humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].length
    // renderList.base.drawSubset(gl.TRIANGLES, offset, length)
}