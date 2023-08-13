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

Configuration

/opt/chordata/notochord-control-server/notochord_control_server/state.json
    {"active_configuration": "blender_config"}
/opt/chordata/notochord-control-server/notochord_control_server/files/*.xml   
  * default_biped.xml   ;; this seems to be an older one
  * blender_config.xml  ;; this one's more recent and logical


```xml
<!-- Chordata.xml -->
<chordata version="1.0.0">
  <configuration>
    <kc_revision>++</kc_revision>
    <communication>
      <adapter>/dev/i2c-1</adapter>
      <ip>192.168.178.24</ip>
      <port>6565</port>
      <log>stdout,file</log>
      <transmit>osc</transmit>
      <send_rate>50</send_rate>
      <verbosity>0</verbosity>
    </communication>
    <osc>
      <base>/Chordata</base>
    </osc>
    <fusion>
      <beta_start>1.0</beta_start>
      <beta_final>0.2</beta_final>
      <time>5000</time>
    </fusion>
  </configuration>
  <hierarchy>
    <mux Name="main" id="0">0x70
      <branch Name="branch" id="1">CH_1
        <k_ceptor Name="r-upperleg" id="2">0x40
          <k_ceptor Name="r-lowerleg" id="2">0x41
            <k_ceptor Name="r-foot" id="2">0x42
      </k_ceptor></k_ceptor></k_ceptor></branch>
      <branch Name="branch" id="1">CH_2
        <k_ceptor Name="base" id="2">0x40
      </k_ceptor></branch>
      <branch Name="branch" id="1">CH_3
        <k_ceptor Name="l-upperleg" id="2">0x40
          <k_ceptor Name="l-lowerleg" id="2">0x41
            <k_ceptor Name="l-foot" id="2">0x42
      </k_ceptor></k_ceptor></k_ceptor></branch>
      <branch Name="branch" id="1">CH_4
        <k_ceptor Name="l-upperarm" id="2">0x40
          <k_ceptor Name="l-lowerarm" id="2">0x41
            <k_ceptor Name="l-hand" id="2">0x42
      </k_ceptor></k_ceptor></k_ceptor></branch>
      <branch Name="branch" id="1">CH_5
        <k_ceptor Name="dorsal" id="2">0x41
          <k_ceptor Name="neck" id="2">0x42
      </k_ceptor></k_ceptor></branch>
      <branch Name="branch" id="1">CH_6
        <k_ceptor Name="r-upperarm" id="2">0x40
          <k_ceptor Name="r-lowerarm" id="2">0x41
            <k_ceptor Name="r-hand" id="2">0x42
      </k_ceptor></k_ceptor></k_ceptor></branch>
    </mux>
  </hierarchy>
</chordata>
```

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
                    GET /notochord/end
                state.py
                    GET /state
                    POST /state
                      
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
    

* CSV contains dump of motin capture take
* can plot the nodes

#### Callibration   
1. Static
    1. stand straight (N-Pose)
2. Functional
    1. Arms (rotate forward/up by 90 deg)
    2. Trunk/Torso (bend upper body down)
    4. Left Leg (rotate forward/up)
    5. Right Leg (rotate forward up)
