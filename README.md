Fractal Lab with RenderFlies
============================

This is a modification to the Fractal Labs
to allow video rendering based on the RenderFlies system.
Web browsers are used to render still images and processing is done using Node.js

Requirements
============

* Node.js (Mac Brew users can run brew install node.js)
* Express and Formidable modules (npm install express formidable)
* A WebGl enabled browser (eg. Firefox4, Google Chrome)
* FFMpeg
* Create a tmp directory for still images upload and a render directory

Usage
=====
Run the server using
node server.js

Run the client by pointing your browser to
http://localhost:9000/

Click "Ready for Render"

Wait and see.

Recommended
===========
Use firefox 4 without image preview for best performances

Joshua Koo (zz85nus@gmail.com) http://www.lab4games.net/zz85/blog/


Info about the original Fractal Lab
===================================

An interactive WebGL based fractal raytracer.
See it online at [fractal.io](http://fractal.io).

**Compatibility**

Works best on Chrome 9 but also tested on Webkit nightly, Firefox 4.0b9+ on Max OS X.

**About**

Copyright (c) 2011 Tom Beddard [subblue.com](http://www.subblue.com).  
Released under the [GPL v3 license](http://www.gnu.org/licenses/).
