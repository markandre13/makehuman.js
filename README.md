# makehuman.js

<div style="text-align:npm center">
  <img src="data/screenshot.png" />

  An **experimental** port of [Makehuman](http://www.makehumancommunity.org) to Typescript/The Web.
</div>

## Current Status

* Have a look at [build 2022-08-11](https://markandre13.github.io/makehuman.js/) with toad.js branch table3
* Morph mesh
* Pose skeleton and adjust mesh
* Nothing else... 😅

## Why?

* I've been using MakeHuman for more than a decade but often struggled with the UI and the source code.
* I'm up to [something](https://mark13.org) with [Blender](https://www.blender.org) and [Chordata](https://chordata.cc) and in need for full artistic control of the toolchain. 😎

## How does Makehuman work?

### Morph Mesh

#### Data

* data/3dobjs/base.obj contains a 3d model of a human body, called the **base mesh**
* data/target/ contains 1258 [morph targets](https://en.wikipedia.org/wiki/Morph_target_animation),
  which can deform the base mesh's shape, gender, age and ethnicity
* data/modifiers/ bundles those morph targets into 249 more user friendly **modifiers**
* not in makehuman.js yet: there is a set of alternative meshes

#### Code
```js
// render's the morphed base mesh
function render(canvas: HTMLCanvasElement, scene: HumanMesh)

// the morphed base mesh
class HumanMesh {
    // input
    obj: Mesh        // the base mesh from the Wavefront Object
    human: Human     // the morph targets

    // processing
    update()         // calculate vertex from obj and human

    // output
    vertex: number[] // the morphed obj.vertex
}

// aggregates all the modifiers and creates a list of morph targets
class Human {
    // input
    modifiers: Map<string, Modifier>
    modifierGroups: Map<string, Modifier[]>

    // output 
    targetsDetailStack: Map<string, number> // morph targets

    // for posing and skinning (see below)
    meshData!: WavefrontObj
    __skeleton!: Skeleton
}

// creates a list of ui elements (sliders, text fields) to edit the modifier values
function loadSliders(filename: string)
```

### Pose Mesh

The skeleton aggregates bones and weights. Bones can be rotated.

#### Data

* data/rigs/default.mhskel the bones making up the skeleton

  for the actual bone positions little cubes within the mesh are referenced
  
* data/rigs/default_weights.mhw the weights each bone has on each vertex

#### Code

```js
// aggregates the bone tree and weight list
class Skeleton {
}

// a single bone
class Bone {
}

// weights
class VertexBoneWeights {
}
```

## Build

Building needs toad.js from the github master branch. See 'npm link' for further details.

## Run single test

npm run dev:test --file=build/test/skeleton.spec.js

Next Goal:

* proxies
  * simple proxy mesh: eyes, teeth, tongue
  * proxy mesh: female generic
* export collada
* save/load morph
* save/load pose
* ...
<!--
cd /Users/mark/upstream/makehuman/makehuman
./makehuman

joe core/mhmain.py
pip3.9 install --upgrade --force-reinstall PyQt5

WHAT TO DO NOW

===============================

fg = None
groups = []
faceGroups = {}

# this seems to just store color/colorID ?
class FaceGroup
  name
  idx
  object: parent (Object3D)
  color
  colorID
  
class Object3D
  _groups_rev[<name>] = FaceGroup // index in _faceGroups
  _faceGroups = FaceGroup[]
  createFaceGroup(name)
  
  # makehuman.js calculates those when rendering
  fnorm[]: face normals
  vnorm[]: vertex normals
  vtang[]: vertex tangents
  
---------------------
// plugins/3_libraries_skeleton/skeletonlibrary.py
human.setSkeleton(skel)

// shared/skeleton.py
class Skeleton {
  fromFile(path, mesh)
}

// apps/animation.py
class AnimatedMesh {
  __skeleton: Skeleton
  __meshes: []
  __vertexToBoneMaps: []
  ...
  
  // this looks like were the animation is done... but
  // it's only a part within some optimized code...
  skinMesh(coords, compiledVertWeights, poseData)
}

class AnimationTrack
class Pose: AnimationTrack
class PoseUnit: AnimationTrack
class VertexBoneWeights

// apps/human.py
class Human: AnimatedMesh {
}



===============================
I already implemented animating a makehuman generated mesh,
but based on loading an export to collada.

~/c/human/      ;; loads and animates a collada file exported by makehuman

  collada.cc    ;; load collada file into human: Geometry
    collada()
    
  human.hh      ;; the loaded collada file
  class Geometry {
        // mesh
        vertex: double[]
        normal: double[]
        polylist_vcount: unsigned[]     // points per polygon in polylist
        polylist: unsigned[]: vertex index/normal index
        
        // skeleton
        skeleton: SkeletonNode
        
        // mesh-skeleton relation
        joint: string[];             // a list of joint names within the skeleton
        node: SkeletonNode*[]        // joint index to skeleton nodea
        bindShapeMatrix: double[];
        weight: double[];
        inversebind: double[];
        v: unsigned[];
        vcount: unsigned[]; // should be the save as vertex/3
  }
  
  class SkeletonNode {
        name: string
        children: SkeletonNode[]
        m: Matrix
        global_m: Matrix
        x, y, z: double         // additional rotation
  }

human.cc
  TViewer::glPaint()  
    skinning equation
    
    v_out = sum_i=0^n ((v*BSM) * IBM_i * JMi) * JW_i
    
    n    = number of joints
    BSM  := bind-shape matrix (identity in makehuman)
    IBMi := inverse bin-pose matrix of joint i (not read yet)
    JMi  := transformation matrix of joint j
    JW   := weight of influence of joint i on vertex v

BUG IN TOAD.JS (REGRESSION TEST FOR NOW)
o switch to pose tab
o open root
o switch to morph tab
o switch to pose tab
o close root
=> two root nodes appear

-->