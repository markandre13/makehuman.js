import { BaseMeshGroup } from "../mesh/BaseMeshGroup"
import { HumanMesh } from "../mesh/HumanMesh"
import { RenderMode } from "./RenderMode"
import { RGBAShader } from "./shader/RGBAShader"
import { TextureShader } from "./shader/TextureShader"
import { ProxyType } from "proxy/Proxy"
import { RenderList } from "./RenderList"
import { cubeRotation } from "./render"
import { prepareCanvas, prepareViewport, createProjectionMatrix, createModelViewMatrix, createNormalMatrix } from "./util"

export function renderHuman(
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    programTex: TextureShader,
    texture: WebGLTexture,
    renderList: RenderList,
    scene: HumanMesh,
    renderMode: RenderMode,
    wireframe: boolean
): void {
    const WORD_LENGTH = 2

    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)
    const projectionMatrix = createProjectionMatrix(canvas)
    const modelViewMatrix = createModelViewMatrix(renderMode, cubeRotation)
    const normalMatrix = createNormalMatrix(modelViewMatrix)

    programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

    //
    // BASEMESH
    //
    renderList.base.bind(programRGBA)
    let skin
    if (wireframe) {
        skin = [BaseMeshGroup.SKIN, [1 / 5, 0.8 / 5, 0.7 / 5, 1], gl.LINES]
    } else {
        skin = [BaseMeshGroup.SKIN, [1, 0.8, 0.7, 1], gl.TRIANGLES]
    }

    const MESH_GROUP_INDEX = 0
    const COLOR_INDEX = 1
    const GLMODE_INDEX = 2
    for (let x of [
        skin,
        [BaseMeshGroup.EYEBALL0, [0, 0.5, 1, 1], gl.TRIANGLES],
        [BaseMeshGroup.EYEBALL1, [0, 0.5, 1, 1], gl.TRIANGLES],
        [BaseMeshGroup.TEETH_TOP, [1, 1, 1, 1], gl.TRIANGLES],
        [BaseMeshGroup.TEETH_BOTTOM, [1, 1, 1, 1], gl.TRIANGLES],
        [BaseMeshGroup.TOUNGE, [1, 0, 0, 1], gl.TRIANGLES],
        [BaseMeshGroup.CUBE, [1, 0, 0.5, 1], gl.LINE_STRIP],
    ]) {
        const idx = x[MESH_GROUP_INDEX] as number

        // skip rendering skin when in wireframe mode
        if (idx === BaseMeshGroup.SKIN && !wireframe) {
            continue
        }

        // skip rendering base mesh when there is a proxy
        if (renderList.proxies.has(ProxyType.Proxymeshes) && idx === BaseMeshGroup.SKIN) {
            continue
        }
        if (renderList.proxies.has(ProxyType.Eyes) &&
            (idx === BaseMeshGroup.EYEBALL0 || idx === BaseMeshGroup.EYEBALL1)) {
            continue
        }
        if (renderList.proxies.has(ProxyType.Teeth) &&
            (idx === BaseMeshGroup.TEETH_TOP || idx === BaseMeshGroup.TEETH_BOTTOM)) {
            continue
        }
        if (renderList.proxies.has(ProxyType.Tongue) && idx === BaseMeshGroup.TOUNGE) {
            continue
        }

        // render
        const rgba = x[COLOR_INDEX] as number[]
        programRGBA.setColor(rgba)
        let offset = scene.baseMesh.groups[idx].startIndex * WORD_LENGTH
        let length = scene.baseMesh.groups[idx].length

        const mode = x[GLMODE_INDEX] as number
        renderList.base.drawSubset(mode, offset, length)
    }

    //
    // JOINTS AND SKELETON
    //
    if (wireframe) {
        const NUMBER_OF_JOINTS = 124
        const offset = scene.baseMesh.groups[2].startIndex * WORD_LENGTH
        const count = scene.baseMesh.groups[2].length * NUMBER_OF_JOINTS

        programRGBA.setColor([1, 1, 1, 1])
        renderList.base.drawSubset(gl.TRIANGLES, offset, count)
        renderList.skeleton.draw(programRGBA, gl.LINES)
    }

    //
    // PROXIES
    //
    let glMode = wireframe ? gl.LINES : gl.TRIANGLES

    renderList.proxies.forEach((renderMesh, name) => {
        let rgba: number[] = [0.5, 0.5, 0.5, 1]
        switch (name) {
            case ProxyType.Proxymeshes:
                rgba = [1, 0.8, 0.7, 1]
                if (wireframe) {
                    rgba = [rgba[0] / 5, rgba[1] / 5, rgba[2] / 5, 1]
                }
                break
            case ProxyType.Clothes:
                rgba = [0.5, 0.5, 0.5, 1]
                break
            case ProxyType.Hair:
                rgba = [0.2, 0.1, 0.1, 1]
                break
            case ProxyType.Eyes:
                rgba = [0, 0.5, 1, 1]
                break
            case ProxyType.Eyebrows:
                rgba = [0, 0, 0, 1]
                break
            case ProxyType.Eyelashes:
                rgba = [0, 0, 0, 1]
                break
            case ProxyType.Teeth:
                rgba = [1, 1, 1, 1]
                break
            case ProxyType.Tongue:
                rgba = [1, 0, 0, 1]
                break
        }
        programRGBA.setColor(rgba)
        renderMesh.draw(programRGBA, glMode)
    })

    //
    // TEXTURED SKIN
    //
    if (!wireframe) {
        programTex.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programTex.texture(texture)
        if (renderList.proxies.has(ProxyType.Proxymeshes)) {
        } else {
            let offset = scene.baseMesh.groups[BaseMeshGroup.SKIN].startIndex * WORD_LENGTH
            let length = scene.baseMesh.groups[BaseMeshGroup.SKIN].length
            renderList.base.bind(programTex)
            renderList.base.drawSubset(gl.TRIANGLES, offset, length)
        }
    }

    // programTex.init(projectionMatrix, modelViewMatrix, normalMatrix)
    // programTex.texture(texture)
    // buffers.texCube.draw(programTex, gl.TRIANGLES)
}
