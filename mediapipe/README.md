# Mediapipe Server

## About

This is going to be a motion capture service for makehuman.js based on Google's Mediapipe.

## Source

> For all practical purposes (again, at least for beginners), the only way to
> use MP in your own software project, is to build your project inside the
>  MediaPipe tree, ...

* [What MediaPipe Really Is: a C++ Mini-Tutorial](https://www.it-jim.com/blog/mini-tutorial-on-mediapipe/)
* [First steps with Google MediaPipe: An Informal tutorial](https://github.com/agrechnev/first_steps_mediapipe)

So, therefore I link this directory into the Mediapipe sources and run it from there:

```sh
cd /.../mediapipe
ln -s /.../makehuman.js/mediapipe mediapipe/examples/desktop/makehuman
bazel run --define MEDIAPIPE_DISABLE_GPU=1 //mediapipe/examples/desktop/makehuman
```
