import { Human } from "./Human"
import { TargetFactory } from './target/TargetFactory'
import { loadSkeleton } from "./skeleton/loadSkeleton"
import { loadModifiers } from './modifier/loadModifiers'
import { loadSliders, SliderNode } from './modifier/loadSliders'
import { WavefrontObj } from './mesh/WavefrontObj'
import { HumanMesh } from './mesh/HumanMesh'

import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from './filesystem/HTTPFSAdapter'
import { render } from './render'

import { Table } from 'toad.js/table/Table'
import { TablePos } from 'toad.js/table/TablePos'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from "toad.js/table/adapter/TreeAdapter"
import { Fragment, ref } from "toad.jsx"
import { Text } from 'toad.js/view/Text'
import { Slider } from 'toad.js/view/Slider'
import { Tab, Tabs } from 'toad.js/view/Tab'

window.onload = () => { main() }

export function main() {
    try {
        run()
    }
    catch (e) {
        console.log(e)
        if (e instanceof Error)
            alert(`${e.name}: ${e.message}`)
        else
            alert(e)
    }
}

// core/mhmain.py
//   class MHApplication
//     startupSequence()
function run() {
    console.log('loading assets...')
    FileSystemAdapter.setInstance(new HTTPFSAdapter())

    const human = Human.getInstance()

    const obj = new WavefrontObj()
    obj.load('data/3dobjs/base.obj.z')
    const scene = new HumanMesh(human, obj)
    human.modified.add(() => scene.updateRequired = true)

    loadSkeleton('data/rigs/default.mhskel.z')

    // humanmodifier.loadModifiers(getpath.getSysDataPath('modifiers/modeling_modifiers.json'), app.selectedHuman)
    loadModifiers('data/modifiers/modeling_modifiers.json.z', human)
    loadModifiers('data/modifiers/measurement_modifiers.json.z', human)

    // guimodifier.loadModifierTaskViews(getpath.getSysDataPath('modifiers/modeling_sliders.json'), app.selectedHuman, category)
    const sliderNodes = loadSliders('data/modifiers/modeling_sliders.json.z')

    loadMacroTargets()

    // TargetFactory.getInstance()
    // const vertexCopy = [scene.vertex]

    console.log('everything is loaded...')

    const tree = new TreeNodeModel(SliderNode, sliderNodes)
    const references = new class {
        canvas!: HTMLCanvasElement
    }
    const mainScreen = <>
        <Tabs style={{ position: 'absolute', left: 0, width: '500px', top: 0, bottom: 0 }}>
            <Tab label="Morph">
                <Table model={tree} style={{width: '100%', height: '100%'}}/>
            </Tab>
            <Tab label="Pose">
                Work In Progress
            </Tab>
        </Tabs>
        <div style={{ position: 'absolute', left: '500px', right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
            <canvas set={ref(references, 'canvas')} style={{ width: '100%', height: '100%' }} />
        </div>
    </> as Fragment
    mainScreen.appendTo(document.body)
    render(references.canvas, scene)
}

// this tells <toad-table> how to render TreeNodeModel<SliderNode>
class SliderTreeAdapter extends TreeAdapter<SliderNode> {

    constructor(model: TreeNodeModel<SliderNode>) {
        super(model)
        this.config.expandColumn = true
    }

    override get colCount(): number {
        return 2
    }

    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        if (this.model === undefined) {
            console.log("no model")
            return
        }
        const node = this.model.rows[pos.row].node
        switch (pos.col) {
            case 0:
                this.treeCell(pos, cell, node.label)
                break
            case 1:
                if (node.model) {
                    const x = <>
                        <Text model={node.model} style={{ width: '50px' }} />
                        <Slider model={node.model} style={{width: '200px' }}/>
                    </> as Fragment
                    cell.replaceChildren(...x)
                }
                break
        }
    }
}

TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode)

//
// more makehuman stuff i need to figure out:
//

function loadMacroTargets() {
    const targetFactory = TargetFactory.getInstance()
    // for target in targets.getTargets().findTargets('macrodetails'):
    for (const target of targetFactory.findTargets('macrodetails')) {
        //         #log.debug('Preloading target %s', getpath.getRelativePath(target.path))
        //         algos3d.getTarget(self.selectedHuman.meshData, target.path)
        // console.log(target.path)
        // target.getTarget()
    }
}

// core/mhmain.py
//   startupSequence()
// apps/human.py
//   class Human
//     setGender(gender: number) // 0 femaile to 1 male
//        if updateModifier:
//            modifier = self.getModifier('macrodetails/Gender')
//            modifier.setValue(gender)
//            self.applyAllTargets()
//            return
//        gender = min(max(gender, 0.0), 1.0)
//        if self.gender == gender:
//            return
//        self.gender = gender
//        self._setGenderVals()
//        self.callEvent('onChanging', events3d.HumanEvent(self, 'gender'))
//    getModifier(self, name):
//        return self._modifiers[name]
//    addModifier(modifier)
//  app/humanmodifier.py
//    class ModifierAction
//      do()/undo()
//    class Modifier
//      setHuman(human)
//        self.human = human
//        human.addModifier(self)
//    class SimpleModifier: Modifier
//    class ManagedTargetModifier: Modifier
//    class UniversalModifier: ManagedTargetModifier
//    class MacroModifier: ManagedTargetModifier
//    class EthnicModifier: MacroModifier
//    loadModifiers() // modifiers/modeling_modifiers.json && modifiers/measurement_modifiers.json

// Modifier.buildLists()
//    this.verts
//    this.faces
//
// Human
//   meshData: 3DObject
//
// core/module3d
//   class FaceGroup(parent: Object3D, name: string, idx: number)
//     object // 3DObject parent
//     name   // group name
//     idx    // group start
//     color: byte[] // RGBA
//     colorID
//
// 3DObject contains the mesh data...
//   name: string
//   vertPerPrimitive: number = 4 
//
//   orig_coord
//   coord: vertex coordinates (Float32,Float32,Float32)[]
//   nvorm: vertex normals     (Float32,Float32,Float32)[]
//   vtang: (Float32,Float32,Float32,Float32)[]
//   color: vertex colors (uint8,uint8,uint8,uint8)[]
//   vface: (uint32, uint32, uint32, uint32)[]
//   nfaces: uint8[]
//
//   _faceGroups: Array<FaceGroup>
//   _groups_rev: Map<string, FaceGrouo>
//
//   cameraMode: number = 0 WTF?
//   _visibility: boolean = true
//   pickable = false
//   calculateTangents = True
//   object3d = undefined  the object in the GUI???
//   _priority = 0
//   MAX_FACES = 8
//
//   Cache used for retrieving vertex colors multiplied with material diffuse color
//   _old_diff = undefined
//   _r_color_diff = undefined
//
//   setCoords( coords: (float, float, float)[] )
//   setUVs( coords: (float, float)[])
//   setFaces(fverts: (int,int,int,int)[], fuvs: (int,int,int,int)[] | undefined, groups: int[])
//   getVertexCount() = this.coord.length
//
//   __object = undefined
//
// class MHApplication {
//   loadHuman() {
//     self.selectedHuman = self.addObject(
//        human.Human(
//          files3d.loadMesh(  // load Wavefront OBJ and return it as Object3D
//            mh.getSysDataPath("3dobjs/base.obj")
//            , maxFaces = 5 // max number of faces per vertex... why?
//          )
//        )
//      )
//   }
// } 
