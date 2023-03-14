import { expect } from '@esm-bundle/chai'

import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'
import { StringToLine } from '../../src/lib/StringToLine'

describe("class StringToLine", function() {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it("empty", () => {
        let result = ""
        const reader = new StringToLine("")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("")
    })
    it("just a line feed", () => {
        let result = ""
        const reader = new StringToLine("\n")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("<CR><CR>")
    })
    it("one line without line feed", () => {
        let result = ""
        const reader = new StringToLine("line 0")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>")
    })
    it("one line with line feed", () => {
        let result = ""
        const reader = new StringToLine("line 0\n")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR><CR>")
    })
    it("three lines", () => {
        let result = ""
        const reader = new StringToLine("line 0\nline 1\nline 2")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>line 1<CR>line 2<CR>")
    })
})