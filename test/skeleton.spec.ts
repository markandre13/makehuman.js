import { expect } from '@esm-bundle/chai'
import { loadSkeleton, Skeleton } from 'skeleton/loadSkeleton'
import { FileSystemAdapter } from 'filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from 'filesystem/HTTPFSAdapter'

describe("Skeleton", function() {
    this.beforeAll(function() {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    xit("loads the default.mhskel", function() {
        loadSkeleton("data/rigs/default.mhskel")
        console.log("Hello")
        expect(true).to.be.true
    })

    it("xxx", function() {
        new Skeleton({
            name: "bones",
            version: "1.0",
            tags: ["t1"],
            description: "desc",
            copyright: "copyleft",
            license: "gpl",

            "joints": {
                "breast.L____head": [
                    13654,
                    13655,
                    13656,
                    13657,
                    13658,
                    13659,
                    13660,
                    13661
                ],
                "breast.L____tail": [
                    8451
                ]
            },

            "planes": {
                "breast.L____plane": [
                    "special01____tail",
                    "spine01____head",
                    "spine01____tail"
                ],
            },

            "bones": {
                "breast.L": {
                    "head": "breast.L____head",
                    "parent": "spine02",
                    "reference": null,
                    "rotation_plane": "breast.L____plane",
                    "tail": "breast.L____tail"
                },
                "breast.R": {
                    "head": "breast.R____head",
                    "parent": "spine02",
                    "reference": null,
                    "rotation_plane": "breast.R____plane",
                    "tail": "breast.R____tail"
                },
            }
        })
    })
})
