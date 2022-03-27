# How I look into what the upstream versin is doing.

## Preparation

* downloaded the MacOS version of MakeHuman into ~/Downloads
* created a git repository in
  Downloads/MakeHuman.app/Contents/Resources/makehuman/
* disabled the call to redirect_standard_streams() in
  ~/Downloads/MakeHuman.app/Contents/Resources/makehuman.py

## Checking

* add print statements
* run the app from the command line with
  ~/Downloads/MakeHuman.app/Contents/MacOS/MakeHuman


# How does MakeHuman work?

## data/ directory

* base.obj contains a mesh of a human body
* *.target contain morph target for the mesh
* modifier contains information how the targets map to modifiers
* modifiers/modeling_sliders.json
  contains information how the modifiers are mapped to the UI

## moving a slider

* moving a slider will call setValue() in the modifier
...
* Human.modified will be triggered
* HumanMesh will apply all morphtargets from human.targetsDetailStack
  before the next render

# Interresting files

* apps/humanmodifier.py
  this is where all modifiers are implemented

startup



Macro (group 'macrodetails')
  Gender
  Age
  African (EthnicModifier)
  Asian (EthnicModifier)
  Caucasian (EthnicModifier)

 group 'macrodetails-universal'
  Muscle
  Weight

group 'macrodetails-height'

  Height
  
group 'macrodetails-proportions' 

  Proportions

Breast (group 'breast')
  BreastSize
  BreastFirmness
  
  
  
Human.gender

gender -> maleVal, femaleVal


