Chordata Motion
===============

***Table of Contents***

- [Introduction](#introduction)
- [Install](#install)
  - [Official Image](#official-image)
  - [Custom Build](#custom-build)
  - [Grant makehuman.js access to the Notochord](#grant-makehumanjs-access-to-the-notochord)
- [Source Code](#source-code)
- [Notochord OS](#notochord-os)
  - [Boot Process](#boot-process)
  - [Getting More Logs](#getting-more-logs)
  - [Getting Core Dumps](#getting-core-dumps)
- [KCeptor Calibration](#kceptor-calibration)
- [Pose Calibration](#pose-calibration)
  - [Pose Calibration Overview](#pose-calibration-overview)
  - [Avatar](#avatar)
  - [Pose Calibration Debugging](#pose-calibration-debugging)
  - [Pose Calibration Implementation](#pose-calibration-implementation)
- [REST API](#rest-api)

## Introduction

[Chordata Motion](https://chordata.cc) is an open-source motion capture system of which I got the set with 15 sensors.

* Each sensor contains accelerometer, gyroscope and magnetometer
* [Fusion](https://github.com/xioTechnologies/Fusion) is used to combine them into a single quaternion.

  "An efficient orientation filter for inertial and inertial/magnetic sensor arrays", Sebastian O.H. Madgwick, 2010-04-30

* There is a pose calibration algorithm to figure out how the sensors are oriented relative to the body.

* In the future, using https://github.com/xioTechnologies/Gait-Tracking on a single foot can be used to calculate x,y,z relative coordinates of a walking person.

* Inertial Measurement Unit (IMU): accelerometer + gyroscope
* Magnetic, Angular Rate, Gravity (MARG): IMU + magnetometer

The folks are super busy working on it so instead of wasting their time, and because that's what I like to do anyway, here are my own collected notes while attempting to wrap my head around it.

## Install

I have [macOS](https://en.wikipedia.org/wiki/MacOS) and a [FRITZ!Box](https://en.wikipedia.org/wiki/Fritz!Box) at home and Chordata Motion will appear under http://notochord in my local network (for the time being, avoid Safari unless you like waiting).

Start by looking at the [official documentation](https://chordata.gitlab.io/docs/), then take some hints from here to get around the tiny head scratchers:

### Official Image

* Insert SD Card into your computer
* With the [Raspberry Pi Imager](https://www.raspberrypi.com/software/), flash the image (e.g. 2023-03-30-notochord-os-arm64-lite.img.xz) from https://chordata.cc/downloads/
* Mount SD Card on your computer
* Write your uppercase, 2 letter country code (e.g. "DE") into .../boot/countrycode.txt so that the WLAN knows which country regulations to adhere to be able to start
* Unmount SD Card and put it into the Raspberry Pi
* Boot Raspberry Pi with SD Card
* Connect your computer to WLAN "Chordata-net", "chordata".
* Open http://notochord/
* Open 'Maintenance' tab
* Enter your local 'WLAN SSID' & 'Password'
* Mark the 'Add new SSID' checkbox
* Click [Set WIFI]
* Click [Reboot]
* Connect your computer to your normal WLAN
* Open http://notochord/
* ssh human@notochord, password chordata

### Custom Build

(Adapted from [notochord-os](https://gitlab.com/chordata/notochord-os).)

* Insert SD Card into your computer
* With the [Raspberry Pi Imager](https://www.raspberrypi.com/software/), flash the image 

  **64bit Raspberry Pi OS (Legacy, 64-bit) Lite**, Debian 11 (bullseye)
  
  and use the Advanced Settings to configure Wifi and SSH (I also set hostname notochord and user human, password chordata)
* Mount SD Card on your computer
  ```
  touch ssh
  echo human:$(echo chordata | openssl passwd -6 -stdin) > userconf
  echo "DE" > countrycode
  ```
* Boot Raspberry Pi with SD Card
* ssh human@notochord
* for the stable version run
  ```bash
  bash <(curl -sL "https://gitlab.com/api/v4/projects/39055939/repository/files/fetch_and_run%2Esh/raw?ref=master")
  ```
  for the development version run
  ```bash
  export NOTO_CHECKOUT_BRANCH=develop NOTOSERVER_CHECKOUT_BRANCH=develop
  bash <(curl -sL "https://gitlab.com/api/v4/projects/39055939/repository/files/fetch_and_run%2Esh/raw?ref=master")
  ```
  and answer the questions as follows
  ```
  Do an automatic installation? [y/N]
  Perform basic configuration? [y/N]y
  Create custom welcome message on ~/.bashrc? [y/N]y
  Set raspberry as a access point? [y/N]
  Compile and install notochord-module? [y/N]y
  Install and configure notochord-control-server? [y/N]y
  Install extra utilities? [y/N]y
  ```
  afterwards
  ```
  Clean bash history? [y/N]
  Reboot the system now? [y/N]y
  ```

### Grant makehuman.js access to the Notochord

I usually run makehuman.js on my desktop using `make dev:serve`. To allow the webapp calling the
Notochord, edit the file `/opt/chordata/notochord-control-server/notochord_control_server/__init__.py` and add

```python
@app.after_request
def allow_origin(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response
```
and reboot.

## Source Code

Code is hosted at [GitLab](https://gitlab.com/chordata/). Sort by 'Updated' so see which repositories might be most relevant.

* [notochord-os](https://gitlab.com/chordata/notochord-os)
  Scripts to install all software on a fresh PI
* [notochord-control-server](https://gitlab.com/chordata/notochord-control-server)
  The Webserver: [gunicorn](https://gunicorn.org) as HTTPD and [Flask](https://www.fullstackpython.com/flask.html) as web framework.
* [notochord-module](https://gitlab.com/chordata/notochord-module)
  C/C++ Python Module containing the core of the functionality
* [pose-calibration](https://gitlab.com/chordata/pose-calibration)
  The code to calibrate the sensors. (python, numpy, panda)
  * Used by the notochord-module
    * notochord-module/setup.cfg references chordata-pose-calib @ git+https://gitlab.com/chordata/pose-calibration.git
    * [Cython](https://cython.org) combines the Python and C++ code
        * pxd: makes C/C++ code available to Python, included by the pyx file
        * pyx: adds some syntaxtical sugar
    * notochord-module/pyx/notochord/calibration.pyx
        * change_status(), get_data(), get_indexes(): directs to Calibration_Manager(), a C++ class for recording the data
        * run_calibration(): calls Calibrator().run() to evaluate the recorded data
        * apply_calibration(): calls get_runtime().get_armature().get().get_bones() and Bone.set_(pre|pose)_quaternion()
* [blender-mathutils](https://gitlab.com/chordata/blender-mathutils)
  Python module with the C/C++ functions and classes from Blender.

* [Blender-addon](https://gitlab.com/chordata/Blender-addon)
  On macOS will be installed into ~/Library/Application Support/Blender/2.83/scripts/addons/chordata/
  * the tree of KCeptor nodes can/will be uploaded as an XML configuration to the Notochord
  * the code used on the Notochord for Pose Calibration is also part of the addon

* [COPP server](https://gitlab.com/chordata/copp_server)
  COPP is the UDP protocol by which motion events are send.
* [notochord](https://gitlab.com/chordata/notochord) CLI tool
* [Avatar pose visualization](https://gitlab.com/chordata/avatar-pose-visualization)
  Avatar pose visualization for Blender

Which branches are relevant is a bit more tricky.
* `master` seems to be the latest official release
* `develop` seems to be the the latest stable development version
* the other branches seem to be feature branches
* to find the latest modified branches use `git branch -r --sort=-committerdate`


## Notochord OS

### Boot Process

* the startup code is in /etc/rc.local, ...
* which starts the gunicorn web server, ...
* which gives control to /opt/chordata/notochord-control-server/wsgi.py
* which controls the bulk of the Notochord code in /opt/chordata/notochord-module/

### Getting More Logs

The web process is actually creating more output than available in the logs.
One can log into the notochord, type

```bash
sudo /bin/bash
killall unicorn
cd /opt/chordata/notochord-control-server
/etc/chordata/venv/bin/gunicorn -b '0.0.0.0:80' -w 1 'wsgi:application' \
    --threads 1 --access-logfile - \
    --error-logfile -
```

### Getting Core Dumps

We can get core dumps...

    ulimit -S -c unlimited
    # run gunicorn
    gdb /usr/bin/python3.9 /opt/chordata/notochord-control-server/core
    where


## KCeptor Calibration

* Needs to be done once for a new KCeptor.
* The results will be stored inside the KCeptor.
* The software on the Notochord is able to handle it.

## Pose Calibration

Needs to be done after KCeptors have been mounted on the body.

### Pose Calibration Overview

This consists of two steps:

* stand still in N-Pose (straight, arms & legs stretched, arms to body, legs together)
  this will be used to a first vector
* rotate each KCeptor into a defined direction (arms to the sides, body & legs forward)
  this will be used as a second vector

It looks like there are two versions:
* On the Notochord
* In the Blender plugin

### Avatar

To use the Pose Calibration on the Notochord, config needs to contain

    <use_armature>true</use_armature>

and an `<avatar>` section.

### Pose Calibration Debugging

In case the calibration fails, it dumps it's data into the directory `/opt/chordata/notochord-control-server/` on the Notochord.

`data.csv` will contain the sensor data.

`data.json` will contain the indices after `/opt/chordata/notochord-control-server/notochord_control_server/endpoints/pose.py` has been extended as follows:

```python
...
import json
...

def index():
    ...
    # Save the data
    with open("data.json", "w") as file:
        file.write(json.dumps({'indexes': data}))
    ...
```

Fetch the data using:

```bash
scp 'notochord:/opt/chordata/notochord-control-server/data.*' .
```

And evaluate locally:

```bash
venv/bin/pose-calib -t ./data.csv -i ./data.json
```

## Pose Calibration Implementation

### Calibration Data Capture

src/pose_calib/core.py

i: start
s: end

func_arms_(i|s)
func_trunc_(i|s)
func_legs_r_(i|s)
func_legs_l_(i|s)

### Calibration Calculation

T.B.D.

### Calibration Application

* file `notochord-module/pyx/notochord/calibration.pyx`, function `run_calibration()` calls `Calibrator.run()`
* file `notochord-module/pyx/notochord/calibration.pyx`, function `apply_calibration()` sets the `pre` and `post`
  quaternions in the armature's bones.

```c++
class _Bone {
    matrix4_ptr local_transform;    // Original transform
    matrix4_ptr global_transform;   // Derived transform

    bone_ptr parent;                // Parent bone
    std::vector<bone_ptr> children; // Child bones 

    Quaternion pre, post;           // calibration pre & post rotation; identity per default
}
```
this is used in
```c++
void Chordata::_Bone::set_global_rotation(Quaternion &_global_rotation, bool use_calibration) {
    if (use_calibration) { _global_rotation = pre * _global_rotation * post; }
...
}
```
which makes sense as the quaternions i get over COOP are global...

which is called by
```c++
void Chordata::_Armature::process_bone(const _Node &n, Quaternion &q) {
    bone_ptr bone = bones[n.get_label()];
    bone->set_global_rotation(q);
}
```
which is called by
```c++
void Chordata::Armature_Task::run() {
	Chordata::get_runtime()->get_armature()->process_bone(*node, q);
	if (node->first_sensor) {
		Chordata::get_runtime()->get_armature()->update();		
		comm::_transmit(Chordata::get_runtime()->get_armature().get()); 
		Chordata::Communicator::flush_loggers();
	}
}
```
and the armature is called once it is defined. otherwise data will be send as is:
```c++
void Chordata::Fusion_Task::run() {
    ...
    if (Chordata::get_config()->use_armature) {
        // forward to armature
    } else {
        // transmit quaternion as is
        comm::_transmit(*node, q);
        // when requested, also transmit raw data
        if (Chordata::get_config()->raw){ comm::_transmit(*node); }	
    }
    ...
}
```

for the time being, it seems we just need the nodes as we still send the global rotation (but adjusted) over COOP.

Okay, the above goes from bottom to top. Since the calibration data currrently get's lost, find out:
* How is the data captured
* How is it put on wire
* How is the avatar, which stores the calibration, initialized... and lost.

### REST API

Notochord Control Server 

    notochord-control-server/
        notochord_control_server/
            endpoints/
                configuration.py
                    GET /configuration/{}.xml
                    POST /configuration/{}.xml
                    DELETE /configuration/{}.xml
                    GET /configuration/set-i2c-addr?addr=...
                    GET /configuration/start-calibration?state=0&addr=0&port=0
                maintentance.py
                    GET /maintenance/update-notochord
                    GET /maintenance/update-server
                    GET /maintenance/update-os
                    GET /maintenance/update-all
                    GET /maintenance/get-wifi-ssids
                    GET /maintenance/set-wifi-mode?ssid=...&pwd...&countrycode=...
                    GET /maintenance/reboot
                    GET /maintenance/peek-output
                pose.py
                    GET /pose/connect
                      addr=127.0.0.1
                      port=6565
                      scan=false
                      raw=true
                      verbose=0
                    GET /pose/disconnect
                    GET /pose/calibrate
                      step=see notochord-module/pyx/notochord/calibration.pxd
                      run=false (true, 1: run calibration)
                    GET /pose/run
                      run calibration
                    GET /pose/data
                    GET /pose/index
                run.py
                    GET /notochord/init
                      scan=1
                      addr=192.168.178.24   ;; where to send
                      port=6565             
                      verbose=0             ;; info, debug, trace (0-2)
                      raw=0                 ;; send Q (4 fields) and raw (9 fields) COOP packets!
                    GET /notochord/end
                state.py
                    GET /state
                      clear_registry
                      peek_output
                        <ControlServerState>
                            <NotochordProcess>STOPPED</NotochordProcess>
                            <ExternalProcess active="False">
                                <Pty/>
                            </ExternalProcess>
                            <NotochordConfigurations>
                                <NotochordConfiguration active="false" label="mark_config" address="http://notochord.fritz.box/configuration/mark_config.xml" date="Thu Aug 10 11:07:18 2023"/>
                                <NotochordConfiguration active="false" label="mark_config" address="http://notochord.fritz.box/configuration/mark_config.xml" date="Thu Aug 10 11:07:18 2023"/>
                                <NotochordConfiguration active="false" label="default_biped" address="http://notochord.fritz.box/configuration/default_biped.xml" date="Thu Mar 30 11:36:55 2023"/>
                                <NotochordConfiguration active="true" label="blender_config" address="http://notochord.fritz.box/configuration/blender_config.xml" date="Thu Aug 10 17:24:10 2023"/>
                            </NotochordConfigurations>
                            <Log/>
                        </ControlServerState>
                    POST /state
                        <ControlServerState>
                          <NotochordConfigurations>
                            default_biped
                          </NotochordConfigurations>
                        </ControlServerState>

## Blender Plugin

blender add-on

/Users/mark/Library/Application Support/Blender/2.83/scripts/addons/chordata

```
__init__.py
__pycache__/
chordatatree.py
copp_server/            receive UDP traffic?
defaults.py
dependencies.py
nodes/
ops/                    code
  calibration_manager.py
    def run():
      ...
      return c.results["heading_rot"], c.results["post_rot"], now_str
  ops/armature_manager.py
    def calibrate():
      ...

new_quat = bone.chordata.Q_local_instant_conj \
                                        @ bone.chordata.Q_pre_calib \
                                        @ bone.chordata.Q_temp_received \
                                        @ bone.chordata.Q_post_calib

self.root_pbone.chordata.Q_local_instant_conj = self.root_local_matrix.to_quaternion().conjugated()

"For instance, if we are using a quaternion q to represent a rotation then
conj(q) represents the same rotation in the reverse direction."

pose-calibration/       same as on the notochord?
templates/
utils/
```
