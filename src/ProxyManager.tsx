import { HumanMesh } from "./mesh/HumanMesh"
import { loadProxy, ProxyType } from "proxy/Proxy"
import { FileSystemAdapter } from "./filesystem/FileSystemAdapter"
import { OptionModel } from "toad.js"

// NOT WORKING YET
// female_casualsuit01
//   doDeleteVerts

// USUAL PATTERN
// data/{type}/{name}/{name}.(mhclo|obj|mhmat|thumb|mhw)
//                          _(normal|diffuse|ao|displacement|texture|texture_grey).png
//
// EXCEPTIONS
// clothes/fedora01/fedora[_cocked]

export class ProxyManager {
    humanMesh: HumanMesh
    // list of all known proxies by type
    list = new Map<ProxyType, OptionModel<string>>()

    allProxyTypes = [
        ProxyType.Proxymeshes,
        ProxyType.Clothes,
        ProxyType.Hair,
        ProxyType.Eyes,
        ProxyType.Eyebrows,
        ProxyType.Eyelashes,
        ProxyType.Teeth,
        ProxyType.Tongue,
    ]

    constructor(humanMesh: HumanMesh) {
        this.humanMesh = humanMesh
        for (const type of this.allProxyTypes) {
            const proxyList: string[] = ["none"]
            for (const file of FileSystemAdapter.listDir(ProxyType[type].toLowerCase())) {
                if (file === "materials") {
                    continue
                }
                // model.add(file, file)
                proxyList.push(file)
            }
            let defaultValue: string
            switch(type) {
                case ProxyType.Eyes:
                    defaultValue = "high-poly"
                    break
                case ProxyType.Teeth:
                    defaultValue = "teeth_base"
                    break
                case ProxyType.Tongue:
                    defaultValue = "tongue01"
                    break
                default:
                    defaultValue = "none"
            }
            const model = new OptionModel(defaultValue, proxyList)
            model.signal.add(() => {
                // console.log(`${ProxyType[type]} (${type}) = '${model.value}'`)
                if (model.value === "none") {
                    humanMesh.proxies.delete(type)
                } else {
                    const prefix = `data/${ProxyType[type].toLowerCase()}/${model.value}/${model.value}`
                    const suffix = exists(`${prefix}.mhclo`) ? "mhclo" : "proxy"
                    console.log(`load proxy mesh '${prefix}.${suffix}'`)
                    humanMesh.proxies.set(type, loadProxy(humanMesh.morphManager, `${prefix}.${suffix}`, type))
                }
                humanMesh.changedProxy = type
                humanMesh.morphManager.signal.emit()
            })
            model.signal.emit()
            this.list.set(type, model)
        }
    }
}

function exists(path: string): boolean {
    try {
        FileSystemAdapter.isFile(path)
    } catch (e) {
        return false
    }
    return true
}
