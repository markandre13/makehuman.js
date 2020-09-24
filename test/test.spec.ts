import { expect } from "chai"
import * as fs from "fs"
import { WavefrontObj } from "../src/fileformats/WavefrontObj"
import { Target } from "../src/fileformats/Target"
import { StringToLine } from "../src/fileformats/StringToLine"
import { Component } from "../src/fileformats/target/Component"
import { TargetsCrawler, TargetsDirectoryAdapter } from "../src/fileformats/target/TargetsCrawler"
import * as data from "./data"

class TargetsDataAdapter implements TargetsDirectoryAdapter {
    isFile(pathname: string): boolean {
        // return fs.lstatSync(pathname).isFile()
        // console.log(`isFile('${pathname}')`)
        return this.path2node(pathname) === null
    }

    isDir(pathname: string): boolean {
        // return fs.lstatSync(pathname).isDirectory()
        // console.log(`isDir('${pathname}')`)
        return this.path2node(pathname) !== null
    }

    listDir(pathname: string): string[] {
        // return fs.readdirSync(directory)
        // console.log(`listDir('${pathname}')`)
        return this
        .path2node(pathname)
        .filter( x => x!==undefined )
        .map( x => x[0] )
    }

    realPath(pathname: string): string {
        // return path.join(__dirname, "../data/"+root)
        return pathname
    }

    private path2node(pathname: string): any[] {
        let current = data.directory
        if (pathname.length === 0)
            return current
        for(const part of pathname.split("/")) {
            // console.log(`  look for '${part}' in '${current}'`)
            let newCurrent: any
            for(const x of current) {
                if (x === undefined)
                    throw Error()
                // console.log(`x=${x[0]}`)
                if (part === x[0]) {
                    newCurrent = x[1] as any
                    break
                }
            }
            if (newCurrent === undefined)
                throw Error(`'${pathname}' not found`)
            current = newCurrent
        }
        // console.log(`path2node('${pathname}') -> ${current}`)
        return current
    }
}

// const data = {
//     directory: [
//         ["3dobjs", [
//             ["a7_converter.proxy", null],
//             ["axis.obj", null],
//             ["base.mhclo", null],
//             ["base.obj", null],
//         ]],
//         ["animations", [
//             ["walks", [
//                 ["dance1.bvh", null],
//                 ["walk1.bvh", null],
//                 ["walks.mhanim", null],
//             ]],
//             ["zombie", [
//                 ["zombie.mhanim", null],
//                 ["zombieWalk1.bvh", null],
//             ]],
//         ]],
//         ["targets", [
//             ["armslegs", [
//                 ["l-foot-scale-decr.target", null],
//                 ["l-foot-scale-depth-decr.target", null],
//                 ["l-foot-scale-depth-incr.target", null],
//                 ["l-foot-scale-horiz-decr.target", null],
//                 ["l-foot-scale-horiz-incr.target", null],
//                 ["l-foot-scale-incr.target", null],
//             ]],
//             ["macrodetails", [
//                 ["african-female-baby.target", null],
//                 ["african-female-child.target", null],
//                 ["height", [
//                     ["female-baby-averagemuscle-averageweight-maxheight.target", null],
//                     ["female-baby-averagemuscle-averageweight-minheight.target", null],
//                 ]],
//                 ["universal-female-baby-averagemuscle-averageweight.target", null],
//                 ["universal-female-baby-averagemuscle-maxweight.target", null],
//             ]],
//         ]],
//     ,],
//     components: [
//         {
//           "index": 0,
//           "parentIndex": 1,
//           "key": ["armslegs", "l", "foot", "scale", "decr"],
//           "data": {"gender": null, "age": null, "race": null, "muscle": null, "weight": null, "height": null, "breastsize": null, "breastfirmness": null, "bodyproportions": null},
//           "path": "data/targets/armslegs/l-foot-scale-decr.target"
//         },
//         {
//           "index": 1,
//           "parentIndex": 2,
//           "key": ["armslegs"],
//           "data": {},
//           "path": null
//         },
//         {
//           "index": 2,
//           "parentIndex": 3,
//           "key": [],
//           "data": {},
//           "path": null
//         },
//         {
//           "index": 3,
//           "parentIndex": null,
//           "key": [],
//           "data": {},
//           "path": null
//         },
//     ],
//     targets: [0, 4, 5, 6, 7, 8, 9, 10],
//     groups: {
//         "armslegs-l-foot-scale-decr": [0,],
//         "armslegs-l-foot-scale-depth-decr": [4,],
//         "armslegs-l-foot-scale-depth-incr": [5,],
//         "armslegs-l-foot-scale-horiz-decr": [6,],
//         "armslegs-l-foot-scale-horiz-incr": [7,],
//         "armslegs-l-foot-scale-incr": [8,],
//     },
//     index: {
//         "armslegs-l-foot-scale-decr": [0, ],
//         "armslegs": ["armslegs-l-foot-scale-decr", "armslegs-l-foot-scale-depth-decr", "armslegs-l-foot-scale-depth-incr", "armslegs-l-foot-scale-horiz-decr", "armslegs-l-foot-scale-horiz"],
//         "": ["armslegs", "asym", "breast", "buttocks", "cheek", "chin", "ears", "expression", "eyebrows", "eyes", "forehead", "genitals", "head", "hip", "macrodetails", "measure", "mouth"],
//         "armslegs-l-foot-scale-depth-decr": [4, ],
//         "armslegs-l-foot-scale-depth-incr": [5, ],
//         "armslegs-l-foot-scale-horiz-decr": [6, ],
//         "armslegs-l-foot-scale-horiz-incr": [7, 8],
//     }
// }

// http://paulbourke.net/dataformats/obj/
describe("class WavefrontOBJ", ()=> {
    it("can parse base.obj without throwing an exception", async ()=> {
        const url = "data/3dobjs/base.obj"
        const stream = fs.readFileSync(url).toString()
        const obj = new WavefrontObj()
        await obj.load(stream)
        expect(obj.vertex.length).to.equal(19158 * 3) // 3 coord per vertex
        expect(obj.indices.length).to.equal(18486 * 3 * 2) // each face is 3 triangles
    })

    // it.only("can parse base.obj without throwing an exception", async ()=> {
    //     // const url = "data/3dobjs/base.obj"
    //     const url = "data/3dobjs/cube.obj"
    //     const stream = fs.readFileSync(url).toString()
    //     const obj = new WavefrontObj()
    //     await obj.load(stream)
    //     // expect(obj.vertex.length).to.equal(19158 * 3) // 3 coord per vertex
    //     // expect(obj.indices.length).to.equal(18486 * 3 * 2) // each face is 3 triangles

    //     // we can go through the list of triangles and calculate the normals

    //     // console.log(a)
    // })
})

describe("class Target", ()=> {
    it("can parse base.obj without throwing an exception", async ()=> {
        const url = "data/targets/breast/breast-volume-vert-up.target"
        const stream = fs.readFileSync(url).toString()
        const obj = new Target()
        await obj.load(stream)
        expect(obj.data .length).to.equal(601)
        expect(obj.verts.length).to.equal(601 * 3)
    })
})

describe("class TargetsCrawler", ()=>{

    function enumerateTargets(targets: Component[]): Component[] {
        const all = new Array<Component>()
        let i = 0
        for (const component of targets) {
            if ((component as any).index === undefined) {
                (component as any).index = i
                ++i
                all.push(component)
            }
            let p = component
            while (p.parent !== undefined) {
                p = p.parent
                if ((p as any).index === undefined) {
                    (p as any).index = i
                    ++i
                    all.push(p)
                }
            }
        }
        return all
    }

    it.only("load", ()=>{
        const crawler = new TargetsCrawler(new TargetsDataAdapter())
        crawler.findTargets()

        const all = enumerateTargets(crawler.targets)

        //
        // check that all the generated components are the same
        //

        // console.log(crawler.targets)
        expect(all.length).is.equal(data.components.length)
        for(let i=0; i<all.length; ++i) {
            const a = all[i]
            const b = data.components[i]

            // parent
            expect((a as any).index).is.equal(b.index)
            if (b.parentIndex === null) {
                expect(a.parent).to.equal(undefined)
            } else {
                expect((a.parent as any).index).is.equal(b.parentIndex)
            }

            // key
            expect(a.key).to.eql(b.key)

            // data
            let counter = 0
            for(const category in b.data) {
                if (!b.data.hasOwnProperty(category))
                    continue
                ++counter
                // console.log(`${category} ${(b.data as any)[category]}, ${a.data.get(category)}`)
                const av = a.data.get(category)
                const bv = (b.data as any)[category]
                if (av === undefined) {
                    expect(bv).to.equal(null)
                } else {
                    expect(bv).to.equal(av)
                }
            }
            expect(counter).to.equal(a.data.size)

            // path
            if (b.path === null) {
                expect(a.path).to.equal(undefined)
            } else {
                expect(a.path).is.equal(b.path!!.substring(5))
            }
        }

        //
        // check that all the targets array is the same
        //
        expect(crawler.targets.length).is.equal(data.targets.length)
        for(let i=0; i<data.targets.length; ++i) {
            expect((crawler.targets[i] as any).index).is.equal(data.targets[i])
        }

        //
        // groups
        //
        let counter = 0
        for(const g in data.groups) {
            if (!data.groups.hasOwnProperty(g))
                continue
            ++counter
            const a0 = (data.groups as any)[g]
            const a1 = crawler.groups.get(g)!!.map(x => (x as any).index)
            // console.log(g, a0, a1)
            expect(a0).to.eql(a1)
        }
        expect(counter).to.equal(crawler.groups.size)

        // images

        // index
        counter = 0
        // tslint:disable-next-line: forin
        for (const x in data.index) {
            ++counter
        }
        expect(crawler.index.size).to.equal(counter)

        for (const [key, value] of crawler.index) {
            const array = value.map(
                x => {
                    if (x instanceof Component)
                        return (x as any).index
                    else
                        return x
                }
            ) 
            expect((data.index as any)[key], `for key '${key}'`).to.eql(array)
        }
    })
})

describe("class StringToLine", ()=> {
    it("empty", ()=> {
        let result = ""
        const reader = new StringToLine("")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("")
    })
    it("just a line feed", ()=> {
        let result = ""
        const reader = new StringToLine("\n")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("<CR><CR>")
    })
    it("one line without line feed", ()=> {
        let result = ""
        const reader = new StringToLine("line 0")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>")
    })
    it("one line with line feed", ()=> {
        let result = ""
        const reader = new StringToLine("line 0\n")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR><CR>")
    })
    it("three lines", ()=> {
        let result = ""
        const reader = new StringToLine("line 0\nline 1\nline 2")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>line 1<CR>line 2<CR>")
    })
})
