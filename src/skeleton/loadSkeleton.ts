import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'

export function loadSkeleton(filename: string) {
    const root = parseSkeleton(
        FileSystemAdapter.getInstance().readFile(filename),
        filename)
    console.log(`Loaded skeleton from file ${filename}?x`)
    return root
}

export function parseSkeleton(data: string, filename = 'memory') {
    const json = JSON.parse(data)
    // console.log(json)
    return new Skeleton(json)
}

interface FileInformation {
    name: string
    version: string
    tags?: string[]
    description: string
    copyright: string
    license: string
}

// skeleton file
//   data: bones, joints, planes, weights_file, plane_map_strategy
//   info: name, version, tags, description, copyright, license
// weights files
//   data: weights
//   info: name, version, description, copyright, license
export class Skeleton {
    info: FileInformation

    plane_map_strategy?: number

    constructor(data: any) {
        this.info = {
            name: data.name,
            version: data.version,
            tags: data.tags,
            description: data.description,
            copyright: data.copyright,
            license: data.license
        }
        this.plane_map_strategy = data.plane_map_strategy

        // joints

        // planes

        // bones

        // weights
    }
}