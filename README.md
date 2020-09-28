# MakeHumanX

An experimental Makehuman port to Typescript/Web/Electron, aiming for better UX, Clean Code and
TDD.

## Architecture

### BaseMesh (the human 3d model to be deformed by the MorphTargets)
* /data/data/3dobjs/base.obj contains the base mesh, meaning the human 3d model to be deformed by the MorphTargets
* class **3DObject** contains the mesh data

### MorphTargets
A morph target's vectors are multiplied by 0 to 1 and added to the base mesh to achieve a deformation, ie. a longer nose.
* data/targets/**/*.target contains the various morph targets
* class **TargetFactory** scans the /data/targets/ directory and creates a tree of
  * class **Component** is a node in TargetFactories target tree, containing the filename
    and data to classify the file derived from it's filename
  * class **Target** holds the data of a target file

### Modifiers (modifiers control one or more targets)
* data/modifiers/(modeling|measurement)_modifiers.json definition of the modifiers
  * **Modifier** base class only

    * buildLists()
      calls getTarget(3DObject, filename: string) to load the target file, but 
      it doesn't seem to use it?

  * **SimpleModifier** extends Modifier, not used by the provided data/ directory
  * **ManagedTargetModifier** extends Modifier, base class only

    Uses TargetFactory to 
    * static findTargets(path): (targetpath, factordependencies)[]
    * static findMacroDependencies(path): Set<>

  * **UniversalModifier**: ManagedTargetModifier

    manages 1, 2 or 3 targets

  * **MacroModifier**: ManagedTargetModifier
  * **EthnicModifier**: MacroModifier
  * **WarpModifier** extends UniversalModifier
