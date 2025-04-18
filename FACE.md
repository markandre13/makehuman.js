# Face Animation

### Current Situation

* Makehuman comes with a face rig and blendshapes but they are not suitable for the ARKit blendshapes
* Rigify's face rig is much more expressive
* MPFB2 v2.0-a3 has the rigify face bones but docs/contributing/weightpainting.md states that: 
  Weight painting for the face has been auto-created by "automatic weights" and is outright bad and needs
  to be redone more or less from scratch."
* I failed to install later MPFB2 versions with the exception of the newest one, which does not include
  Rigify face bones.

=> The plan now is to use the ARKit and ICT blendshapes, which means those meshes need to be mapped onto
   the MH mesh.

### Plan

Write a tool which helps to map two face meshed onto each other

* Load and display a mesh
* Be able to select a vertex in the mesh