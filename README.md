MakeHumanX

An experimental Makehuman port to Typescript/Web/Electron, aiming for better UX, Clean Code and
TDD.

Architecture

BaseMesh (the human 3d model to be deformed by the MorphTargets)
o /data/data/3dobjs/base.obj 

MorphTargets (a morph target's vectors are multiplied by 0 to 1 and added to the base mesh to achieve a deformation, ie. 'longer nose')
o data/targets/**/*.target contains the various morph targets
o class TargetFactory scans the /data/targets/ directory and creates a tree of
o class Component is a node in TargetFactories target tree, containing the filename
  and data to classify the file derived from it's filename
o class Target holds the data of a target file

Modifiers (modifiers control one or more targets)
o data/modifiers/(modeling|measurement)_modifiers.json definition of the modifiers

Human
