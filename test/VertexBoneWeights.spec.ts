import { expect } from '@esm-bundle/chai'
import { VertexBoneWeights } from '../src/skeleton/VertexBoneWeights'

describe("VertexBoneWeights", function () {
    it("init", function () {
        const v = {
            weights: {
                "spine01": [[3, 10.0], [0, 0.3], [1, 0.4]],
                "spine02": [[0, 0.2], [1, 0.0]],
            }
        }
        const result = new VertexBoneWeights("memory", v)
        // indices will be sorted
        // weights below a certain threshold will be removed from the bone
        // indices not used will be assigned to the root bone
        // all weights for the same index will be normalized
        // either number of vertices will be set or calculated
        // add unassigned vertices to root bone with weight 1

        // TODO:
        // merge doubles
        // extend rootBone (for now we just set it)

        expect(result._data.size).to.equal(3)
        expect(result._data.get("spine01")).to.deep.equal([
            [0, 1, 3],
            [0.6, 1, 1]
        ])
        expect(result._data.get("spine02")).to.deep.equal([
            [0],
            [0.4]
        ])
        expect(result._data.get("root")).to.deep.equal([
            [2],
            [1]
        ])
    })
})