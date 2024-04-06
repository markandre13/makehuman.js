import { EnumModel } from "toad.js"
import { HumanMesh } from "../mesh/HumanMesh"
import { RenderMode } from "./RenderMode"
import { RGBAShader } from "./shader/RGBAShader"
import { TextureShader } from "./shader/TextureShader"
import { RenderMesh } from "./RenderMesh"
import { renderChordata } from "../chordata/renderChordata"
import { RenderList } from "./RenderList"
import { renderHuman } from "./renderHuman"
import { loadTexture } from "./util"
import { UpdateManager } from "UpdateManager"
import { Context } from "./Context"
import { ChordataSettings } from "chordata/ChordataSettings"
import { renderFace } from "./renderFace"

// export let cubeRotation = 0.0

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE,
}
