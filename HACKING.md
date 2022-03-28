
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

