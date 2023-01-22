# makehuman.js

<div style="text-align:npm center">
  <img src="data/screenshot.png" />

  An **experimental** port of [Makehuman](http://www.makehumancommunity.org) to Typescript/The Web.
</div>

## Current Status

* Have a look at [build 2023-01-22](https://markandre13.github.io/makehuman.js/) with toad.js from master branch
* Morph mesh
* Pose skeleton and adjust mesh
* Render a proxy mesh instead of the basemesh
* Nothing else... 😅

## Why?

* I've been using MakeHuman for more than a decade but often struggled with the UI and the source code.
* I'm up to [something](https://mark13.org) with [Blender](https://www.blender.org) and [Chordata](https://chordata.cc) and in need for full artistic control of the toolchain. 😎

## How does Makehuman work?

### Morph Mesh

#### Data

* data/3dobjs/base.obj contains a 3d model of a human body, called the **base mesh**
* data/target/ contains 1258 [morph targets](https://en.wikipedia.org/wiki/Morph_target_animation),
  which can deform the base mesh's shape, gender, age and ethnicity.

  The morph targets are handmade by editing the basemesh in a 3d editor and
  extracting the changes with [MakeTarget](https://github.com/makehumancommunity/maketarget-standalone).

* data/modifiers/ bundles those morph targets into 249 more user friendly **modifiers**

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

  for the actual bone positions little cubes within the mesh are referenced,
  so when the mesh is morphed, the skeleton is morphed along with it.
  
* data/rigs/default_weights.mhw the weights each bone has on each vertex

#### Code

```js
// aggregates the bone tree and weight list
class Skeleton {
}

// a single bone
class Bone {
    parent?: Bone
    children: Bone[] = []

    name: string

    yvector4?: vec4 // direction vector of this bone (along y-axis)
    matRestGlobal?: mat4 // bone relative to world
    ...

    // user defined rotation
    matPose: mat4
}

// weights
class VertexBoneWeights {
    // bone name -> [[vertex numbers, ...], [weight for vertex, ...]]
    _data: Map<string, Array<Array<number>>>
}
```

### Proxy

Proxies provide additional meshes, e.g. teeth, tounge, eyes, alternative body
meshes and cloth.

The proxy files contain data which is used to transform the morphed/posed basemesh into a proxy mesh.
These files are created with [MakeClothes](https://github.com/makehumancommunity/community-plugins-makeclothes).

```js
class Proxy {
    // return proxy mesh vertices, adjusted to basemesh morph/pose
    getCoords(baseMeshVertices: number[]): number[]
}
```

## Build

Building needs toad.js from the github master branch. See 'npm link' for further details.

## Run single test

npm run dev:test --file=build/test/skeleton.spec.js

Next Goals:

* proxy meshes (WIP)
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

Proxy

so basically, the proxy meshes must also go through morph and pose,
which would mean theres a mapping of the morph/pose weights to the proxy mesh somewhere.

but 1st, what exactly is in the Proxy class???

me thinks that i did not implement the 3d object...

what do we do with object.proxy ???

proxy.object
object.proxy (Object3D does not have a proxy attribute)

Setting a proxy starts here:

/Users/mark/upstream/makehuman/makehuman/plugins/3_libraries_proxy_chooser.py
    def selectProxy(self, mhclofile):
        pxy = proxy.loadProxy(self.human,
                              mhclofile,
                              type=self.proxyName.capitalize())
        # Override z_depth and mesh priority to the same as human mesh
        pxy.z_depth = self.human.getSeedMesh().priority
        mesh,obj = pxy.loadMeshAndObject(self.human)
        self.human.setProxy(pxy)

/Users/mark/upstream/makehuman/makehuman/apps/human.py

    def setProxy(self, proxy):
        oldPxy = self.getProxy()
        oldPxyMesh = self.getProxyMesh()
        # Fit to basemesh in rest pose, then pose proxy
        super(Human, self).setProxy(proxy)              

        if oldPxyMesh:
            self.removeBoundMesh(oldPxyMesh.name)
        if self.proxy:
            # Add new mesh and vertex weight assignments
            self._updateMeshVertexWeights(self.getProxyMesh())
            self.refreshPose()

        event = events3d.HumanEvent(self, 'proxyChange')
        event.proxy = 'human'
        self.callEvent('onChanged', event)

/Users/mark/upstream/makehuman/makehuman/core/guicommon.py
    def setProxy(self, proxy):
        isSubdivided = self.isSubdivided()

        if self.proxy:
            self.proxy = None
            self.detachMesh(self.__proxyMesh)
            self.__proxyMesh.clear()
            self.__proxyMesh = None
            if self.__proxySubdivisionMesh:
                self.detachMesh(self.__proxySubdivisionMesh)
                self.__proxySubdivisionMesh.clear()
                self.__proxySubdivisionMesh = None
            self.mesh = self.__seedMesh
            self.mesh.setVisibility(1)

        if proxy:
            import files3d
            self.proxy = proxy

            self.__proxyMesh = proxy.object.mesh.clone()
            self.__proxyMesh.object = self

            # Copy attributes from human mesh to proxy mesh
            for attr in ('visibility', 'pickable', 'cameraMode'):
                setattr(self.__proxyMesh, attr, getattr(self.mesh, attr))

            self.updateProxyMesh()

            # Attach to GL object if this object is attached to viewport
            if self.__seedMesh.object3d:
                self.attachMesh(self.__proxyMesh)

            self.mesh.setVisibility(0)
            self.mesh = self.__proxyMesh
            self.mesh.setVisibility(1)

        self.setSubdivided(isSubdivided)

    def updateProxyMesh(self, fit_to_posed=False):
        if self.proxy and self.__proxyMesh:
            self.proxy.update(self.__proxyMesh, fit_to_posed)
            self.__proxyMesh.update()

/Users/mark/upstream/makehuman/makehuman/shared/proxy.py

    def update(self, mesh, fit_to_posed=False):
        #log.debug("Updating proxy %s.", self.name)
        coords = self.getCoords(fit_to_posed)
        mesh.changeCoords(coords)
        mesh.calcNormals()

Object
  setProxy()

  detachMesh
  attachMesh
  updateProxyMesh()

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