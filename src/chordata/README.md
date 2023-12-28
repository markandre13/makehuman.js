# Chordata Motion

[Chordata Motion](https://chordata.cc) is an open-source motion capture system of which I got the set with 15 sensors.

The folks are super busy working on it so instead of wasting their time, and because that's what I like to do anyway, here are my own collected notes while attempting to wrap my head around it.

## Setup

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

### Debug calibration

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

## Calibration

Chordata has two calibrations.

### KCeptor calibration

* Needs to be done once for a new KCeptor.
* The results will be stored inside the KCeptor.
* The software on the Notochord is able to handle it.

### Pose calibration

Needs to be done after KCeptors have been mounted on the body.

This consists of two steps:

* stand still in N-Pose (straight, arms & legs stretched, arms to body, legs together)
  this will be used to a first vector
* rotate each KCeptor into a defined direction (arms to the sides, body & legs forward)
  this will be used as a second vector

It looks like there are two versions:
* On the Notochord
* In the Blender plugin

# Notochord OS

## Boot

* the startup code is in /etc/rc.local, ...
* which starts the gunicorn web server, ...
* which gives control to /opt/chordata/notochord-control-server/wsgi.py
* which controls the bulk of the Notochord code in /opt/chordata/notochord-module/

## More logs

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
## Pose Calibration

the blender plugin uses this call:

    GET /notochord/init?addr=192.168.178.24&port=6565&scan=True&verbose=0&raw=True

and no calls to the pose/ endpoint. so i guess it's doing the calibration within
the blender plugin?

the blender plugin also creates files in the same directory as the .blend file

* Chordata_calib_dump.csv

  A dump of all Q and RAW COOP packets during the calibration.

```
  time(msec),node_label,q_w,q_x,q_y,q_z,g_x,g_y,g_z,a_x,a_y,a_z,m_x,m_y,m_z
  1639120,r-hand,0.18474090099334717,0.1065092459321022,0.7445586323738098,0.6325812339782715,-32,-29,-15,612,-4048,591,2407,-227,-25561
  ...
```
* Chordata_calib_data.json

  The result of the calibration. 
```
    calib_results {
        vert_rot: ..., 
        PCA: ..., 
        angle_PCA: ..., 
        gyro_int
        func_rot
        heading_rot
        post_rot
      }
      indexes: {}
      delta_time: number
      g_s: number
      a_s: number
      m_s: number
      fc: number
    }
```
* calibration_result.log

I got a failure and only got one file:

    2023-12-26T19-52-53-Chordata_calibration_result.log

which says it found labels like "kc_0x42branch6", but misses nodes like "l-lowerarm".

---

see https://forum.chordata.cc/d/62-new-blender-2-8-chordata-node-system-addon/35

    CHORDATA POSE CALIBRATION V0.1.2-A1 INIT
    RUNNING VERTICAL CALIBRATION
    RUNNING FUNCTIONAL CALIBRATION
    RUNNING HEADING CALIBRATION
    [2023-12-26 10:31:55 +0000] [1529] [WARNING] Worker with pid 1530 was terminated due to signal 11

since it crashes, it would be nice to dump the data somewhere...

The blender plug-in I have is version 1.2.2

## Source Code

Code is hosted at [GitLab](https://gitlab.com/chordata/). Sort by 'Updated' so see which repositories might be most relevant.

* [notochord-os](https://gitlab.com/chordata/notochord-os)
  Scripts to install all software on a fresh PI
* [notochord-control-server](https://gitlab.com/chordata/notochord-control-server)
  The Webserver: [gunicorn](https://gunicorn.org) as HTTPD and [Flask](https://www.fullstackpython.com/flask.html) as web framework.
* [notochord-module](https://gitlab.com/chordata/notochord-module)
  C/C++ Python Module
* [pose-calibration](https://gitlab.com/chordata/pose-calibration)
  The number crunching code to calibrate the sensors. (python, numpy, panda)
  * Integration into the notochord-module
    * notochord-module/setup.cfg references chordata-pose-calib @ git+https://gitlab.com/chordata/pose-calibration.git
    * [Cython](https://cython.org) combines the Python and C++ code
        * pxd: makes C/C++ code available to Python, included by the pyx file
        * pyx: adds some syntaxtical sugar
    * notochord-module/pyx/notochord/calibration.pyx
        * change_status(), get_data(), get_indexes(): directs to Calibration_Manager(), a C++ class for recording the data
        * run_calibration(): calls Calibrator().run() to evaluate the recorded data
        * apply_calibration(): calls get_runtime().get_armature().get().get_bones() and Bone.set_(pre|pose)_quaternion()

* [Blender-addon](https://gitlab.com/chordata/Blender-addon)
  On macOS will be installed into ~/Library/Application Support/Blender/2.83/scripts/addons/chordata/
  * the tree of KCeptor nodes can/will be uploaded as an XML configuration to the Notochord
  * the code used on the Notochord for Pose Calibration is also part of the addon

* [COPP server](https://gitlab.com/chordata/copp_server)
  COPP is the UDP protocol by which motion events are send.
* [notochord](https://gitlab.com/chordata/notochord) CLI tool
* [blender-mathutils](https://gitlab.com/chordata/blender-mathutils)
* [Avatar pose visualization](https://gitlab.com/chordata/avatar-pose-visualization)
  Avatar pose visualization for Blender

Which branches are relevant is a bit more tricky.
* master seems to be the latest official release
* develop seems to be the the latest stable development version
* the other branches seem to be feature branches
* to find the latest modified branches use `git branch -r --sort=-committerdate`

### Notochord Module

This is also were the websocket port is...

    notochord-module/
        src/
        lib/ ;; external libs copied into the source

### Notochord Control Server

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

### Pose Calibration

(this one seems to be just doing the math using a capture file)

Q: does this end up in the notochord-module as calibration.cpython-39-aarch64-linux-gnu.so ???

    pose-calibration/
        src/
           pose_calib/
               __main__.py             CLI
               core.py
                   class Calibrator
                       run()
                           vertical
                           functional
                           heading
               test_data/
                   Chordata_calib_data.json
                   Chordata_calib_dump.csv
        test/

    cd upstream/chordata
    python -m venv venv  

* CSV contains dump of motion capture take
* can plot the nodes
