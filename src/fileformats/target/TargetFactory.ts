import * as fs from "fs"
import * as path from "path"
import { Component} from "./Component"

// targets      := [ target, ... ]
// target       := ( keyArray, categoryDict, filename )
// groups       := { keyTupple: [ target, ... ] }
// keyArray     := ['key', ...]
// keyTupple    := ('key', ...)
// categoryDict := { 'category': 'value'|None, ... }
// filename     := 'filename'

export interface TargetsDirectoryAdapter {
    isFile(pathname: string): boolean
    isDir(pathname: string): boolean
    listDir(pathname: string): string[]
    realPath(pathname: string): string
}

class TargetsFilesystemAdapter implements TargetsDirectoryAdapter {
    isFile(pathname: string): boolean {
        return fs.lstatSync(pathname).isFile()
    }

    isDir(pathname: string): boolean {
        return fs.lstatSync(pathname).isDirectory()
    }

    listDir(pathname: string): string[] {
        return fs.readdirSync(pathname)
    }

    realPath(pathname: string): string {
        return path.join(__dirname, "../data/"+pathname)
    }
}

export class TargetFactory {
    rootComponent: Component
    images: Map<string, string> // list of all PNG files found while crawling

    targets: Component[] // all components
    groups: Map<string, Component[]> // Component.keys to Components

    index: Map<string, (Component|string)[]>

    adapter: TargetsDirectoryAdapter

    constructor(adapter: TargetsDirectoryAdapter = new TargetsFilesystemAdapter()) {
        this.adapter = adapter
        this.rootComponent = new Component()
        this.images = new Map<string, string>()
        this.targets = new Array<Component>()
        this.groups = new Map<string, Component[]>()
        this.index = new Map<string, (Component|string)[]>() // Component key names to ...
    }

    loadTargetDirectory() {
        this.walkTargets('', this.rootComponent)
        this.buildIndex()
    }

    findTargets(partialGroup: string): Component[] {
        // if isinstance(partialGroup, str):
        //     partialGroup = tuple(partialGroup.split('-'))
        // elif not isinstance(partialGroup, tuple):
        //     partialGroup = tuple(partialGroup)
        // if partialGroup not in self.index:
        if (!this.index.has(partialGroup))
        //     return []
            return []
        // result = []
        const result = new Array<Component>()
        // for entry in self.index[partialGroup]:
        for (const entry of this.index.get(partialGroup)!!) {
        //     if isinstance(entry, Component):
            if (entry instanceof Component)
        //         result.append(entry)
                result.push(entry)
        //     else:
            else
        //         result.extend(self.findTargets(entry))
                result.concat(this.findTargets(entry))
        }
        // return result
        return result
    }

    walkTargets(root: string, base: Component) {
        // console.log(this.listDir("animations/walks"))
        // return

        const directoryPath = this.adapter.realPath(root)
        const dir = this.adapter.listDir(directoryPath).sort()
        // console.log(`dir=${dir}`)
        for(const name of dir) {
            // console.log(`directoryPath='${directoryPath}', dir=${dir}, name='${name}'`)
            const p = path.join(directoryPath, name)

            if (this.adapter.isFile(p) && ! p.toLowerCase().endsWith(".target")) {
                if (p.toLowerCase().endsWith(".png")) {
                    this.images.set(name.toLowerCase(), p)
                }
            } else {
                const item = base.createChild()
                const parts = name.replace("_", "-").replace(".", "-").split("-")
                for(const part of parts.entries()) {
                    if (part[0]===0 && part[1]==="targets")
                        continue
                    item.update(part[1])
                }

                if (this.adapter.isDir(p)) {
                    const nextRoot = path.join(root, name)
                    this.walkTargets(nextRoot, item)
                } else {
                    item.finish(p)
                    this.targets.push(item)
                    const key = item.tuple()
                    let a = this.groups.get(key)
                    if (a === undefined) {
                        a = new Array<Component>()
                        this.groups.set(key, a)
                    }
                    a!!.push(item)
                }
            }
        }
    }

    buildIndex() {
        for(const target of this.targets) {
            if (!this.index.has(target.tuple())) {
                this.index.set(target.tuple(), new Array())
            }
            this.index.get(target.tuple())!!.push(target)
            let component = target
            while(component.parent !== undefined) {
                const parent = component.parent
                if (!this.index.has(parent.tuple())) {
                    this.index.set(parent.tuple(), new Array<Component|string>())
                }
                if (component.tuple() !== parent.tuple() &&
                     !this.index.get(parent.tuple())!!.includes(component.tuple()) ) {
                        this.index.get(parent.tuple())!!.push(component.tuple())
                }
                component = parent
            }
        }
    }
}
