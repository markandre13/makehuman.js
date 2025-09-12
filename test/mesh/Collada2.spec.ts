import { expect, use } from 'chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from '../chai/chaiAlmost'
use(chaiAlmost())

import { zipForEach } from '../../src/lib/zipForEach'
import { HumanMesh } from '../../src/mesh/HumanMesh'
import { loadProxy, ProxyType } from '../../src/proxy/Proxy'
import { BaseMeshGroup } from '../../src/mesh/BaseMeshGroup'
import {
    exportCollada,
    Geometry,
    ibm,
    mat2txt,
    Material,
    prepareControllerAddBoneWeights,
    prepareControllerFlatBoneWeight,
    prepareControllerFlatWeightMap,
    prepareControllerInit,
    prepareMesh,
} from '../../src/mesh/Collada'

import {
    TagType,
    Node,
    Text,
    Comment,
    CData,
    Tag,
    Document,
    parseXML,
} from '../../src/lib/xml'
import { MorphManager } from '../../src/modifier/MorphManager'
import { WavefrontObj } from '../../src/mesh/WavefrontObj'
import { loadSkeleton } from '../../src/skeleton/loadSkeleton'
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'
import { mat4, vec4 } from 'gl-matrix'
import { Bone } from '../../src/skeleton/Bone'
import { matrix2euler } from 'gl/algorithms/euler'

const identity = mat4.identity(mat4.create())

function tag(name: string, attributes?: any, children?: Node[] | string) {
    const node = new Tag('', 0, 0)
    node.name = name
    if (attributes !== undefined) {
        for (const name of Object.getOwnPropertyNames(attributes)) {
            node.addAttribute(name, attributes[name].toString())
        }
    }
    if (typeof children === 'string') {
        node.children = [text(children)]
    } else if (children !== undefined) {
        node.children = children
    } else {
        node.type = TagType.Empty
    }
    return node
}

function text(text: string) {
    const node = new Text('', 0, 0)
    node.text = text
    return node
}

function compare(lhs: Node, rhs: Node) {
    if (lhs.constructor.name !== rhs.constructor.name) {
        throw Error(
            `expected type ${lhs.constructor.name} to be ${rhs.constructor.name}`
        )
    }
    if (lhs instanceof Document && rhs instanceof Document) {
        let li = 0,
            ri = 0
        while (true) {
            // skip whitespace
            while (
                lhs.children[li] instanceof Text &&
                (lhs.children[li] as Text).text.trim().length == 0
            ) {
                ++li
            }
            while (
                rhs.children[li] instanceof Text &&
                (rhs.children[li] as Text).text.trim().length == 0
            ) {
                ++ri
            }
            if (li >= lhs.children.length && ri >= rhs.children.length) {
                break
            }
            if (li >= lhs.children.length) {
                throw Error(`different number of children`)
            }
            if (ri >= rhs.children.length) {
                throw Error(`different number of children r`)
            }
            const le = lhs.children[li]
            const re = rhs.children[ri]
            le.expectEqual(re)
            ++li
            ++ri
        }

        // if (lhs.children.length !== rhs.children.length) {
        //     console.error(`error: number of children differ ${lhs.children.length} !== ${rhs.children.length}`)
        //     let txt = ""
        //     for(const n of lhs.children) {
        //         txt = `${txt} ${n.constructor.name}:${n.toString(true)}`
        //     }
        //     console.log(`a: ${txt}`)
        //     txt = ''
        //     for(const n of rhs.children) {
        //         txt = `${txt} ${n.constructor.name}${n.toString(true)}`
        //     }
        //     console.log(`b: ${txt}`)
        //     throw Error(`number of children differ ${lhs.children.length} !== ${rhs.children.length}`)
        // }
        return
    }
    throw Error(`node type ${lhs.constructor.name} not handled yet`)
}

function exportCollada2(humanMesh: HumanMesh, date: Date = new Date()) {
    const sceneName = `Scene`
    const objectName = `Human`
    const meshName = `${objectName}-mesh`
    const meshPositionsName = `${meshName}-positions`
    const meshPositionsArrayName = `${meshPositionsName}-array`
    const meshVerticesName = `${meshName}-vertices`
    const meshTexCoordName = `${meshName}-texcoords`
    const meshTexCoordArrayName = `${meshTexCoordName}-array`

    const armatureName = `Armature`
    const armatureLongName = `${armatureName}_${objectName}`
    const skinName = `${armatureLongName}-skin`
    const skinJointsName = `${skinName}-joints`
    const skinJointsArrayName = `${skinJointsName}-array`
    const skinWeightsName = `${skinName}-weights`
    const skinWeightsArrayName = `${skinWeightsName}-array`
    const skinIbmName = `${skinName}-bind_poses`
    const skinIbmArrayName = `${skinIbmName}-array`

    const geometry = new Geometry()
    const proxy = humanMesh.proxies.get(ProxyType.Teeth)!
    // console.dir(proxy)
    expect(proxy).to.be.not.undefined
    const materials: Material[] = [
        {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.SKIN].length,
            name: 'skin',
            r: 1,
            g: 0.5,
            b: 0.5,
        },
        {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL0].length,
            name: 'eyeL',
            r: 0.0,
            g: 1.0,
            b: 0.5,
        },
        {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.EYEBALL1].length,
            name: 'eyeR',
            r: 1.0,
            g: 0.0,
            b: 0.0,
        },
        {
            xyz: proxy.getCoords(humanMesh.vertexMorphed),
            fxyz: proxy.getMesh().fxyz,
            uv: proxy.getMesh().uv,
            fuv: proxy.getMesh().fuv,
            vertexWeights: proxy.getVertexWeights(
                humanMesh.skeleton.vertexWeights!
            ),
            start: 0,
            length: proxy.getMesh().fxyz.length,
            name: 'teeth',
            r: 1.0,
            g: 1.0,
            b: 1.0,
        },
        {
            xyz: humanMesh.vertexMorphed,
            fxyz: humanMesh.baseMesh.fxyz,
            uv: humanMesh.baseMesh.uv,
            fuv: humanMesh.baseMesh.fuv,
            vertexWeights: humanMesh.skeleton.vertexWeights!,
            start: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].startIndex,
            length: humanMesh.baseMesh.groups[BaseMeshGroup.TOUNGE].length,
            name: 'tounge',
            r: 1,
            g: 0.0,
            b: 0.0,
        },
    ]

    for (let m of materials) {
        prepareMesh(m.xyz, m.uv, m.fxyz, m.fuv, m.start, m.length, geometry)
    }

    const allBoneNames = humanMesh.skeleton.boneslist!.map((bone) => bone.name)

    let ibmAll = ''
    humanMesh.skeleton.boneslist!.forEach((bone) => {
        ibmAll += ibm(bone) + ' '
    })
    ibmAll = ibmAll.trimEnd()

    const { boneWeightPairs, weightMap } = prepareControllerInit(geometry)
    for (const m of materials) {
        prepareControllerAddBoneWeights(
            m.xyz,
            m.vertexWeights,
            humanMesh.skeleton.bones,
            geometry,
            boneWeightPairs,
            weightMap
        )
    }

    const weights = prepareControllerFlatWeightMap(weightMap)
    const flatBoneWeightList = prepareControllerFlatBoneWeight(boneWeightPairs)

    const xml = tag(
        'COLLADA',
        {
            xmlns: 'http://www.collada.org/2005/11/COLLADASchema',
            version: '1.4.1',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        },
        [
            tag('asset', {}, [
                tag('contributor', {}, [
                    tag('author', {}, 'makehuman.js user'),
                    tag(
                        'authoring_tool',
                        {},
                        'https://github.com/markandre13/makehuman.js'
                    ),
                ]),
                tag('created', {}, date.toISOString()),
                tag('modified', {}, date.toISOString()),
                tag('unit', { meter: '0.1', name: 'meter' }),
                tag('up_axis', {}, 'Y_UP'),
            ]),

            tag('library_images'),

            tag(
                'library_effects',
                {},
                materials.map((it) =>
                    tag('effect', { id: `${it.name}-effect` }, [
                        tag('profile_COMMON', {}, [
                            tag('technique', { sid: 'common' }, [
                                tag('lambert', {}, [
                                    tag('emission', {}, [
                                        tag(
                                            'color',
                                            { sid: 'emission' },
                                            '0 0 0 1'
                                        ),
                                    ]),
                                    tag('diffuse', {}, [
                                        tag(
                                            'color',
                                            { sid: 'diffuse' },
                                            `${it.r} ${it.g} ${it.b} 1`
                                        ),
                                    ]),
                                    tag('reflectivity', {}, [
                                        tag(
                                            'float',
                                            { sid: 'specular' },
                                            '0.0'
                                        ),
                                    ]),
                                ]),
                            ]),
                        ]),
                    ])
                )
            ),

            tag(
                'library_materials',
                {},
                materials.map((it) =>
                    tag(
                        'material',
                        { id: `${it.name}-material`, name: it.name },
                        [tag('instance_effect', { url: `#${it.name}-effect` })]
                    )
                )
            ),

            tag('library_geometries', {}, [
                tag('geometry', { id: meshName, name: objectName }, [
                    tag('mesh', {}, [
                        tag('source', { id: meshPositionsName }, [
                            tag(
                                'float_array',
                                {
                                    id: meshPositionsArrayName,
                                    count: geometry.xyz.length,
                                },
                                geometry.xyz.join(' ')
                            ),
                            tag('technique_common', {}, [
                                tag(
                                    'accessor',
                                    {
                                        source: `#${meshPositionsArrayName}`,
                                        count: geometry.xyz.length / 3,
                                        stride: 3,
                                    },
                                    [
                                        tag('param', {
                                            name: 'X',
                                            type: 'float',
                                        }),
                                        tag('param', {
                                            name: 'Y',
                                            type: 'float',
                                        }),
                                        tag('param', {
                                            name: 'Z',
                                            type: 'float',
                                        }),
                                    ]
                                ),
                            ]),
                        ]),
                        tag('vertices', { id: meshVerticesName }, [
                            tag('input', {
                                semantic: 'POSITION',
                                source: `#${meshPositionsName}`,
                            }),
                        ]),
                        tag('source', { id: meshTexCoordName }, [
                            tag(
                                'float_array',
                                {
                                    id: meshTexCoordArrayName,
                                    count: geometry.uv.length,
                                },
                                geometry.uv.join(' ')
                            ),
                            tag('technique_common', {}, [
                                tag(
                                    'accessor',
                                    {
                                        source: `#${meshTexCoordArrayName}`,
                                        count: geometry.uv.length / 2,
                                        stride: 2,
                                    },
                                    [
                                        tag('param', {
                                            name: 'S',
                                            type: 'float',
                                        }),
                                        tag('param', {
                                            name: 'T',
                                            type: 'float',
                                        }),
                                    ]
                                ),
                            ]),
                        ]),

                        ...materials.map((_, m) => {
                            let l = ''
                            zipForEach(
                                geometry.indices[m].fxyz,
                                geometry.indices[m].fuv,
                                (xyz, uv) => {
                                    l = `${l}${xyz} ${uv} `
                                }
                            )
                            return tag(
                                'polylist',
                                {
                                    material: `${materials[m].name}-material`,
                                    count: geometry.indices[m].fxyz.length / 4,
                                },
                                [
                                    tag('input', {
                                        semantic: 'VERTEX',
                                        source: `#${meshVerticesName}`,
                                        offset: 0,
                                    }),
                                    tag('input', {
                                        semantic: 'TEXCOORD',
                                        source: `#${meshTexCoordName}`,
                                        offset: 1,
                                        set: 1,
                                    }),
                                    tag(
                                        'vcount',
                                        {},
                                        '4 '.repeat(
                                            geometry.indices[m].fxyz.length / 4
                                        )
                                    ),
                                    tag('p', {}, l),
                                ]
                            )
                        }),
                    ]),
                ]),
            ]),

            tag('library_controllers', {}, [
                tag('controller', { id: skinName, name: armatureName }, [
                    tag('skin', { source: `#${meshName}` }, [
                        tag('bind_shape_matrix', {}, mat2txt(identity)),
                        tag('source', { id: skinJointsName }, [
                            tag(
                                'Name_array',
                                { id: skinJointsArrayName, count: 3 },
                                allBoneNames.join(' ').replace(/\./g, '_')
                            ),
                            tag('technique_common', {}, [
                                tag(
                                    'accessor',
                                    {
                                        source: `#${skinJointsArrayName}`,
                                        count: allBoneNames.length,
                                        stride: 1,
                                    },
                                    [
                                        tag('param', {
                                            name: 'JOINT',
                                            type: 'name',
                                        }),
                                    ]
                                ),
                            ]),
                        ]),
                        tag('source', { id: skinIbmName }, [
                            tag(
                                'float_array',
                                {
                                    id: skinIbmArrayName,
                                    count: allBoneNames.length * 16,
                                },
                                ibmAll
                            ),
                            tag('technique_common', {}, [
                                tag(
                                    'accessor',
                                    {
                                        source: `#${skinIbmArrayName}`,
                                        count: allBoneNames.length,
                                        stride: 16,
                                    },
                                    [
                                        tag('param', {
                                            name: 'TRANSFORM',
                                            type: 'float4x4',
                                        }),
                                    ]
                                ),
                            ]),
                        ]),
                        tag('source', { id: skinWeightsName }, [
                            tag(
                                'float_array',
                                {
                                    id: skinWeightsArrayName,
                                    count: weights.length,
                                },
                                weights.join(' ')
                            ),
                            tag('technique_common', {}, [
                                tag(
                                    'accessor',
                                    {
                                        source: `#${skinWeightsArrayName}`,
                                        count: weights.length,
                                        stride: 1,
                                    },
                                    [
                                        tag('param', {
                                            name: 'WEIGHT',
                                            type: 'float',
                                        }),
                                    ]
                                ),
                            ]),
                        ]),
                        tag('joints', {}, [
                            tag('input', {
                                semantic: 'JOINT',
                                source: `#${skinJointsName}`,
                            }),
                            tag('input', {
                                semantic: 'INV_BIND_MATRIX',
                                source: `#${skinIbmName}`,
                            }),
                        ]),
                        tag(
                            'vertex_weights',
                            { count: boneWeightPairs.length },
                            [
                                tag('input', {
                                    semantic: 'JOINT',
                                    source: `#${skinJointsName}`,
                                    offset: 0,
                                }),
                                tag('input', {
                                    semantic: 'WEIGHT',
                                    source: `#${skinWeightsName}`,
                                    offset: 1,
                                }),
                                tag(
                                    'vcount',
                                    {},
                                    boneWeightPairs
                                        .map((e) => e.length)
                                        .join(' ')
                                ),
                                tag('v', {}, flatBoneWeightList.join(' ')),
                            ]
                        ),
                    ]),
                ]),
            ]),
            tag('library_animations', {}, [
                tag(
                    'animation',
                    { id: 'action_container-Armature', name: 'Armature' },
                    [
                        tag(
                            'animation',
                            {
                                id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X',
                                name: 'Armature_jaw',
                            },
                            [
                                tag(
                                    'source',
                                    {
                                        id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-input',
                                    },
                                    [
                                        tag(
                                            'float_array',
                                            {
                                                id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-input-array',
                                                count: 3,
                                            },
                                            '0.04166662 0.4166666 0.8333333'
                                        ),
                                        tag('technique_common', {}, [
                                            tag(
                                                'accessor',
                                                {
                                                    source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-input-array',
                                                    count: 3,
                                                    stride: 1,
                                                },
                                                [
                                                    tag('param', {
                                                        name: 'TIME',
                                                        type: 'float',
                                                    }),
                                                ]
                                            ),
                                        ]),
                                    ]
                                ),
                                tag(
                                    'source',
                                    {
                                        id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-output',
                                    },
                                    [
                                        tag(
                                            'float_array',
                                            {
                                                id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-output-array',
                                                count: 3,
                                            },
                                            '0.0 20.0 0.0'
                                        ),
                                        tag('technique_common', {}, [
                                            tag(
                                                'accessor',
                                                {
                                                    source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-output-array',
                                                    count: 3,
                                                    stride: 1,
                                                },
                                                [
                                                    tag('param', {
                                                        name: 'ANGLE',
                                                        type: 'float',
                                                    }),
                                                ]
                                            ),
                                        ]),
                                    ]
                                ),
                                tag(
                                    'source',
                                    {
                                        id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-interpolation',
                                    },
                                    [
                                        tag(
                                            'Name_array',
                                            {
                                                id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-interpolation-array',
                                                count: '3',
                                            },
                                            'LINEAR LINEAR LINEAR'
                                        ),
                                        tag('technique_common', {}, [
                                            tag(
                                                'accessor',
                                                {
                                                    source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-interpolation-array',
                                                    count: 3,
                                                    stride: 1,
                                                },
                                                [
                                                    tag('param', {
                                                        name: 'INTERPOLATION',
                                                        type: 'name',
                                                    }),
                                                ]
                                            ),
                                        ]),
                                    ]
                                ),
                                tag(
                                    'sampler',
                                    {
                                        id: 'Armature_jaw_ArmatureAction___jaw___rotation_euler_X-sampler',
                                    },
                                    [
                                        tag('input', {
                                            semantic: 'INPUT',
                                            source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-input',
                                        }),
                                        tag('input', {
                                            semantic: 'OUTPUT',
                                            source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-output',
                                        }),
                                        tag('input', {
                                            semantic: 'INTERPOLATION',
                                            source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-interpolation',
                                        }),
                                    ]
                                ),
                                tag('channel', {
                                    source: '#Armature_jaw_ArmatureAction___jaw___rotation_euler_X-sampler',
                                    target: 'Armature_jaw/rotationX.ANGLE',
                                }),
                            ]
                        ),
                    ]
                ),
            ]),
            tag('library_visual_scenes', {}, [
                tag('visual_scene', { id: sceneName, name: sceneName }, [
                    tag('node', {id: armatureName, name: armatureName, type: "NODE"}, [
                        tag('matrix', {sid: "transform"}, mat2txt(identity)),
                        ...dumpBone(armatureName, humanMesh.skeleton.roots[0]),
                        tag('node', {id: objectName, name:objectName, type: "NODE"}, [
                            tag('matrix', {sid: 'transform'}, mat2txt(identity)),
                            tag('instance_controller', {url: `#${skinName}`}, [
                                tag('skeleton', {}, `#${armatureName}_${humanMesh.skeleton.roots[0].name}`),
                                tag('bind_material', {}, [
                                    tag('technique_common', {}, [
                                        // <bind_vertex_input semantic="UVMap" input_semantic="TEXCOORD" input_set="0"/>
                                        ...materials.map( (_, m) => 
                                            tag('instance_material', {symbol: `${materials[m].name}-material`, target: `#${materials[m].name}-material`}, [
                                                tag('bind_vertex_input', {semantic: "UVMap", input_semantic: "TEXCOORD", input_set: 0})
                                        ]))
                                    ])
                                ])
                            ])
                        ])
                    ])
                ]),
            ]),
            tag('scene', {}, [
                tag('instance_visual_scene', {url: `#${sceneName}`})
            ])
        ]
    )
    const document = new Document('')
    document.children.push(xml)
    return document
}

export function dumpBone(armatureName: string, bone: Bone, indent: number = 4, connectWithParent: boolean = false): Node[] {
    const {x,y,z} = matrix2euler(bone.matRestRelative!)
    const childrenToConnectWith = new Set<Bone>()
    const tail = vec4.transformMat4(vec4.create(), bone.yvector4!, bone.matRestGlobal!)
    for (let child of bone.children) {
        const childHead = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, 0, 1), child.matRestGlobal!)
        if (vec4.equals(tail, childHead)) {
            childrenToConnectWith.add(child)
        }
    }
    let tip: Node[] = []
    if (childrenToConnectWith.size === 0) {
        const head = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, 0, 1), bone.matRestGlobal!)
        const boneGlobalVec = vec4.sub(vec4.create(), tail, head)
        tip = [
            tag('tip_x', {sid: "tip_x", type: "float"}, boneGlobalVec[0].toString()),
            tag('tip_y', {sid: "tip_y", type: "float"}, boneGlobalVec[1].toString()),
            tag('tip_z', {sid: "tip_z", type: "float"}, boneGlobalVec[2].toString())
        ]
    }
    return [
        tag('node', {id: `${armatureName}_${bone.name.replace(/\./g, "_")}`, name: bone.name, sid: bone.name.replace(/\./g, "_"), type: "JOINT"}, [
            tag('rotate', {sid: "rotationX"}, `1 0 0 ${x}`),
            tag('rotate', {sid: "rotationY"}, `0 1 0 ${y}`),
            tag('rotate', {sid: "rotationZ"}, `0 0 1 ${z}`),
            tag('translate', {sid: "location"}, `${bone.matRestRelative![3]} ${bone.matRestRelative![7]} ${bone.matRestRelative![11]}`),
            tag('extra', {}, [
                tag('technique', {profile: 'blender'}, [
                    ...(connectWithParent ? [tag('connect', {sid: 'connect', type: 'bool'}, '1')]: []),
                    tag('layer', {sid: 'layer', type: 'string'}, '0'),
                    ...tip
                ])
            ]),
            ...bone.children.flatMap((child) => dumpBone(armatureName, child, indent + 1, childrenToConnectWith.has(child)))
        ])
    ]
}

describe('Collada2', function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it('foo', function () {
        this.timeout(360000)
        const human = new MorphManager()
        const obj = new WavefrontObj('data/3dobjs/base.obj')
        const humanMesh = new HumanMesh(human, obj)
        human.humanMesh = humanMesh
        const skeleton = loadSkeleton(humanMesh, 'data/rigs/default.mhskel.z')
        humanMesh.skeleton = skeleton

        const proxy = loadProxy(
            human,
            'data/teeth/teeth_base/teeth_base.mhclo',
            ProxyType.Teeth
        )
        humanMesh.proxies.set(ProxyType.Teeth, proxy)
        // humanMesh.changedProxy = ProxyType.Teeth
        // humanMesh.human.signal.emit()

        humanMesh.calculateVertexMorphed()
        skeleton.updateJoints()
        skeleton.build()
        skeleton.update()
        humanMesh.calculateVertexRigged()

        expect(humanMesh.vertexMorphed).to.not.be.undefined

        const date = new Date()
        const xml0 = parseXML('', exportCollada(humanMesh, date))
        const xml1 = exportCollada2(humanMesh, date)
        compare(xml0, xml1)

    })
})
