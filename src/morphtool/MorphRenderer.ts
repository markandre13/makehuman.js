import { Application } from 'Application'
import { RenderHandler } from 'render/RenderHandler'
import { ARKitFlat } from './ARKitFlat'
import { MorphToolModel } from './MorphToolModel'
import { MHFlat } from './MHFlat'
import { RenderView } from 'render/RenderView'
import { di } from 'lib/di'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { IndexBuffer } from 'gl/buffers/IndexBuffer'
import { PickColorBuffer } from 'gl/buffers/PickColorBuffer'
import { SelectionColorBuffer } from 'gl/buffers/SelectionColorBuffer'
import { FlatMesh } from './FlatMesh'
import { trianglesToEdges } from "gl/algorithms/trianglesToEdges"
import { quadsToEdges } from "gl/algorithms/quadsToEdges"
import { BaseMeshGroup } from 'mesh/BaseMeshGroup'
import { FaceARKitLoader } from 'mediapipe/FaceARKitLoader'
import { mat4, vec3 } from 'gl-matrix'
import { deg2rad } from 'gl/algorithms/deg2rad'
import { projectPointOntoPlane } from 'gl/algorithms/projectPointOntoPlane'
import { calculateNormalsTriangles } from 'gl/algorithms/calculateNormalsTriangles'
import { calculateNormalsQuads } from 'gl/algorithms/calculateNormalsQuads'
import { intersectLineAndPlane } from 'gl/algorithms/intersectLineAndPlane'
import { projectLineOntoPlane } from 'gl/algorithms/projectLineOntoPlane'

interface PickMesh {
    flat: FlatMesh
    indicesAllPoints: IndexBuffer
    indicesAllEdges: IndexBuffer
    vertices: VertexBuffer
    pickColors: PickColorBuffer
    selectionColors: SelectionColorBuffer
}

export class MorphRenderer extends RenderHandler {
    // arkit?: FaceARKitLoader
    private app: Application
    private model: MorphToolModel

    private distanceIndex?: IndexBuffer
    private distanceVertex?: VertexBuffer

    pickMeshes!: PickMesh[]

    constructor(app: Application, model: MorphToolModel) {
        super()
        this.app = app
        this.model = model
        model.isARKitActive.signal.add(app.glview.invalidate)
        model.showBothMeshes.signal.add(app.glview.invalidate)
        model.isTransparentActiveMesh.signal.add(app.glview.invalidate)

        const jaw = this.app.skeleton.getBone("jaw")!
        jaw.matUserPoseRelative = mat4.fromXRotation(mat4.create(), deg2rad(12))
        this.app.updateManager.updateFromLocalSettingsWithoutGL()
    }
    override defaultCamera() {
        return this.app.headCamera
    }
    override paint(app: Application, view: RenderView): void {
        const gl = view.gl
        if (this.app.updateManager.updateFromLocalSettingsWithoutGL()) {
            this.pickMeshes[0].vertices.update(app.humanMesh.vertexRigged)
            this.pickMeshes[0].flat.update()
            if (this.model.showMapping.value) {
                this.calculateDistance(gl)
            }
        }

        // prepare
        const shaderShadedMono = view.shaderShadedMono

        if (this.pickMeshes === undefined) {
            this.initPickMeshes(app, view)
        }
        view.prepareCanvas()

        // TODO: make this a debug option
        // this.drawVerticesToPick(view)
        // return

        const { projectionMatrix, modelViewMatrix, normalMatrix } = view.prepare()
        shaderShadedMono.init(gl, projectionMatrix, modelViewMatrix, normalMatrix)
        gl.depthMask(true)
        const alpha = 0.25

        const [activeMesh, inactiveMesh] = this.model.isARKitActive.value
            ? [this.pickMeshes[1], this.pickMeshes[0]]
            : [this.pickMeshes[0], this.pickMeshes[1]]

        // draw the active mesh as solid
        if (this.model.isTransparentActiveMesh.value) {
            gl.depthMask(false)
            gl.disable(gl.CULL_FACE)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 0.75])
            activeMesh.flat.bind(shaderShadedMono)
            activeMesh.flat.draw(gl)
            gl.depthMask(true)
        } else {
            gl.enable(gl.CULL_FACE)
            gl.cullFace(gl.BACK)
            gl.disable(gl.BLEND)

            shaderShadedMono.setColor(gl, [1, 0.8, 0.7, 1])
            activeMesh.flat.bind(shaderShadedMono)
            activeMesh.flat.draw(gl)
        }

        // draw inactive mesh as transparent
        if (this.model.showBothMeshes.value) {
            // disable writing to z-buffer so that it does not hide the selection
            gl.depthMask(false)
            gl.disable(gl.CULL_FACE)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            shaderShadedMono.setColor(gl, [0, 0.5, 1, alpha])
            inactiveMesh.flat.bind(shaderShadedMono)
            inactiveMesh.flat.draw(gl)
            gl.depthMask(true)
        }

        // draw selection (edges and vertices)
        // const activeMesh = this.model.isARKitActive.value ? this.pickMeshes[1] : this.pickMeshes[0]
        const shaderColored = view.shaderColored
        shaderColored.use(gl)
        shaderColored.setPointSize(gl, 4.5)
        shaderColored.setProjection(gl, projectionMatrix)
        shaderColored.setModelView(gl, modelViewMatrix)

        activeMesh.vertices.bind(shaderColored)
        activeMesh.selectionColors.bind(shaderColored)

        activeMesh.indicesAllPoints.bind()
        activeMesh.indicesAllPoints.drawPoints()

        activeMesh.indicesAllEdges.bind()
        activeMesh.indicesAllEdges.drawLines()

        if (this.model.showMapping.value && this.distanceIndex !== undefined) {
            const shaderMono = view.shaderMono
            shaderMono.use(gl)
            shaderMono.setProjection(gl, projectionMatrix)
            shaderMono.setModelView(gl, modelViewMatrix)
            shaderMono.setPointSize(gl, 5)
            shaderMono.setColor(gl, [1, 0, 0, 1])
            this.distanceVertex!.bind(shaderMono)
            this.distanceIndex.bind()
            this.distanceIndex.drawLines()
        }
    }

    private initPickMeshes(app: Application, view: RenderView) {
        const gl = view.gl
        // TODO: don't let them use RenderMesh and re-use data for the picking
        const mh = new MHFlat(app, gl)
        const ak = new ARKitFlat(gl)

        // const copy = new Float32Array(ak.vertexFlat)
        // const t = ak.getTarget(Blendshape.jawOpen)!
        // t.apply(copy, 0.5)
        // ak.renderMesh.update(copy)

        const mhVertices = new VertexBuffer(gl, app.humanMesh.vertexRigged)
        // get all the quads for the skin mesh
        const mhSkinQuadIndices = app.humanMesh.baseMesh.fxyz.slice(
            app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
            app.humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length
        )
        const mhUniqueIndexSet = new Set<number>
        for (const index of mhSkinQuadIndices) {
            mhUniqueIndexSet.add(index)
        }
        // TODO: optimize ARKit
        const arobj = di.get(FaceARKitLoader).neutral!

        const arVertices = new VertexBuffer(gl, ak.vertexOrig) // this version is already pre-scaled and translated

        this.pickMeshes = [{
            flat: mh,
            vertices: mhVertices,
            indicesAllPoints: new IndexBuffer(gl, Array.from(mhUniqueIndexSet)),
            indicesAllEdges: quadsToEdges(gl, mhSkinQuadIndices),
            pickColors: new PickColorBuffer(mhVertices),
            selectionColors: new SelectionColorBuffer(mhVertices)
        }, {
            flat: ak,
            vertices: arVertices,
            indicesAllPoints: indicesForAllVertices(arVertices),
            indicesAllEdges: trianglesToEdges(gl, arobj.fxyz), // this is too much
            pickColors: new PickColorBuffer(arVertices),
            selectionColors: new SelectionColorBuffer(arVertices)
        }]
        this.pickMeshes[0].selectionColors.rgb = [1, 0.75, 0]
        this.pickMeshes[1].selectionColors.rgb = [0, 1, 1]

        this.calculateDistance(gl)
    }

    /**
     * for each MH face vertex normal, find nearest ARKit intersection
     */
    calculateDistance(gl: WebGL2RenderingContext) {
        const loader = di.get(FaceARKitLoader).preload()
        const triangles = loader.neutral!.fxyz

        const outXYZ: number[] = []
        const outFXYZ: number[] = []

        const normalData = new Float32Array(this.pickMeshes[0].vertices.data.length)
        calculateNormalsQuads(
            normalData,
            this.pickMeshes[0].vertices.data,
            this.app.humanMesh.baseMesh.fxyz
        )
        const normals = new VertexBuffer(gl, normalData)

        for (const mhFaceIndex of mhFaceIndices) {
            let match
            let arFaceIndex
            const P = this.pickMeshes[0].vertices.get(mhFaceIndex)
            const N = normals.get(mhFaceIndex)
            for (let i = 0; i < triangles.length;) {
                let i0 = triangles[i++]
                let i1 = triangles[i++]
                let i2 = triangles[i++]
                const O = this.pickMeshes[1].vertices.get(i0)
                const A = this.pickMeshes[1].vertices.get(i1)
                const B = this.pickMeshes[1].vertices.get(i2)
                vec3.sub(A, A, O)
                vec3.sub(B, B, O)
                const p = projectLineOntoPlane(P, N, O, A, B)
                // if (p) {
                //     maxD = Math.max(maxD, Math.abs(p.d))
                // }
                // NOTE: the Math.abs(p.d) < 0.1 is to suppress the most annoying errors
                if (p && Math.abs(p.d) < 0.1 && p.a >= 0 && p.b >= 0 && p.a + p.b <= 1) {
                    if (match) {
                        if (Math.abs(p.d) < Math.abs(match.d)) {
                            arFaceIndex = i
                            match = p
                        }
                    } else {
                        arFaceIndex = i
                        match = p
                    }
                }
            }
            if (match) {
                // line from P to match.R
                outFXYZ.push(outXYZ.length / 3)
                outXYZ.push(...P)
                outFXYZ.push(outXYZ.length / 3)
                outXYZ.push(...match.P)
            }
        }
        if (this.distanceIndex) {
            this.distanceIndex!.update(outFXYZ)
            this.distanceVertex!.update(outXYZ)
        } else {
            this.distanceIndex = new IndexBuffer(gl, outFXYZ)
            this.distanceVertex = new VertexBuffer(gl, outXYZ)
        }
    }

    /**
     * for each MH face vertex, find nearest ARKit intersection
     */
    calculateDistanceOld(gl: WebGL2RenderingContext) {

        let matchCount = 0
        const loader = di.get(FaceARKitLoader).preload()
        const triangles = loader.neutral!.fxyz

        const outXYZ: number[] = []
        const outFXYZ: number[] = []
        let maxD = 0
        // for all the vertices in MH ... just the face?
        for (const mhFaceIndex of mhFaceIndices) {
            const P = this.pickMeshes[0].vertices.get(mhFaceIndex)
            // find a point in ARKit
            let match
            let arFaceIndex
            for (let i = 0; i < triangles.length;) {
                let i0 = triangles[i++]
                let i1 = triangles[i++]
                let i2 = triangles[i++]
                const O = this.pickMeshes[1].vertices.get(i0)
                const A = this.pickMeshes[1].vertices.get(i1)
                const B = this.pickMeshes[1].vertices.get(i2)
                vec3.sub(A, A, O)
                vec3.sub(B, B, O)
                const p = projectPointOntoPlane(P, O, A, B)
                if (p) {
                    maxD = Math.max(maxD, Math.abs(p.d))
                }
                // NOTE: the Math.abs(p.d) < 0.1 is to suppress the most annoying errors
                if (p && Math.abs(p.d) < 0.1 && p.a >= 0 && p.b >= 0 && p.a + p.b <= 1) {
                    if (match) {
                        if (Math.abs(p.d) < Math.abs(match.d)) {
                            arFaceIndex = i
                            match = p
                        }
                    } else {
                        arFaceIndex = i
                        match = p
                    }
                }
            }
            if (match) {
                ++matchCount
                // line from P to match.R
                outFXYZ.push(outXYZ.length / 3)
                outXYZ.push(...P)
                outFXYZ.push(outXYZ.length / 3)
                outXYZ.push(...match.R)
            }
        }
        // outFXYZ.length = 2
        if (this.distanceIndex) {
            this.distanceIndex!.update(outFXYZ)
            this.distanceVertex!.update(outXYZ)
        } else {
            this.distanceIndex = new IndexBuffer(gl, outFXYZ)
            this.distanceVertex = new VertexBuffer(gl, outXYZ)
        }
        console.log(`maxD=${maxD}`)
        // console.log(`MorphRenderer::calculateMapping(): matched ${matchCount} ARKit triangles with ${mhFaceIndices.length} MH face vertices`)
    }

    // we need to do the following
    // * when a mesh group is selected
    //   set the selection colors
    // * when a point is toggled
    //   ...
    // THIS CLASS:
    //   get/set selected indices.
    //   the rest is handled by the MorphTool
    //   SelectionColorBuffer should track the indices on it's own in a set
    //   and allow to set a single color for all selected vertices

    toggle(index: number) {
        const [activeMesh, inactiveMesh] = this.model.isARKitActive.value
            ? [this.pickMeshes[1], this.pickMeshes[0]]
            : [this.pickMeshes[0], this.pickMeshes[1]]
        activeMesh.selectionColors.toggle(index)
    }
    get selection() {
        const result = {
            mh: this.pickMeshes[0].selectionColors.array,
            extern: this.pickMeshes[1].selectionColors.array,
        }
        return result
    }
    set selection(selection: { mh: number[], extern: number[] } | undefined) {
        if (selection === undefined) {
            this.pickMeshes[0].selectionColors.clear()
            this.pickMeshes[1].selectionColors.clear()
        } else {
            this.pickMeshes[0].selectionColors.array = selection.mh
            this.pickMeshes[1].selectionColors.array = selection.extern
        }
        this.app.glview.invalidate()
    }
    drawVerticesToPick(view: RenderView) {
        const gl = this.app.glview.gl
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)

        // prepare with black background
        const oldBg = view.ctx.background
        view.ctx.background = [0, 0, 0, 1]
        const { projectionMatrix, modelViewMatrix } = this.app.glview.prepare()
        view.ctx.background = oldBg

        const mesh = this.model.isARKitActive.value ? this.pickMeshes[1] : this.pickMeshes[0]

        // paint mesh in black
        const shaderMono = view.shaderMono
        shaderMono.use(gl)
        shaderMono.setProjection(gl, projectionMatrix)
        shaderMono.setModelView(gl, modelViewMatrix)
        shaderMono.setColor(gl, [0, 0, 0, 1])
        mesh.flat.bind(shaderMono)
        mesh.flat.draw(gl)

        // paint vertices
        const shaderColored = view.shaderColored
        shaderColored.use(gl)
        shaderColored.setPointSize(gl, 4.5)
        shaderColored.setProjection(gl, projectionMatrix)
        shaderColored.setModelView(gl, modelViewMatrix)
        mesh.indicesAllPoints.bind()
        mesh.vertices.bind(shaderColored)
        mesh.pickColors.bind(shaderColored)
        mesh.indicesAllPoints.drawPoints()
    }
}

function indicesForAllVertices(verts: VertexBuffer) {
    const buffer = new Uint16Array(verts.data.length / 3)
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = i
    }
    return new IndexBuffer(verts.gl, buffer)
}

const mhFaceIndices = [870, 867, 868, 5098, 869, 895, 871, 894, 3698, 917, 5294, 5293, 5292, 5291, 5296, 11897, 912, 11898, 11899, 11900, 10366, 7617, 7595, 7619, 7596, 7597, 7614, 7574, 7573, 7572, 7575, 7576, 7040, 5244, 5245, 5232, 5230, 5234, 5229, 5231, 5243, 11852, 11853, 11841, 11840, 11838, 11839, 11843, 271, 915, 5241, 5240, 737, 5238, 5242, 5246, 5236, 5235, 5402, 5411, 859, 12001, 7564, 12010, 736, 910, 270, 5092, 269, 268, 5237, 267, 5195, 5198, 264, 5239, 5233, 265, 266, 242, 241, 239, 240, 5196, 5190, 5197, 5191, 5200, 5199, 250, 252, 251, 11804, 244, 3750, 5320, 237, 5193, 5202, 5201, 5203, 5204, 735, 5299, 5298, 5300, 5208, 5151, 5152, 5154, 5206, 5205, 5177, 5176, 5179, 5180, 5183, 5182, 5185, 5189, 5188, 5186, 718, 3740, 5264, 5263, 717, 3741, 719, 3742, 720, 716, 3744, 5260, 232, 225, 3743, 5261, 262, 261, 5262, 255, 254, 253, 260, 256, 263, 5187, 257, 5329, 5184, 258, 5328, 5327, 5181, 5091, 5221, 5220, 5168, 5167, 5215, 5214, 5297, 5295, 5224, 5223, 5165, 5172, 5226, 5170, 5169, 5227, 5228, 5174, 5290, 5153, 5301, 5289, 5287, 5302, 5286, 5288, 5173, 5140, 5218, 5207, 5178, 259, 902, 5175, 5326, 5325, 5324, 5323, 5066, 219, 5133, 5305, 5304, 5065, 5331, 5333, 715, 714, 713, 5194, 243, 245, 5192, 7021, 7020, 7011, 7010, 11807, 7436, 10415, 11923, 7003, 6997, 6980, 7015, 11805, 7014, 10416, 11873, 7008, 7006, 6983, 7001, 234, 228, 208, 204, 206, 224, 231, 5259, 3745, 3746, 896, 229, 222, 223, 230, 5318, 3747, 3748, 5265, 236, 233, 235, 238, 5319, 3749, 10417, 11924, 7009, 133, 5054, 11670, 7061, 7060, 11671, 5052, 5053, 292, 5050, 277, 338, 5057, 5131, 5096, 5094, 280, 278, 5070, 899, 293, 294, 291, 5134, 290, 289, 199, 162, 5064, 119, 5090, 123, 122, 177, 176, 178, 207, 212, 211, 210, 215, 216, 217, 5089, 218, 901, 213, 192, 7457, 11849, 517, 523, 5141, 900, 5258, 5145, 5149, 5155, 5212, 5216, 5217, 5210, 5213, 5166, 5222, 5159, 5160, 897, 5161, 5163, 3699, 3700, 725, 712, 5144, 3739, 5143, 5142, 5156, 5164, 5157, 731, 485, 479, 722, 728, 723, 5158, 401, 898, 734, 721, 730, 729, 400, 399, 3701, 380, 5225, 11830, 11831, 11832, 11779, 11780, 11824, 11781, 5211, 5171, 5162, 733, 724, 491, 5337, 5336, 486, 492, 7241, 11940, 7240, 7446, 7453, 11771, 11823, 189, 188, 193, 194, 195, 5087, 906, 7007, 227, 205, 180, 181, 209, 221, 220, 6995, 6984, 6957, 6956, 6953, 11802, 7437, 10414, 7598, 190, 179, 173, 160, 159, 158, 186, 185, 187, 5099, 196, 905, 908, 5150, 5148, 5068, 5075, 5321, 5322, 5332, 5049, 5147, 5067, 5146, 5136, 5330, 5135, 372, 5060, 5059, 5250, 184, 5069, 203, 5253, 5252, 182, 5257, 5256, 281, 202, 5254, 5255, 5093, 5088, 197, 161, 5251, 5058, 907, 5307, 909, 116, 115, 114, 120, 121, 127, 129, 125, 5061, 904, 903, 183, 191, 5249, 140, 5303, 5209, 77, 4885, 38, 4884, 40, 39, 4859, 5078, 4883, 5076, 28, 4856, 14, 13, 4852, 10, 11, 150, 137, 214, 198, 279, 5219, 138, 376, 711, 379, 3738, 378, 377, 374, 5341, 5056, 284, 283, 282, 340, 339, 5051, 337, 5055, 336, 319, 5095, 287, 335, 367, 318, 358, 5137, 5363, 5346, 5073, 359, 360, 286, 326, 323, 285, 333, 314, 5138, 5345, 5344, 5074, 7264, 7265, 518, 519, 462, 459, 453, 470, 471, 472, 5362, 469, 473, 474, 7229, 7228, 7227, 418, 433, 3732, 431, 432, 3707, 444, 438, 443, 3706, 429, 5353, 449, 7226, 11964, 7225, 7179, 7178, 7193, 10400, 7191, 7192, 10375, 7204, 7197, 7230, 7236, 7242, 493, 487, 481, 475, 516, 5360, 515, 514, 522, 521, 520, 7267, 7268, 7261, 7262, 11962, 7263, 7266, 7206, 7205, 10376, 7195, 7194, 10399, 7196, 7180, 7181, 421, 420, 436, 3731, 434, 435, 437, 446, 445, 3708, 465, 468, 7224, 7221, 7218, 7213, 11955, 7209, 7177, 7176, 7247, 7246, 7253, 11963, 7254, 7255, 7256, 7257, 509, 508, 507, 506, 505, 5361, 7248, 7187, 7174, 7172, 7184, 7167, 7168, 7123, 7135, 7173, 7175, 7208, 7207, 11953, 11954, 7212, 7211, 368, 5339, 276, 295, 296, 297, 200, 163, 5062, 128, 134, 135, 131, 5063, 164, 201, 6909, 6913, 6912, 11679, 6941, 6976, 7059, 7601, 7063, 7067, 302, 301, 300, 275, 299, 305, 306, 307, 7071, 7075, 312, 311, 310, 304, 309, 322, 364, 274, 298, 303, 308, 313, 324, 321, 365, 327, 328, 329, 330, 331, 332, 334, 5139, 320, 325, 315, 316, 497, 419, 417, 504, 448, 447, 410, 5340, 5364, 5354, 5351, 5352, 375, 411, 413, 415, 363, 408, 407, 3737, 402, 369, 361, 403, 423, 422, 3736, 424, 412, 414, 498, 416, 427, 499, 430, 3735, 3734, 3733, 425, 500, 428, 501, 426, 5338, 3702, 3703, 3704, 3705, 503, 442, 404, 441, 373, 371, 405, 440, 439, 502, 476, 510, 477, 478, 406, 370, 5335, 480, 484, 483, 511, 482, 490, 489, 512, 488, 494, 513, 495, 496, 7245, 7244, 7260, 7243, 7237, 7259, 7238, 7239, 7235, 11939, 7234, 7445, 7450, 11772, 11825, 11773, 7454, 7444, 7161, 7130, 7166, 7233, 7232, 7258, 7231, 126, 130, 168, 167, 166, 165, 118, 124, 169, 136, 132, 117, 5100, 5086, 5306, 139, 76, 37, 34, 35, 1068, 6774, 6776, 6777, 6778, 6772, 6771, 1067, 1066, 1065, 5101, 1063, 1064, 1062, 1061, 1060, 1059, 1058, 1069, 1070, 1071, 5102, 6782, 36, 4890, 75, 4858, 33, 6770, 6783, 6779, 6780, 6781, 6758, 6759, 6760, 6761, 6762, 1057, 0, 6, 9, 12, 4850, 4851, 4849, 7, 8, 4876, 4896, 4897, 5, 4, 2, 4848, 4847, 3, 55, 4865, 54, 4874, 58, 172, 170, 171, 174, 175, 156, 94, 93, 155, 152, 90, 151, 89, 153, 91, 154, 92, 4898, 144, 82, 4877, 145, 83, 4878, 41, 43, 42, 4886, 78, 88, 32, 4882, 31, 5077, 5127, 30, 4857, 26, 4880, 85, 84, 146, 147, 86, 148, 87, 149, 5085, 5083, 5129, 29, 4881, 4879, 20, 17, 16, 15, 18, 4853, 19, 4854, 21, 24, 4855, 25, 4860, 141, 4887, 79, 4895, 23, 22, 27, 1, 57, 60, 4867, 4866, 59, 56, 157, 95, 4875, 103, 108, 113, 109, 62, 61, 4891, 104, 110, 111, 112, 5247, 143, 107, 99, 96, 101, 44, 4861, 47, 4862, 50, 5080, 53, 72, 69, 4872, 100, 4893, 4894, 5132, 5084, 5082, 5130, 5081, 5079, 5128, 4863, 49, 46, 45, 48, 4889, 80, 142, 5248, 347, 344, 354, 353, 352, 351, 350, 349, 348, 366, 345, 346, 452, 458, 461, 464, 467, 7223, 7220, 7217, 7216, 7219, 7222, 466, 463, 460, 457, 451, 5334, 409, 456, 450, 355, 288, 356, 357, 454, 5343, 5071, 342, 341, 343, 317, 7079, 7104, 11687, 11945, 7118, 7214, 455, 362, 5342, 5072, 7074, 7078, 7103, 11689, 11946, 7117, 7210, 7215, 7116, 11938, 7169, 11966, 11956, 11943, 7171, 7170, 7128, 7190, 10403, 10404, 10405, 11942, 7129, 7162, 7182, 7185, 7186, 10372, 7198, 7251, 7199, 7200, 7165, 7131, 7133, 7122, 7163, 7183, 10371, 10370, 11941, 7164, 7201, 7202, 7252, 10373, 7250, 7249, 10402, 10401, 7188, 7189, 10374, 7203, 6944, 6908, 6904, 6910, 6914, 6945, 6950, 6947, 6930, 6874, 11515, 6789, 6787, 11465, 6877, 6933, 6951, 6942, 6943, 6902, 6897, 6893, 6898, 6899, 6905, 6911, 6906, 6900, 6895, 6894, 6889, 6888, 6892, 6935, 6934, 6878, 11492, 11513, 6840, 6839, 11483, 4864, 52, 51, 4888, 81, 4871, 4868, 64, 65, 105, 106, 98, 4892, 71, 73, 70, 4870, 4869, 67, 68, 74, 4873, 66, 63, 102, 6907, 6903, 6879, 11493, 6843, 6842, 11484, 6846, 6845, 11485, 6887, 11509, 6885, 6884, 11490, 11486, 6848, 6849, 11511, 6880, 6979, 6981, 6998, 6954, 6948, 6931, 11494, 6875, 6873, 6929, 6946, 6952, 6955, 6949, 6932, 6876, 11514, 6788, 6786, 11466, 6784, 13352, 6785, 6838, 6841, 13353, 13358, 6790, 13357, 6793, 11468, 11467, 6791, 6792, 11516, 6795, 6794, 6797, 6798, 11495, 6866, 6922, 6938, 6966, 6923, 6937, 13359, 13371, 6844, 13369, 13364, 6886, 6847, 6890, 7070, 7062, 7066, 7044, 7045, 7097, 7127, 6834, 11480, 6830, 6829, 11505, 6863, 6919, 11820, 6828, 6831, 11481, 6833, 6832, 11507, 6864, 6920, 11699, 11697, 11745, 11696, 11694, 11743, 11482, 6836, 6835, 11506, 6865, 11479, 6827, 6826, 11504, 6862, 6918, 11829, 11857, 11677, 6968, 7610, 6967, 6917, 6861, 6823, 6824, 11478, 11502, 11503, 6822, 6821, 11477, 6860, 6916, 6959, 7607, 6988, 6994, 11748, 11910, 11667, 11710, 11752, 11947, 11948, 11749, 11688, 7120, 7077, 7073, 7069, 7065, 7098, 7081, 7080, 7088, 7055, 7121, 7095, 7054, 7096, 7082, 7094, 7076, 7093, 7072, 7068, 7064, 7043, 7124, 7084, 7056, 7085, 7086, 7087, 7083, 7125, 7089, 7090, 7091, 7092, 7113, 7114, 7115, 7105, 7108, 7107, 7106, 7126, 7109, 13363, 13365, 13356, 6796, 11469, 11470, 6800, 6801, 11496, 6867, 6965, 6986, 6987, 13355, 6799, 13360, 6850, 11487, 6851, 6852, 11512, 6881, 6882, 6896, 11855, 6891, 6921, 7611, 11715, 11912, 11747, 11510, 11491, 6883, 6855, 6858, 6854, 6857, 11488, 11489, 6853, 6856, 6837, 11695, 6901, 11856, 11911, 11908, 13361, 13362, 13378, 13367, 13368, 13370, 13372, 6825, 13373, 6820, 13374, 6817, 11476, 6818, 11471, 6802, 6803, 6804, 11497, 6868, 6924, 6936, 6961, 6964, 6982, 7002, 6996, 7013, 11803, 7439, 10412, 11868, 7005, 6999, 10411, 11869, 7031, 7024, 7004, 11867, 10413, 7438, 6805, 6808, 6811, 11693, 6814, 11475, 11742, 11474, 11473, 11472, 6806, 6807, 11498, 6869, 6925, 6969, 6970, 6971, 11702, 6972, 7608, 7605, 6915, 6859, 11508, 6819, 6815, 6816, 11500, 6872, 6928, 7606, 11714, 11700, 6927, 6963, 6962, 6926, 6870, 6871, 11698, 11744, 11691, 11692, 6812, 6809, 6810, 11499, 11501, 6985, 6991, 6813, 6990, 6992, 6993, 11704, 7603, 7604, 7028, 11706, 11870, 7030, 7023, 13354, 11717, 7763, 7762, 7760, 7761, 7759, 7758, 7757, 11716, 6757, 1055, 6756, 1056, 6763, 1073, 6775, 1074, 6773, 1075, 6768, 6767, 1080, 6769, 6764, 97, 1076, 1077, 1072, 6766, 1078, 1079, 13377, 13376, 13375, 13379, 13366, 7749, 7750, 7751, 7752, 7753, 7754, 7755, 7756, 7766, 7765, 7748, 7767, 7772, 7768, 7769, 7770, 7771, 7764, 11705, 6958, 11701, 7609, 11678, 7747, 11686, 7058, 6975, 11680, 6940, 11865, 6989, 11863, 11864, 6974, 7048, 7047, 7046, 11668, 11674, 7100, 7049, 7050, 6977, 11862, 11860, 11861, 11808, 7012, 7443, 11811, 7035, 10410, 7442, 11810, 7034, 11842, 7022, 7029, 11871, 10409, 7440, 11809, 7033, 11848, 7025, 7032, 11872, 10408, 7441, 11806, 7036, 11846, 7026, 11799, 11933, 11800, 11801, 11813, 7037, 11845, 7027, 11793, 11796, 11746, 11711, 11709, 11708, 11703, 6973, 6939, 11859, 11675, 11965, 11944, 7099, 11672, 7101, 7051, 7052, 6978, 11750, 11934, 7132, 7119, 7134, 7137, 7160, 7452, 11774, 11821, 11778, 11833, 11901, 11902, 11903, 11904, 7455, 7456, 7612, 11851, 7039, 11847, 11815, 11792, 11791, 11930, 11790, 11931, 11932, 11797, 11794, 11795, 11798, 11812, 11814, 7038, 11844, 11707, 11854, 11713, 11764, 7102, 7053, 11685, 6960, 11858, 11676, 11673, 7057, 11751, 11925, 7600, 11834, 11669, 11753, 11760, 11690, 11684, 11926, 11683, 11909, 11937, 11935, 11936, 11762, 11761, 7136, 11866, 7602, 7138, 7434, 10406, 10407, 11759, 11763, 11754, 11755, 11892, 11893, 11895, 11894, 7139, 7435, 11758, 11769, 11681, 11682, 11787, 11929, 11928, 11927, 11765, 11907, 11766, 11788, 11789, 11768, 11767, 11906, 11816, 11817, 11850, 11905, 11819, 11896, 11785, 11828, 11757, 11770, 11818, 11786, 11837, 11835, 11836, 11782, 11783, 11784, 11827, 11775, 7599, 7451, 7159, 10369, 7140, 7447, 11756, 11777, 11822, 11826, 11776, 10367, 10368, 7110, 7112, 7111, 918, 919, 732, 7621, 7620, 7616, 7618, 916, 914, 6765]