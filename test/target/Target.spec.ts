import { expect } from '@esm-bundle/chai'

import { FileSystemAdapter } from "../../src/filesystem/FileSystemAdapter"
import { HTTPFSAdapter } from "../../src/filesystem/HTTPFSAdapter"
import { Target } from "../../src/target/Target"

describe("class Target", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it("can parse base.obj without throwing an exception", async () => {
        const url = "data/targets/breast/breast-volume-vert-up.target"
        // const stream = fs.readFileSync(url).toString()
        const obj = new Target()
        await obj.load(url)
        expect(obj.data.length).to.equal(601)
        expect(obj.verts.length).to.equal(601 * 3)
    })
})