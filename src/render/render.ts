import { EnumModel } from "toad.js"
import { HumanMesh } from "../mesh/HumanMesh"
import { RenderMode } from "./RenderMode"
import { RGBAShader } from "./shader/RGBAShader"
import { TextureShader } from "./shader/TextureShader"
import { RenderMesh } from "./RenderMesh"
import { renderChordata } from "./renderChordata"
import { RenderList } from "./RenderList"
import { renderHuman } from "./renderHuman"
import { loadTexture } from "./util"
import { UpdateManager } from "UpdateManager"
import { Context } from "./Context"

// export let cubeRotation = 0.0

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE,
}

export function render(
    canvas: HTMLCanvasElement,
    overlay: HTMLElement,
    scene: HumanMesh,
    mode: EnumModel<RenderMode>,
    updateManager: UpdateManager
): void {
    const opt = {
        alpha: false,
        premultipliedAlpha: false,
    }

    const gl = (canvas.getContext("webgl2", opt) ||
        canvas.getContext("experimental-webgl", opt)) as WebGL2RenderingContext
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

    const ctx: Context = {
        rotateX: 0,
        rotateY: 0,
        projection: Projection.PERSPECTIVE,
    }

    const texture = loadTexture(gl, "data/skins/textures/young_caucasian_female_special_suit.png", () => paint(ctx))!
    // const texture = loadTexture(gl, "data/cubetexture.png")!

    // let lastRenderTime = 0

    // draw the scene repeatedly
    function renderFrame(now: number) {
        // now *= 0.001 // convert to seconds
        // const deltaTime = now - lastRenderTime
        // lastRenderTime = now

        const wireframe =
            mode.value === RenderMode.WIREFRAME ||
            ((mode.value === RenderMode.EXPRESSION || mode.value === RenderMode.POSE) && scene.wireframe.value)

        if (scene.changedProxy !== undefined) {
            if (scene.proxies.has(scene.changedProxy)) {
                const proxy = scene.proxies.get(scene.changedProxy)!
                renderList.proxies.set(
                    proxy.type,
                    new RenderMesh(gl, proxy.getCoords(scene.vertexRigged), proxy.mesh.fxyz)
                )
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
        switch (mode.value) {
            case RenderMode.CHORDATA:
                renderChordata(gl, programRGBA, overlay)
                break
            default:
                renderHuman(ctx, gl, programRGBA, programTex, texture, renderList, scene, mode.value, wireframe)
            // cubeRotation += deltaTime
        }
        // requestAnimationFrame(renderFrame)
    }
    requestAnimationFrame(renderFrame)

    const paint = (ctx: Context) => {
        requestAnimationFrame(renderFrame)
    }
    updateManager.render = () => paint(ctx)
    scene.human.modified.add( () => {
        updateManager.invalidateView()
    })
    scene.wireframe.modified.add( () => {
        updateManager.invalidateView() 
    })

    new ResizeObserver(() => paint(ctx)).observe(canvas)
    let downX = 0,
        downY = 0,
        buttonDown = false
    canvas.onpointerdown = (ev: PointerEvent) => {
        canvas.setPointerCapture(ev.pointerId)
        buttonDown = true
        downX = ev.x
        downY = ev.y
    }
    canvas.onpointerup = (ev: PointerEvent) => {
        buttonDown = false
    }
    canvas.onpointermove = (ev: PointerEvent) => {
        if (buttonDown) {
            const x = ev.x - downX
            const y = ev.y - downY
            if (x !== 0 || y !== 0) {
                ctx.rotateY += x
                ctx.rotateX += y
                downX = ev.x
                downY = ev.y
                requestAnimationFrame(() => paint(ctx))
            }
        }
    }
    window.onkeydown = (ev: KeyboardEvent) => {
        switch (ev.code) {
            case "Numpad1": // front orthographic
                if (ev.ctrlKey) {
                    // back
                    ctx.rotateX = 0
                    ctx.rotateY = 180
                } else {
                    // front
                    ctx.rotateY = 0
                    ctx.rotateX = 0
                }
                ctx.projection = Projection.ORTHOGONAL
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad7": // top orthographic
                if (ev.ctrlKey) {
                    // bottom
                    ctx.rotateX = -90
                    ctx.rotateY = 0
                } else {
                    // top
                    ctx.rotateX = 90
                    ctx.rotateY = 0
                }
                ctx.projection = Projection.ORTHOGONAL
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad3": // right orthographic
                if (ev.ctrlKey) {
                    // left
                    ctx.rotateX = 0
                    ctx.rotateY = -90
                } else {
                    // right
                    ctx.rotateX = 0
                    ctx.rotateY = 90
                }
                ctx.projection = Projection.ORTHOGONAL
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad4":
                ctx.rotateY -= 11.25
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad6":
                ctx.rotateY += 11.25
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad8":
                ctx.rotateX -= 11.25
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad2":
                ctx.rotateX += 11.25
                requestAnimationFrame(() => paint(ctx))
                break
            case "Numpad5": // toggle orthographic/perspective
                if (ctx.projection === Projection.ORTHOGONAL) {
                    ctx.projection = Projection.PERSPECTIVE
                } else {
                    ctx.projection = Projection.ORTHOGONAL
                }
                requestAnimationFrame(() => paint(ctx))
                break
        }
    }
}
