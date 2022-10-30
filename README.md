# makehuman.js

<div style="text-align: center">
  <img src="data/screenshot.png" />

  An **experimental** port of [Makehuman](http://www.makehumancommunity.org) to Typescript/The Web.
</div>

## Current Status

* Have a look at [build 2022-08-11](https://markandre13.github.io/makehuman.js/) with toad.js branch table3
* All modifiers work and update the mesh.
* Nothing else... 😅

## Why?

* I've been using MakeHuman for more than a decade but often struggled with the UI and the source code.
* I'm up to [something](https://mark13.org) with [Blender](https://www.blender.org) and [Chordata](https://chordata.cc) and in need for full artistic control of my toolchain. 😎

## Similar Projects

* [makehuman-js](https://github.com/makehuman-js/makehuman-js) Another port of Makehuman to the Web. Close to the original.

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
}

// creates a list of ui elements (sliders, text fields) to edit the modifier values
function loadSliders(filename: string)
```

### Pose Rig

* data/rigs/ contains a rig which can be used to pose/animate the mesh

Next Goal:
* there is some incomplete code to load a makehuman skeleton file which needs
  to be extended
* render the skeleton (shared/skeleton_drawing.py)
  * meshFromSkeleton(skel, type)
  * getVertBoneMapping(skel, skeletonMesh)
  * _shapeFromSkeleton(skel, type)
  * _shapeFromBone(bone, type)
  * meshFromJoints(jointPositions, jointNames, scale)
* pose the skeleton
* apply the pose to the mesh
