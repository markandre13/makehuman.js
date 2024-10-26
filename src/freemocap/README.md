FreeMoCap
=========

## Introduction

[FreeMoCap](https://freemocap.org/) is a free software motion capture system using cameras.

It uses Google's Mediapipe BlazePose neural network, which delivers 33 pose landmarks (17 of which are COCO conform) from a 256x256 pixel bitmap.

It then combines the pose landmarks from multiple cameras to improve the quality.

It uses a Butterworth filter, but Internet suggests Kalman filter.

## Output

output_data/

mediapipe_body_3d_xyz.csv: 33 pose landmarks
mediapipe_face_3d_xyz.csv: 478 face landmarks
etc.

## Next Steps

So, a next step could be to let the backend push that data to the
frontend like it's been captured directly from mediapipe.

Then use it to finish the blaze to mh pose code.

makehuman.js-backend already contains a CaptureEngine class which
we could use.

It has the subclasses MediapipeFace, MediapipePose, LiveLink. When created, they take a callback which they call when they have data.
Here one usually sends to the frontend.

For reading the file we need a wait loop. Currently there's the loop
used for either video capture or video file. This needs to be generalized.

(Also try to add a pause, frame forward/backward, jump to pos feature
to ease debugging.)

## Source Code

TBD