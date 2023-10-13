import { EnumModel } from "toad.js"
import { HumanMesh, Update } from "../mesh/HumanMesh"
import { RenderMode } from "./RenderMode"
import { RGBAShader } from "./shader/RGBAShader"
import { TextureShader } from "./shader/TextureShader"
import { RenderMesh } from "./RenderMesh"
import { renderChordata } from "./renderChordata"
import { RenderList } from "./RenderList"
import { renderHuman } from "./renderHuman"
import { loadTexture } from "./util"
import { UpdateManager } from "UpdateManager"

export let cubeRotation = 0.0

export function render(
    canvas: HTMLCanvasElement,
    overlay: HTMLElement,
    scene: HumanMesh,
    mode: EnumModel<RenderMode>,
    updateManager: UpdateManager
    ): void {
    const gl = (canvas.getContext("webgl2") || canvas.getContext("experimental-webgl")) as WebGL2RenderingContext
    if (gl == null) {
        throw Error("Unable to initialize WebGL. Your browser or machine may not support it.")
    }

    // flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    const programRGBA = new RGBAShader(gl)
    const programTex = new TextureShader(gl)

    // const texCube = createTexturedCubeRenderer(gl)
    const renderList = new RenderList(gl, scene)
    updateManager.setRenderList(renderList)
    // initCone(gl)

    const texture = loadTexture(gl, "data/skins/textures/young_caucasian_female_special_suit.png")!
    // const texture = loadTexture(gl, "data/cubetexture.png")!

    let lastRenderTime = 0
    
    // draw the scene repeatedly
    function renderFrame(now: number) {
        now *= 0.001 // convert to seconds
        const deltaTime = now - lastRenderTime
        lastRenderTime = now
        
        const wireframe = mode.value === RenderMode.WIREFRAME || (mode.value === RenderMode.EXPRESSION && scene.wireframe.value)

        if (scene.changedProxy !== undefined) {
            if (scene.proxies.has(scene.changedProxy)) {
                const proxy = scene.proxies.get(scene.changedProxy)!
                renderList.proxies.set(proxy.type, new RenderMesh(gl, proxy.getCoords(scene.vertexRigged), proxy.mesh.fxyz))
            } else {
                renderList.proxies.delete(scene.changedProxy)
            }
            scene.changedProxy = undefined
        }

        updateManager.updateIt()

        // if (scene.updateRequired !== Update.NONE) {
        //     renderList.update()
        //     // updateBuffers(scene, buffers)
        // }
        switch(mode.value) {
            case RenderMode.CHORDATA:
                renderChordata(gl, programRGBA, overlay)
                break
            default:
                renderHuman(gl, programRGBA, programTex, texture, renderList, scene, mode.value, wireframe)
                cubeRotation += deltaTime
        }
        requestAnimationFrame(renderFrame)
    }
    requestAnimationFrame(renderFrame)
}
