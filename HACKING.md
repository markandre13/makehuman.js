
# How does MakeHuman work?

## Mesh (Modelling Tab)

Mesh of a human body, which can be adjusted using pre-defined morph targets.

### Data

* data/3d/objs/base.obj mesh human body in Wavefront Object format (1.7M)
* data/targets/**/*.target morph targets for the mesh (125M)
* modifiers/modeling_modifiers.json
  assigns morph targets to modifiers
* modifiers/modeling_sliders.json 
  defines how modifiers are placed in the UI

(data as text is about 127M, compressed with zlib about 37.7M)

### Code

#### Control Flow

* Slider -> Modifier.setValue(value)
* Modifier -> Human.setDetail(morphTargetName, value)
* Human -> HumanMesh apply Human's morph targets to the mesh

#### Source

* startup: core/mhmain.py
* Human: apps/human.py
* modifiers: apps/humanmodifier.py.

  SimpleModifier extends Modifier
  ManagedTargetModifier extends Modifier
  UniversalModifier extends ManagedTargetModifier
  MacroModifier extends ManagedTargetModifier
  EthnicModifier extends MacroModifier


## Skeleton (Pose/Animate Tab)

Skeleton/rigs for the mesh.

* shared/skeleton.py

## Topology

Alternative meshes.
# Observing the Python implementation

## Observing

* add print statements
* run the app from the command line with
  ~/Downloads/MakeHuman.app/Contents/MacOS/MakeHuman

## Preparation

* downloaded the MacOS version of MakeHuman into ~/Downloads
* to track changes, I created a git repository in
  Downloads/MakeHuman.app/Contents/Resources/makehuman/
* for the output of print statements to be visible on the command line,
  I disabled the call to redirect_standard_streams() in
  ~/Downloads/MakeHuman.app/Contents/Resources/makehuman.py

# Other

## Animation

* importing an animation (bhv, collada) will create a new object wose animation needs to be copied onto the object to be animated:
  * select destination
  * shift select source
  * Ctrl + L
  * Link Animation Data
  * (optional: Object > Relations > Make Single User > Object Animation)
* export/import an animation with blender
  * bhv will loose the curves and use samples instead
  * collada needs to be configured properly but will retain the curves
    (and for three bones with two keyed rotations, Blender generates about 1100 lines of
    XML with super long ids... 🫢)
* Blender has a built in [pose library](https://docs.blender.org/manual/en/latest/animation/armatures/posing/editing/pose_library.html)

## makehuman-0.9.1-rc1a

this old C++ version of MakeHuman has many interesting features:

* rig constraints
* key shapes for muscles
* weights were of higher quality
* a human skeleton mesh

the sources though are a bit hard to find these days.

I've found [MyHumanoid](https://github.com/MyHumanoid/MyHumanoid) and was able to compile it but couldn't get it to run because of OpenGL issues:

```
   # need to put src/MhUiMorph.cpp: put applier and nopApplier into namespace { ... }
   apt-get install cmake
   cmake -S MyHumanoid -B humanoid
   cd humanoid
   make
   ./MyHumanoid
```

I've been able to find and build the original source, but the exported Collada file
does not contain weights

* [makehuman-0.9.1-rc1a.tar.gz](https://src.fedoraproject.org/repo/pkgs/makehuman/makehuman-0.9.1-rc1a.tar.gz/c28c24a5e430f471f9687e26db94a64b/makehuman-0.9.1-rc1a.tar.gz)
* [animorph-0.3.tar.gz](https://src.fedoraproject.org/repo/pkgs/animorph/animorph-0.3.tar.gz/md5/e75fd295d95bcf4b1d95b86db7866c18/animorph-0.3.tar.gz)
* [mhgui-0.2.tar.gz](https://src.fedoraproject.org/repo/pkgs/mhgui/mhgui-0.2.tar.gz/0794987c3a0f505a836e73bf629df64d/mhgui-0.2.tar.gz)

```
    # Building on Debian (make install & ldconfig run as root, rest as local user)

    apt install build-essential
    apt-get install libpng-dev libgl-dev libglu-dev freeglut3-dev libxmu-dev libxi-dev

    # some files will need an extra: #include <cstring>
    cd animorph-0.3
    ./configure
    make
    make install

    # include/mhgui/ImageData.h: png_uint_32 width, height;
    cd mhgui-0.2
    ./configure
    make
    make install

    ldconfig /usr/local/lib

    # some files need an extra: #include <algorithm>
    cd makehuman-0.9.1-rc1a
    ./configure
    make
    cd src
    ./makehuman
```
