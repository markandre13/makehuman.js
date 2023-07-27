# Chordata Motion

[Chordata Motion](https://chordata.cc) is an open-source motion capture system of which I got the "Full Motion" set with 15 sensors.

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

Some things to do on the CLI:

* ssh human@notochord, chordata
* to .bashrc add export PATH="/etc/chordata/venv/bin:${PATH}"
* notochord --scan
* config at /opt/chordata/notochord-module/dist/notochord/Chordata.xml says
  * udp 6565
  * ws 7681

## Source Code

Code is hosted at [GitLab](https://gitlab.com/chordata/). Sort by 'Updated' so see which repositories might be most relevant.

* [notochord OS](https://gitlab.com/chordata/notochord-os)
  Scripts to install all software on a fresh PI
* [Notochord control server](https://gitlab.com/chordata/notochord-control-server)
  The Webserver running on the PI (written in Python)
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

### Pose Calibration

    pose-calibration/
        src/
           pose_calib/
               __main__.py             CLI
               core.py                 class Calibrator
               test_data/
                   Chordata_calib_data.json
                   Chordata_calib_dump.csv
        test/

Callibration   
  Static
  Arms
  Trunk
  Left Leg
  Right Leg
