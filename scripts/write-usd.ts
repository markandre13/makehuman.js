/*
 * write human as it appears on start into human.usdc
 */

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { NodeJSFSAdapter } from "filesystem/NodeJSFSAdapter"
import { di } from "lib/di"
import { HumanMesh } from "mesh/HumanMesh"
import { exportUSDCCore } from "mesh/usdc"
import { WavefrontObj } from "mesh/WavefrontObj"
import { loadModifiers } from "modifier/loadModifiers"
import { MorphManager } from "modifier/MorphManager"
import { ARKitBlendshapeMesh } from "morphtool/ARKitBlendshapeMesh"
import { computeBlendshapes } from "morphtool/MorphRenderer"
import { writeFileSync } from "node:fs"
import { loadTextProxy, ProxyType } from "proxy/Proxy"
import { loadSkeleton } from "skeleton/loadSkeleton"

FileSystemAdapter.setInstance(new NodeJSFSAdapter())

di.single(ARKitBlendshapeMesh, () => new ARKitBlendshapeMesh())

console.log("loading assets...")
const morphManager = new MorphManager()
const obj = new WavefrontObj("3dobjs/base.obj")
const humanMesh = new HumanMesh(morphManager, obj)
const skeleton = loadSkeleton(humanMesh, "rigs/default.mhskel")
humanMesh.skeleton = skeleton
loadModifiers(morphManager, "modifiers/modeling_modifiers.json")
loadModifiers(morphManager, "modifiers/measurement_modifiers.json")

humanMesh.calculateVertexMorphed()
skeleton.updateJointPositions()
skeleton.build()
skeleton.update()
humanMesh.calculateVertexRigged()

const proxyFile = `teeth/teeth_base/teeth_base.mhclo`
humanMesh.proxies.set(ProxyType.Teeth, loadTextProxy(humanMesh, proxyFile, ProxyType.Teeth))

// WRITE AS USDC FILE

const blendshapes = computeBlendshapes(morphManager, skeleton, humanMesh)
const usdc = exportUSDCCore(humanMesh, blendshapes)

writeFileSync("human.usdc", Buffer.from(usdc))
