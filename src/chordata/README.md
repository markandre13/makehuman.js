# Chordata Motion

[Chordata Motion](https://chordata.cc) is an open-source motion capture system of which I got the set with 15 sensors.

The folks are super busy working on it so instead of wasting their time, and because that's what I like to do anyway, here are my own collected notes while attempting to wrap my head around it.

## Setup

I have [macOS](https://en.wikipedia.org/wiki/MacOS) and a [FRITZ!Box](https://en.wikipedia.org/wiki/Fritz!Box) at home and Chordata Motion will appear under http://notochord.local in my local network (for the time being, avoid Safari unless you like
waiting).

Start by looking at the [official documentation](https://chordata.gitlab.io/docs/), then take some hints from here to get around the tiny head scratchers:

* With the [Raspberry Pi Imager](https://www.raspberrypi.com/software/), flash the image from https://chordata.cc/downloads/
* Mount disk
* Into the root directory, add the uppercase, 2 letter country code to /boot/countrycode.txt so that the WLAN knows which country regulations to adhere to be able to start
* Boot Raspberry Pi
* Connect to WLAN "Chordata-net", "chordata".
* Open http://notochord.local
* Open 'Maintenance' tab
* Under 'Connection Manager', mark the checkbox below 'Wifi SSID'
* Enter your local WLAN SSID & Password
* Click [Set WIFI]
* Click [Reboot]

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

This needs to be implemented in makehuman.js

# Nerd Stuff

## Some things to do on the CLI:

* ssh human@notochord, chordata
* to .bashrc add export PATH="/etc/chordata/venv/bin:${PATH}"
* notochord --scan
* config at /opt/chordata/notochord-module/dist/notochord/Chordata.xml says
  * udp 6565
  * ws 7681

* the startup code is in /etc/rc.local
* it starts the gunicorn httpd...
* with giving control to /opt/chordata/notochord-control-server/wsgi.py

* to be able to call the Notochord from you local development machine, to
  `/opt/chordata/notochord-control-server/notochord_control_server/__init__` add

    @app.after_request
    def apply_caching(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

  and reboot.

## Source Code

Code is hosted at [GitLab](https://gitlab.com/chordata/). Sort by 'Updated' so see which repositories might be most relevant.

* [notochord OS](https://gitlab.com/chordata/notochord-os)
  Scripts to install all software on a fresh PI
* [Notochord control server](https://gitlab.com/chordata/notochord-control-server)
  The Webserver running on the PI (written in Python) based using [gunicorn](https://gunicorn.org) as HTTPD and [Flask](https://www.fullstackpython.com/flask.html) as framework.
* [notochord-module](https://gitlab.com/chordata/notochord-module)
  C/C++ Python Module
* [Pose Calibration](https://gitlab.com/chordata/pose-calibration)
* [COPP server](https://gitlab.com/chordata/copp_server)
  COPP is the UDP protocol by which motion events are send.
* [notochord](https://gitlab.com/chordata/notochord) CLI tool
* [Blender-addon](https://gitlab.com/chordata/Blender-addon)
  On macOS will be installed into ~/Library/Application Support/Blender/3.6/scripts/addons/chordata/
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
                    GET /pose/calibrate
                      step=see notochord-module/pyx/notochord/calibration.pxd
                      run=false
                    GET /pose/run
                    GET /pose/data
                    GET /pose/index
                run.py
                    GET /notochord/init
                      scan=1
                      addr=192.168.178.24   ;; where to send
                      port=6565             
                      verbose=0             ;; info, debug, trace
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
                      
                CALIB_IDLE  = 0,
                CALIBRATING = 1,
                STATIC      = 2,
                ARMS        = 3,
                TRUNK       = 4,
                LEFT_LEG    = 5,
                RIGHT_LEG   = 6

### Pose Calibration

(this one seems to be doing just the math using a capture file)

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
