import { expect } from "chai"
import { URL } from "url"
import * as fs from "fs"
import * as readline from "readline"

describe("test A", ()=> {
    it("flies!", async ()=> {
        // let url = new URL("file://./data/3dobjs/base.obj")
        let url = "data/3dobjs/base.obj"
        
        let stream = fs.createReadStream(url)
        let reader = readline.createInterface({
             input: stream,
             crlfDelay: Infinity
        })
        for await (let line of reader) {
            console.log(line)
        }
    })
})
