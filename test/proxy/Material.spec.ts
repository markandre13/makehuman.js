import { expect, use } from 'chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'
import { loadMaterial } from '../../src/proxy/Material'

describe("Material", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("loadMaterial()", () => {
        const material = loadMaterial("data/skins/default.mhmat", materialData)
        expect(material).to.deep.almost.equal(materialExpected)
    })
})

const materialData = `
# test material

name female_casualsuit01
tag MakeHuman™
ambientColor 1.0 1.0 1.0
diffuseColor 1.0 1.0 1.0
specularColor 0.0274509803922 0.0274509803922 0.0274509803922
shininess 0.1961
emissiveColor 0.0 0.0 0.0
opacity 1.0
translucency 0.0

// Enable auto skin tone blending based on ethnicity
autoBlendSkin true

sssEnabled true
sssRScale 4.0
sssGScale 2.0
sssBScale 1.0

shadeless False
wireframe False
transparent False
alphaToCoverage True
backfaceCull True
depthless False

castShadows True

receiveShadows True

diffuseTexture female_casualsuit01_diffuse.png
bumpTexture eyebrow001.png
normalmapTexture female_casualsuit01_normal.png
aomapTexture female_casualsuit01_ao.png
normalmapIntensity 1.0
aomapIntensity 1.0
displacementmapTexture fedora_displacement.png
displacementmapIntensity 0.2

shader data/shaders/glsl/litsphere

shaderParam litsphereTexture data/litspheres/lit_matte.png
shaderParam AdditiveShading 0.5
shaderParam displacementmapIntensity 0.2

shaderConfig ambientOcclusion True
shaderConfig normal True
shaderConfig bump False
shaderConfig displacement False
shaderConfig vertexColors True
shaderConfig spec False
shaderConfig transparency True
shaderConfig diffuse True
`

const materialExpected = {
    "name": "female_casualsuit01",
    "tags": [
        "MakeHuman™"
    ],
    "ambientColor": [1, 1, 1],
    "diffuseColor": [1, 1, 1],
    "specularColor": [0.0274509803922, 0.0274509803922, 0.0274509803922],
    "emissiveColor": [0, 0, 0],
    "aomapIntensity": 1,
    "displacementmapIntensity": 0.2,
    "normalmapIntensity": 1,
    "opacity": 1,
    "shininess": 0.1961,
    "translucency": 0,
    "alphaToCoverage": true,
    "autoBlendSkin": true,
    "backfaceCull": true,
    "castShadows": true,
    "receiveShadows": true,
    "depthless": false,
    "shadeless": false,
    "transparent": false,
    "wireframe": false,
    "aomapTexture": "female_casualsuit01_ao.png",
    "bumpTexture": "eyebrow001.png",
    "diffuseTexture": "female_casualsuit01_diffuse.png",
    "normalmapTexture": "female_casualsuit01_normal.png",
    "displacementmapTexture": "fedora_displacement.png",
    "sssEnabled": true,
    "sssBScale": 1,
    "sssGScale": 2,
    "sssRScale": 4,
    "shader": "data/shaders/glsl/litsphere",
    "shaderParam": {
        "litsphereTexture": "data/litspheres/lit_matte.png",
        "AdditiveShading": 0.5,
        "displacementmapIntensity": 0.2
    },
    "shaderConfig": {
        "ambientOcclusion": true,
        "normal": true,
        "bump": false,
        "displacement": false,
        "vertexColors": true,
        "spec": false,
        "transparency": true,
        "diffuse": true
    }
}