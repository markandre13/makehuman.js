// import { expect } from "chai"
// import { Component } from "../../../src/fileformats/target/Component"
// import { TargetFactory, TargetsDirectoryAdapter } from "../../../src/fileformats/target/TargetFactory"

// import * as data from "./data"

// class TargetsDataAdapter implements TargetsDirectoryAdapter {
//     isFile(pathname: string): boolean {
//         return this.path2node(pathname) === null
//     }

//     isDir(pathname: string): boolean {
//         return this.path2node(pathname) !== null
//     }

//     listDir(pathname: string): string[] {
//         return this
//             .path2node(pathname)
//             .filter( x => x!==undefined )
//             .map( x => x[0] )
//     }

//     realPath(pathname: string): string {
//         return pathname
//     }

//     private path2node(pathname: string): any[] {
//         let current = data.directory
//         if (pathname.length === 0)
//             return current
//         for(const part of pathname.split("/")) {
//             let newCurrent: any
//             for(const x of current) {
//                 if (x === undefined)
//                     throw Error()
//                 if (part === x[0]) {
//                     newCurrent = x[1] as any
//                     break
//                 }
//             }
//             if (newCurrent === undefined)
//                 throw Error(`'${pathname}' not found`)
//             current = newCurrent
//         }
//         return current
//     }
// }

// describe("class TargetFactory", ()=>{

//     function enumerateTargets(targets: Component[]): Component[] {
//         const all = new Array<Component>()
//         let i = 0
//         for (const component of targets) {
//             if ((component as any).index === undefined) {
//                 (component as any).index = i
//                 ++i
//                 all.push(component)
//             }
//             let p = component
//             while (p.parent !== undefined) {
//                 p = p.parent
//                 if ((p as any).index === undefined) {
//                     (p as any).index = i
//                     ++i
//                     all.push(p)
//                 }
//             }
//         }
//         return all
//     }

//     it("creates the same data structures as in MakeHuman 1.2.0", ()=>{
//         // TODO: refactor code under test and reduce test data and turn it into a real specification
//         const factory = new TargetFactory(new TargetsDataAdapter())
//         factory.loadTargetDirectory()
//         const all = enumerateTargets(factory.targets)

//         //
//         // check that all the generated components are the same
//         //

//         expect(all.length).is.equal(data.components.length)
//         for(let i=0; i<all.length; ++i) {
//             const a = all[i]
//             const b = data.components[i]

//             // parent
//             expect((a as any).index).is.equal(b.index)
//             if (b.parentIndex === null) {
//                 expect(a.parent).to.equal(undefined)
//             } else {
//                 expect((a.parent as any).index).is.equal(b.parentIndex)
//             }

//             // key
//             expect(a.key).to.eql(b.key)

//             // data
//             let counter = 0
//             for(const category in b.data) {
//                 if (!b.data.hasOwnProperty(category))
//                     continue
//                 ++counter
//                 // console.log(`${category} ${(b.data as any)[category]}, ${a.data.get(category)}`)
//                 const av = a.data.get(category)
//                 const bv = (b.data as any)[category]
//                 if (av === undefined) {
//                     expect(bv).to.equal(null)
//                 } else {
//                     expect(bv).to.equal(av)
//                 }
//             }
//             expect(counter).to.equal(a.data.size)

//             // path
//             if (b.path === null) {
//                 expect(a.path).to.equal(undefined)
//             } else {
//                 expect(a.path).is.equal(b.path!!.substring(5))
//             }
//         }

//         //
//         // check that all the targets array is the same
//         //
//         expect(factory.targets.length).is.equal(data.targets.length)
//         for(let i=0; i<data.targets.length; ++i) {
//             expect((factory.targets[i] as any).index).is.equal(data.targets[i])
//         }

//         //
//         // groups
//         //
//         let counter = 0
//         for(const g in data.groups) {
//             if (!data.groups.hasOwnProperty(g))
//                 continue
//             ++counter
//             const a0 = (data.groups as any)[g]
//             const a1 = factory.groups.get(g)!!.map(x => (x as any).index)
//             // console.log(g, a0, a1)
//             expect(a0).to.eql(a1)
//         }
//         expect(counter).to.equal(factory.groups.size)

//         // images

//         // index
//         counter = 0
//         // tslint:disable-next-line: forin
//         for (const x in data.index) {
//             ++counter
//         }
//         expect(factory.index.size).to.equal(counter)

//         for (const [key, value] of factory.index) {
//             const array = value.map(
//                 x => {
//                     if (x instanceof Component)
//                         return (x as any).index
//                     else
//                         return x
//                 }
//             ) 
//             expect((data.index as any)[key], `for key '${key}'`).to.eql(array)
//         }
//     })
// })

