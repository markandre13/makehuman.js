import { expect } from '@esm-bundle/chai'

import { FileSystemAdapter } from '../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../src/filesystem/HTTPFSAdapter'
import { loadProxy } from "../src/proxy/Proxy"

describe("Proxy", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("loads female_generic.proxy", function () {
        loadProxy(undefined as any, "data/proxymeshes/female_generic/female_generic.proxy", "Proxymeshes")
    })
})
