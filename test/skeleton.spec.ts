import { expect } from '@esm-bundle/chai'
import { loadSkeleton } from 'skeleton/loadSkeleton'
import { FileSystemAdapter } from 'filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from 'filesystem/HTTPFSAdapter'

describe("Skeleton", function() {
    this.beforeAll(function() {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("loads", function() {
        loadSkeleton("data/rigs/default.mhskel")
        console.log("Hello")
        expect(true).to.be.true
    })
})
