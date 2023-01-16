This directory contains the data files from http://www.makehumancommunity.org/

```
data/
  3dobjs/       ;; 1,7M
    base.obj    ;; wavefront object file with the basic human body mesh
  targets/      ;; 125M
    *.target    ;; morph targets for base.obj
    *.png
  modifiers/    ;; 88K
    *.json      ;; 
    *.csv
```

The original MakeHuman stores the Wavefront Object Files and Targets as
NumPy files in a ZIP archive, reducing the size by about ten times.

Just storing them as binary will actually require more space.

Upstream data is stored in https://github.com/makehumancommunity/makehuman-assets
and downloaded with download_assets_git.py.
