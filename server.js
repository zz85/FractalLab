/*
 * FractalLab RenderFlies Server 
 * by Joshua Koo zz85nus@gmail.com
 * Released to public domain.
 * Please share if you find this useful!
 *
 * This uses node.js (with express and formidable modules).
 * 
 * Run npm install express formidable if you do not have these modules installed
 *
 * FFMpeg is also required for mp4 encoding
 *
 */

var app = require('express').createServer();

var formidable = require('formidable');

var fs = require('fs'),
	util = require('util'),
	spawn = require('child_process').spawn;

// RenderFlies Configuration
var html_dir,
	stills_dir,
	render_dir,
	port = 9000;


var k_UNALLOCATED = 1,
	k_ALLOCATED = 2,
	k_RENDERED = 3;

// Use a hashmap here to keep track of statuses of frames to render
var renders = {};

/*
 Here's a simple description of the current simple protocol
 
 1. Client browser request for application
    ---> Get App 
		<--- return dev
			Server serves application
 
 2. Client is ready to render
	---> Sends ping for jobs
		<--- project. details, timeline
			Server returns project information
 
 3. Client renders a frame
    ---> Uploads base64 encoded image via AJAX
		<--- new frame id
			Server decodes, save file, marked frame as rendered
			Pick unallocated frame, mark as allocated,
			Send new frame id to client for rendering.
			If all frames are rendered, start encoding
*/

/* 
 * Below is the project settings
 *
 * For now, we hard code the project settings.
 * This renders a 19s animation of "Into The Core"
 *
 */
var shaders = {"fragment":"#ifdef GL_ES\nprecision highp float;\n#endif\n\n/**\n * Fractal Lab's uber 3D fractal shader\n * Last update: 26 February 2011\n *\n * Changelog:\n *      0.1     - Initial release\n *      0.2     - Refactor for Fractal Lab\n *\n * \n * Copyright 2011, Tom Beddard\n * http://www.subblue.com\n *\n * For more generative graphics experiments see:\n * http://www.subblue.com\n *\n * Licensed under the GPL Version 3 license.\n * http://www.gnu.org/licenses/\n *\n * \n * Credits and references\n * ======================\n * \n * http://www.fractalforums.com/3d-fractal-generation/a-mandelbox-distance-estimate-formula/\n * http://www.fractalforums.com/3d-fractal-generation/revenge-of-the-half-eaten-menger-sponge/msg21700/\n * http://www.fractalforums.com/index.php?topic=3158.msg16982#msg16982\n * \n * Various other discussions on the fractal can be found here:\n * http://www.fractalforums.com/3d-fractal-generation/\n *\n *\n*/\n\n#define HALFPI 1.570796\n#define MIN_EPSILON 6e-7\n#define MIN_NORM 1.5e-7\n#define dE MengerSponge             // {\"label\":\"Fractal type\", \"control\":\"select\", \"options\":[\"MengerSponge\", \"SphereSponge\", \"Mandelbulb\", \"Mandelbox\", \"OctahedralIFS\", \"DodecahedronIFS\"]}\n\n#define maxIterations 8             // {\"label\":\"Iterations\", \"min\":1, \"max\":30, \"step\":1, \"group_label\":\"Fractal parameters\"}\n#define stepLimit 60                // {\"label\":\"Max steps\", \"min\":10, \"max\":300, \"step\":1}\n\n#define aoIterations 4              // {\"label\":\"AO iterations\", \"min\":0, \"max\":10, \"step\":1}\n\n#define minRange 6e-5\n#define bailout 4.0\n#define antialiasing 0.5            // {\"label\":\"Anti-aliasing\", \"control\":\"bool\", \"default\":false, \"group_label\":\"Render quality\"}\n\n\nuniform float scale;                // {\"label\":\"Scale\",        \"min\":-10,  \"max\":10,   \"step\":0.01,     \"default\":2,    \"group\":\"Fractal\", \"group_label\":\"Fractal parameters\"}\nuniform float power;                // {\"label\":\"Power\",        \"min\":-20,  \"max\":20,   \"step\":0.1,     \"default\":8,    \"group\":\"Fractal\"}\nuniform float surfaceDetail;        // {\"label\":\"Detail\",   \"min\":0.1,  \"max\":2,    \"step\":0.01,    \"default\":0.6,  \"group\":\"Fractal\"}\nuniform float surfaceSmoothness;    // {\"label\":\"Smoothness\",   \"min\":0.01,  \"max\":1,    \"step\":0.01,    \"default\":0.8,  \"group\":\"Fractal\"}\nuniform float boundingRadius;       // {\"label\":\"Bounding radius\", \"min\":0.1, \"max\":150, \"step\":0.01, \"default\":5, \"group\":\"Fractal\"}\nuniform vec3  offset;               // {\"label\":[\"Offset x\",\"Offset y\",\"Offset z\"],  \"min\":-3,   \"max\":3,    \"step\":0.01,    \"default\":[0,0,0],  \"group\":\"Fractal\", \"group_label\":\"Offsets\"}\nuniform vec3  shift;                // {\"label\":[\"Shift x\",\"Shift y\",\"Shift z\"],  \"min\":-3,   \"max\":3,    \"step\":0.01,    \"default\":[0,0,0],  \"group\":\"Fractal\"}\n\nuniform float cameraRoll;           // {\"label\":\"Roll\",         \"min\":-180, \"max\":180,  \"step\":0.5,     \"default\":0,    \"group\":\"Camera\", \"group_label\":\"Camera parameters\"}\nuniform float cameraPitch;          // {\"label\":\"Pitch\",        \"min\":-180, \"max\":180,  \"step\":0.5,     \"default\":0,    \"group\":\"Camera\"}\nuniform float cameraYaw;            // {\"label\":\"Yaw\",          \"min\":-180, \"max\":180,  \"step\":0.5,     \"default\":0,    \"group\":\"Camera\"}\nuniform float cameraFocalLength;    // {\"label\":\"Focal length\", \"min\":0.1,  \"max\":3,    \"step\":0.01,    \"default\":0.9,  \"group\":\"Camera\"}\nuniform vec3  cameraPosition;       // {\"label\":[\"Camera x\", \"Camera y\", \"Camera z\"],   \"default\":[0.0, 0.0, -2.5], \"control\":\"camera\", \"group\":\"Camera\", \"group_label\":\"Position\"}\n\nuniform int   colorIterations;      // {\"label\":\"Colour iterations\", \"default\": 4, \"min\":0, \"max\": 30, \"step\":1, \"group\":\"Colour\", \"group_label\":\"Base colour\"}\nuniform vec3  color1;               // {\"label\":\"Colour 1\",  \"default\":[1.0, 1.0, 1.0], \"group\":\"Colour\", \"control\":\"color\"}\nuniform float color1Intensity;      // {\"label\":\"Colour 1 intensity\", \"default\":0.45, \"min\":0, \"max\":3, \"step\":0.01, \"group\":\"Colour\"}\nuniform vec3  color2;               // {\"label\":\"Colour 2\",  \"default\":[0, 0.53, 0.8], \"group\":\"Colour\", \"control\":\"color\"}\nuniform float color2Intensity;      // {\"label\":\"Colour 2 intensity\", \"default\":0.3, \"min\":0, \"max\":3, \"step\":0.01, \"group\":\"Colour\"}\nuniform vec3  color3;               // {\"label\":\"Colour 3\",  \"default\":[1.0, 0.53, 0.0], \"group\":\"Colour\", \"control\":\"color\"}\nuniform float color3Intensity;      // {\"label\":\"Colour 3 intensity\", \"default\":0, \"min\":0, \"max\":3, \"step\":0.01, \"group\":\"Colour\"}\nuniform bool  transparent;          // {\"label\":\"Transparent background\", \"default\":false, \"group\":\"Colour\"}\nuniform float gamma;                // {\"label\":\"Gamma correction\", \"default\":1, \"min\":0.1, \"max\":2, \"step\":0.01, \"group\":\"Colour\"}\n\nuniform vec3  light;                // {\"label\":[\"Light x\", \"Light y\", \"Light z\"], \"default\":[-16.0, 100.0, -60.0], \"min\":-300, \"max\":300,  \"step\":1,   \"group\":\"Shading\", \"group_label\":\"Light position\"}\nuniform vec2  ambientColor;         // {\"label\":[\"Ambient intensity\", \"Ambient colour\"],  \"default\":[0.5, 0.3], \"group\":\"Colour\", \"group_label\":\"Ambient light & background\"}\nuniform vec3  background1Color;     // {\"label\":\"Background top\",   \"default\":[0.0, 0.46, 0.8], \"group\":\"Colour\", \"control\":\"color\"}\nuniform vec3  background2Color;     // {\"label\":\"Background bottom\", \"default\":[0, 0, 0], \"group\":\"Colour\", \"control\":\"color\"}\nuniform vec3  innerGlowColor;       // {\"label\":\"Inner glow\", \"default\":[0.0, 0.6, 0.8], \"group\":\"Shading\", \"control\":\"color\", \"group_label\":\"Glows\"}\nuniform float innerGlowIntensity;   // {\"label\":\"Inner glow intensity\", \"default\":0.1, \"min\":0, \"max\":1, \"step\":0.01, \"group\":\"Shading\"}\nuniform vec3  outerGlowColor;       // {\"label\":\"Outer glow\", \"default\":[1.0, 1.0, 1.0], \"group\":\"Shading\", \"control\":\"color\"}\nuniform float outerGlowIntensity;   // {\"label\":\"Outer glow intensity\", \"default\":0.0, \"min\":0, \"max\":1, \"step\":0.01, \"group\":\"Shading\"}\nuniform float fog;                  // {\"label\":\"Fog intensity\",          \"min\":0,    \"max\":1,    \"step\":0.01,    \"default\":0,    \"group\":\"Shading\", \"group_label\":\"Fog\"}\nuniform float fogFalloff;           // {\"label\":\"Fog falloff\",  \"min\":0,    \"max\":10,   \"step\":0.01,    \"default\":0,    \"group\":\"Shading\"}\nuniform float specularity;          // {\"label\":\"Specularity\",  \"min\":0,    \"max\":3,    \"step\":0.01,    \"default\":0.8,  \"group\":\"Shading\", \"group_label\":\"Shininess\"}\nuniform float specularExponent;     // {\"label\":\"Specular exponent\", \"min\":0, \"max\":50, \"step\":0.1,     \"default\":4,    \"group\":\"Shading\"}\n\nuniform vec2  size;                 // {\"default\":[400, 300]}\nuniform vec2  outputSize;           // {\"default\":[800, 600]}\nuniform float aoIntensity;          // {\"label\":\"AO intensity\",     \"min\":0, \"max\":1, \"step\":0.01, \"default\":0.15,  \"group\":\"Shading\", \"group_label\":\"Ambient occlusion\"}\nuniform float aoSpread;             // {\"label\":\"AO spread\",    \"min\":0, \"max\":20, \"step\":0.01, \"default\":9,  \"group\":\"Shading\"}\n\nuniform mat3  objectRotation;       // {\"label\":[\"Rotate x\", \"Rotate y\", \"Rotate z\"], \"group\":\"Fractal\", \"control\":\"rotation\", \"default\":[0,0,0], \"min\":-360, \"max\":360, \"step\":1, \"group_label\":\"Object rotation\"}\nuniform mat3  fractalRotation1;     // {\"label\":[\"Rotate x\", \"Rotate y\", \"Rotate z\"], \"group\":\"Fractal\", \"control\":\"rotation\", \"default\":[0,0,0], \"min\":-360, \"max\":360, \"step\":1, \"group_label\":\"Fractal rotation 1\"}\nuniform mat3  fractalRotation2;     // {\"label\":[\"Rotate x\", \"Rotate y\", \"Rotate z\"], \"group\":\"Fractal\", \"control\":\"rotation\", \"default\":[0,0,0], \"min\":-360, \"max\":360, \"step\":1, \"group_label\":\"Fractal rotation 2\"}\nuniform bool  depthMap;             // {\"label\":\"Depth map\", \"default\": false, \"value\":1, \"group\":\"Shading\"}\n\n\nfloat aspectRatio = outputSize.x / outputSize.y;\nfloat fovfactor = 1.0 / sqrt(1.0 + cameraFocalLength * cameraFocalLength);\nfloat pixelScale = 1.0 / min(outputSize.x, outputSize.y);\nfloat epsfactor = 2.0 * fovfactor * pixelScale * surfaceDetail;\nvec3  w = vec3(0, 0, 1);\nvec3  v = vec3(0, 1, 0);\nvec3  u = vec3(1, 0, 0);\nmat3  cameraRotation;\n\n\n// Return rotation matrix for rotating around vector v by angle\nmat3 rotationMatrixVector(vec3 v, float angle)\n{\n    float c = cos(radians(angle));\n    float s = sin(radians(angle));\n    \n    return mat3(c + (1.0 - c) * v.x * v.x, (1.0 - c) * v.x * v.y - s * v.z, (1.0 - c) * v.x * v.z + s * v.y,\n              (1.0 - c) * v.x * v.y + s * v.z, c + (1.0 - c) * v.y * v.y, (1.0 - c) * v.y * v.z - s * v.x,\n              (1.0 - c) * v.x * v.z - s * v.y, (1.0 - c) * v.y * v.z + s * v.x, c + (1.0 - c) * v.z * v.z);\n}\n\n\n\n\n// ============================================================================================ //\n\n\n#ifdef dESphereSponge\nuniform float sphereHoles;          // {\"label\":\"Holes\",        \"min\":3,    \"max\":6,    \"step\":0.01,    \"default\":4,    \"group\":\"Fractal\", \"group_label\":\"Additional parameters\"}\nuniform float sphereScale;          // {\"label\":\"Sphere scale\", \"min\":0.01, \"max\":3,    \"step\":0.01,    \"default\":2.05,    \"group\":\"Fractal\"}\n\n// Adapted from Buddhis algorithm\n// http://www.fractalforums.com/3d-fractal-generation/revenge-of-the-half-eaten-menger-sponge/msg21700/\nvec3 SphereSponge(vec3 w)\n{\n    w *= objectRotation;\n    float k = scale;\n    float d = -10000.0;\n    float d1, r, md = 100000.0, cd = 0.0;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        vec3 zz = mod(w * k, sphereHoles) - vec3(0.5 * sphereHoles) + offset;\n        r = length(zz);\n        \n        // distance to the edge of the sphere (positive inside)\n        d1 = (sphereScale - r) / k;\n        k *= scale;\n        \n        // intersection\n        d = max(d, d1);\n        \n        if (i < colorIterations) {\n            md = min(md, d);\n            cd = r;\n        }\n    }\n    \n    return vec3(d, cd, md);\n}\n#endif\n\n\n// ============================================================================================ //\n\n\n#ifdef dEMengerSponge\n// Pre-calculations\nvec3 halfSpongeScale = vec3(0.5) * scale;\n\n// Adapted from Buddhis algorithm\n// http://www.fractalforums.com/3d-fractal-generation/revenge-of-the-half-eaten-menger-sponge/msg21700/\nvec3 MengerSponge(vec3 w)\n{\n    w *= objectRotation;\n    w = (w * 0.5 + vec3(0.5)) * scale;  // scale [-1, 1] range to [0, 1]\n\n    vec3 v = abs(w - halfSpongeScale) - halfSpongeScale;\n    float d1 = max(v.x, max(v.y, v.z));     // distance to the box\n    float d = d1;\n    float p = 1.0;\n    float md = 10000.0;\n    vec3 cd = v;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        vec3 a = mod(3.0 * w * p, 3.0);\n        p *= 3.0;\n        \n        v = vec3(0.5) - abs(a - vec3(1.5)) + offset;\n        v *= fractalRotation1;\n\n        // distance inside the 3 axis aligned square tubes\n        d1 = min(max(v.x, v.z), min(max(v.x, v.y), max(v.y, v.z))) / p;\n        \n        // intersection\n        d = max(d, d1);\n        \n        if (i < colorIterations) {\n            md = min(md, d);\n            cd = v;\n        }\n    }\n    \n    // The distance estimate, min distance, and fractional iteration count\n    return vec3(d * 2.0 / scale, md, dot(cd, cd));\n}\n#endif\n\n\n// ============================================================================================ //\n\n\n#ifdef dEOctahedralIFS\n// Pre-calculations\nvec3 scale_offset = offset * (scale - 1.0);\n\nvec3 OctahedralIFS(vec3 w)\n{\n    w *= objectRotation;\n    float d, t;\n    float md = 1000.0, cd = 0.0;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        w *= fractalRotation1;\n        w = abs(w + shift) - shift;\n        \n        // Octahedral\n        if (w.x < w.y) w.xy = w.yx;\n        if (w.x < w.z) w.xz = w.zx;\n        if (w.y < w.z) w.yz = w.zy;\n        \n        w *= fractalRotation2;\n        w *= scale;\n        w -= scale_offset;\n\n        // Record minimum orbit for colouring\n        d = dot(w, w);\n        \n        if (i < colorIterations) {\n            md = min(md, d);\n            cd = d;\n        }\n    }\n        \n    return vec3((length(w) - 2.0) * pow(scale, -float(maxIterations)), md, cd);\n}\n#endif\n\n\n// ============================================================================================ //\n\n\n\n#ifdef dEDodecahedronIFS\n\n// phi = 1.61803399\nuniform float phi;  // {\"label\":\"Phi\", \"min\":0.1, \"max\":3, \"step\":0.01, \"default\":1.618, \"group\":\"Fractal\"}\n\n// Dodecahedron serpinski\n// Thanks to Knighty:\n// http://www.fractalforums.com/index.php?topic=3158.msg16982#msg16982\n// The normal vectors for the dodecahedra-siepinski folding planes are:\n// (phi^2, 1, -phi), (-phi, phi^2, 1), (1, -phi, phi^2), (-phi*(1+phi), phi^2-1, 1+phi), (1+phi, -phi*(1+phi), phi^2-1) and x=0, y=0, z=0 planes.\n\n// Pre-calculations\nvec3 scale_offset = offset * (scale - 1.0);\n\nfloat _IKVNORM_ = 1.0 / sqrt(pow(phi * (1.0 + phi), 2.0) + pow(phi * phi - 1.0, 2.0) + pow(1.0 + phi, 2.0));\nfloat _C1_ = phi * (1.0 + phi) * _IKVNORM_;\nfloat _C2_ = (phi * phi - 1.0) * _IKVNORM_;\nfloat _1C_ = (1.0 + phi) * _IKVNORM_;\n\nvec3 phi3 = vec3(0.5, 0.5 / phi, 0.5 * phi);\nvec3 c3   = vec3(_C1_, _C2_, _1C_);\n\n\nvec3 DodecahedronIFS(vec3 w)\n{\n    w *= objectRotation;\n    float d, t;\n    float md = 1000.0, cd = 0.0;\n\n    for (int i = 0; i < int(maxIterations); i++) {\n        w *= fractalRotation1;\n        w = abs(w + shift) - shift;\n        \n        t = w.x * phi3.z + w.y * phi3.y - w.z * phi3.x;\n        if (t < 0.0) w += vec3(-2.0, -2.0, 2.0) * t * phi3.zyx;\n        \n        t = -w.x * phi3.x + w.y * phi3.z + w.z * phi3.y;\n        if (t < 0.0) w += vec3(2.0, -2.0, -2.0) * t * phi3.xzy;\n        \n        t = w.x * phi3.y - w.y * phi3.x + w.z * phi3.z;\n        if (t < 0.0) w += vec3(-2.0, 2.0, -2.0) * t * phi3.yxz;\n        \n        t = -w.x * c3.x + w.y * c3.y + w.z * c3.z;\n        if (t < 0.0) w += vec3(2.0, -2.0, -2.0) * t * c3.xyz;\n        \n        t = w.x * c3.z - w.y * c3.x + w.z * c3.y;\n        if (t < 0.0) w += vec3(-2.0, 2.0, -2.0) * t * c3.zxy;\n        \n        w *= fractalRotation2;\n        w *= scale;\n        w -= scale_offset;\n\n        // Record minimum orbit for colouring\n        d = dot(w, w);\n        \n        if (i < colorIterations) {\n            md = min(md, d);\n            cd = d;\n        }\n    }\n        \n    return vec3((length(w) - 2.0) * pow(scale, -float(maxIterations)), md, cd);\n}\n#endif\n\n\n// ============================================================================================ //\n\n\n\n#ifdef dEMandelbox\nuniform float sphereScale;          // {\"label\":\"Sphere scale\", \"min\":0.01, \"max\":3,    \"step\":0.01,    \"default\":1,    \"group\":\"Fractal\", \"group_label\":\"Additional parameters\"}\nuniform float boxScale;             // {\"label\":\"Box scale\",    \"min\":0.01, \"max\":3,    \"step\":0.001,   \"default\":0.5,  \"group\":\"Fractal\"}\nuniform float boxFold;              // {\"label\":\"Box fold\",     \"min\":0.01, \"max\":3,    \"step\":0.001,   \"default\":1,    \"group\":\"Fractal\"}\nuniform float fudgeFactor;          // {\"label\":\"Box size fudge factor\",     \"min\":0, \"max\":100,    \"step\":0.001,   \"default\":0,    \"group\":\"Fractal\"}\n\n// Pre-calculations\nfloat mR2 = boxScale * boxScale;    // Min radius\nfloat fR2 = sphereScale * mR2;      // Fixed radius\nvec2  scaleFactor = vec2(scale, abs(scale)) / mR2;\n\n// Details about the Mandelbox DE algorithm:\n// http://www.fractalforums.com/3d-fractal-generation/a-mandelbox-distance-estimate-formula/\nvec3 Mandelbox(vec3 w)\n{\n    w *= objectRotation;\n    float md = 1000.0;\n    vec3 c = w;\n    \n    // distance estimate\n    vec4 p = vec4(w.xyz, 1.0),\n        p0 = vec4(w.xyz, 1.0);  // p.w is knighty's DEfactor\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        // box fold:\n        // if (p > 1.0) {\n        //   p = 2.0 - p;\n        // } else if (p < -1.0) {\n        //   p = -2.0 - p;\n        // }\n        p.xyz = clamp(p.xyz, -boxFold, boxFold) * 2.0 * boxFold - p.xyz;  // box fold\n        p.xyz *= fractalRotation1;\n        \n        // sphere fold:\n        // if (d < minRad2) {\n        //   p /= minRad2;\n        // } else if (d < 1.0) {\n        //   p /= d;\n        // }\n        float d = dot(p.xyz, p.xyz);\n        p.xyzw *= clamp(max(fR2 / d, mR2), 0.0, 1.0);  // sphere fold\n        \n        p.xyzw = p * scaleFactor.xxxy + p0 + vec4(offset, 0.0);\n        p.xyz *= fractalRotation2;\n\n        if (i < colorIterations) {\n            md = min(md, d);\n            c = p.xyz;\n        }\n    }\n    \n    // Return distance estimate, min distance, fractional iteration count\n    return vec3((length(p.xyz) - fudgeFactor) / p.w, md, 0.33 * log(dot(c, c)) + 1.0);\n}\n#endif\n\n\n\n// ============================================================================================ //\n\n\n\n#ifdef dEMandelbulb\nuniform float juliaFactor; // {\"label\":\"Juliabulb factor\", \"min\":0, \"max\":1, \"step\":0.01, \"default\":0, \"group\":\"Fractal\", \"group_label\":\"Additional parameters\"}\nuniform float radiolariaFactor; // {\"label\":\"Radiolaria factor\", \"min\":-2, \"max\":2, \"step\":0.1, \"default\":0, \"group\":\"Fractal\"}\nuniform float radiolaria;       // {\"label\":\"Radiolaria\", \"min\":0, \"max\":1, \"step\":0.01, \"default\": 0, \"group\":\"Fractal\"}\n\n\n// Scalar derivative approach by Enforcer:\n// http://www.fractalforums.com/mandelbulb-implementation/realtime-renderingoptimisations/\nvoid powN(float p, inout vec3 z, float zr0, inout float dr)\n{\n    float zo0 = asin(z.z / zr0);\n    float zi0 = atan(z.y, z.x);\n    float zr = pow(zr0, p - 1.0);\n    float zo = zo0 * p;\n    float zi = zi0 * p;\n    float czo = cos(zo);\n\n    dr = zr * dr * p + 1.0;\n    zr *= zr0;\n\n    z = zr * vec3(czo * cos(zi), czo * sin(zi), sin(zo));\n}\n\n\n\n// The fractal calculation\n//\n// Calculate the closest distance to the fractal boundary and use this\n// distance as the size of the step to take in the ray marching.\n//\n// Fractal formula:\n//    z' = z^p + c\n//\n// For each iteration we also calculate the derivative so we can estimate\n// the distance to the nearest point in the fractal set, which then sets the\n// maxiumum step we can move the ray forward before having to repeat the calculation.\n//\n//   dz' = p * z^(p-1)\n//\n// The distance estimation is then calculated with:\n//\n//   0.5 * |z| * log(|z|) / |dz|\n//\nvec3 Mandelbulb(vec3 w)\n{\n    w *= objectRotation;\n    \n    vec3 z = w;\n    vec3 c = mix(w, offset, juliaFactor);\n    vec3 d = w;\n    float dr = 1.0;\n    float r  = length(z);\n    float md = 10000.0;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        powN(power, z, r, dr);\n        \n        z += c;\n            \n        if (z.y > radiolariaFactor) {\n            z.y = mix(z.y, radiolariaFactor, radiolaria);\n        }\n        \n        r = length(z);\n        \n        if (i < colorIterations) {\n            md = min(md, r);\n            d = z;\n        }\n        \n        if (r > bailout) break;\n    }\n\n    return vec3(0.5 * log(r) * r / dr, md, 0.33 * log(dot(d, d)) + 1.0);\n}\n#endif\n\n\n\n// ============================================================================================ //\n\n\n\n// Define the ray direction from the pixel coordinates\nvec3 rayDirection(vec2 pixel)\n{\n    vec2 p = (0.5 * size - pixel) / vec2(size.x, -size.y);\n    p.x *= aspectRatio;\n    vec3 d = (p.x * u + p.y * v - cameraFocalLength * w);\n    \n    return normalize(cameraRotation * d);\n}\n\n\n\n// Intersect bounding sphere\n//\n// If we intersect then set the tmin and tmax values to set the start and\n// end distances the ray should traverse.\nbool intersectBoundingSphere(vec3 origin,\n                             vec3 direction,\n                             out float tmin,\n                             out float tmax)\n{\n    bool hit = false;\n    float b = dot(origin, direction);\n    float c = dot(origin, origin) - boundingRadius;\n    float disc = b*b - c;           // discriminant\n    tmin = tmax = 0.0;\n\n    if (disc > 0.0) {\n        // Real root of disc, so intersection\n        float sdisc = sqrt(disc);\n        float t0 = -b - sdisc;          // closest intersection distance\n        float t1 = -b + sdisc;          // furthest intersection distance\n\n        if (t0 >= 0.0) {\n            // Ray intersects front of sphere\n            tmin = t0;\n            tmax = t0 + t1;\n        } else if (t0 < 0.0) {\n            // Ray starts inside sphere\n            tmax = t1;\n        }\n        hit = true;\n    }\n\n    return hit;\n}\n\n\n\n\n// Calculate the gradient in each dimension from the intersection point\nvec3 generateNormal(vec3 z, float d)\n{\n    float e = max(d * 0.5, MIN_NORM);\n    \n    float dx1 = dE(z + vec3(e, 0, 0)).x;\n    float dx2 = dE(z - vec3(e, 0, 0)).x;\n    \n    float dy1 = dE(z + vec3(0, e, 0)).x;\n    float dy2 = dE(z - vec3(0, e, 0)).x;\n    \n    float dz1 = dE(z + vec3(0, 0, e)).x;\n    float dz2 = dE(z - vec3(0, 0, e)).x;\n    \n    return normalize(vec3(dx1 - dx2, dy1 - dy2, dz1 - dz2));\n}\n\n\n// Blinn phong shading model\n// http://en.wikipedia.org/wiki/BlinnPhong_shading_model\n// base color, incident, point of intersection, normal\nvec3 blinnPhong(vec3 color, vec3 p, vec3 n)\n{\n    // Ambient colour based on background gradient\n    vec3 ambColor = clamp(mix(background2Color, background1Color, (sin(n.y * HALFPI) + 1.0) * 0.5), 0.0, 1.0);\n    ambColor = mix(vec3(ambientColor.x), ambColor, ambientColor.y);\n    \n    vec3  halfLV = normalize(light - p);\n    float diffuse = max(dot(n, halfLV), 0.0);\n    float specular = pow(diffuse, specularExponent);\n    \n    return ambColor * color + color * diffuse + specular * specularity;\n}\n\n\n\n// Ambient occlusion approximation.\n// Based upon boxplorer's implementation which is derived from:\n// http://www.iquilezles.org/www/material/nvscene2008/rwwtt.pdf\nfloat ambientOcclusion(vec3 p, vec3 n, float eps)\n{\n    float o = 1.0;                  // Start at full output colour intensity\n    eps *= aoSpread;                // Spread diffuses the effect\n    float k = aoIntensity / eps;    // Set intensity factor\n    float d = 2.0 * eps;            // Start ray a little off the surface\n    \n    for (int i = 0; i < aoIterations; ++i) {\n        o -= (d - dE(p + n * d).x) * k;\n        d += eps;\n        k *= 0.5;                   // AO contribution drops as we move further from the surface \n    }\n    \n    return clamp(o, 0.0, 1.0);\n}\n\n\n// Calculate the output colour for each input pixel\nvec4 render(vec2 pixel)\n{\n    vec3  ray_direction = rayDirection(pixel);\n    float ray_length = minRange;\n    vec3  ray = cameraPosition + ray_length * ray_direction;\n    vec4  bg_color = vec4(clamp(mix(background2Color, background1Color, (sin(ray_direction.y * HALFPI) + 1.0) * 0.5), 0.0, 1.0), 1.0);\n    vec4  color = bg_color;\n    \n    float eps = MIN_EPSILON;\n    vec3  dist;\n    vec3  normal = vec3(0);\n    int   steps = 0;\n    bool  hit = false;\n    float tmin = 0.0;\n    float tmax = 10000.0;\n    \n    if (intersectBoundingSphere(ray, ray_direction, tmin, tmax)) {\n        ray_length = tmin;\n        ray = cameraPosition + ray_length * ray_direction;\n        \n        for (int i = 0; i < stepLimit; i++) {\n            steps = i;\n            dist = dE(ray);\n            dist.x *= surfaceSmoothness;\n            \n            // If we hit the surface on the previous step check again to make sure it wasn't\n            // just a thin filament\n            if (hit && dist.x < eps || ray_length > tmax || ray_length < tmin) {\n                steps--;\n                break;\n            }\n            \n            hit = false;\n            ray_length += dist.x;\n            ray = cameraPosition + ray_length * ray_direction;\n            eps = ray_length * epsfactor;\n\n            if (dist.x < eps || ray_length < tmin) {\n                hit = true;\n            }\n        }\n    }\n    \n    // Found intersection?\n    float glowAmount = float(steps)/float(stepLimit);\n    float glow;\n    \n    if (hit) {\n        float aof = 1.0, shadows = 1.0;\n        glow = clamp(glowAmount * innerGlowIntensity * 3.0, 0.0, 1.0);\n\n        if (steps < 1 || ray_length < tmin) {\n            normal = normalize(ray);\n        } else {\n            normal = generateNormal(ray, eps);\n            aof = ambientOcclusion(ray, normal, eps);\n        }\n        \n        color.rgb = mix(color1, mix(color2, color3, dist.y * color2Intensity), dist.z * color3Intensity);\n        color.rgb = blinnPhong(clamp(color.rgb * color1Intensity, 0.0, 1.0), ray, normal);\n        color.rgb *= aof;\n        color.rgb = mix(color.rgb, innerGlowColor, glow);\n        color.rgb = mix(bg_color.rgb, color.rgb, exp(-pow(ray_length * exp(fogFalloff), 2.0) * fog));\n        color.a = 1.0;\n    } else {\n        // Apply outer glow and fog\n        ray_length = tmax;\n        color.rgb = mix(bg_color.rgb, color.rgb, exp(-pow(ray_length * exp(fogFalloff), 2.0)) * fog);\n        glow = clamp(glowAmount * outerGlowIntensity * 3.0, 0.0, 1.0);\n        color.rgb = mix(color.rgb, outerGlowColor, glow);\n        if (transparent) color = vec4(0.0);\n    }\n    \n    // if (depthMap) {\n    //     color.rgb = vec3(ray_length / 10.0);\n    // }\n    \n    return color;\n}\n\n\n// ============================================================================================ //\n\n\n// The main loop\nvoid main()\n{\n    vec4 color = vec4(0.0);\n    float n = 0.0;\n    \n    cameraRotation = rotationMatrixVector(v, 180.0 - cameraYaw) * rotationMatrixVector(u, -cameraPitch) * rotationMatrixVector(w, cameraRoll);\n    \n    \n#ifdef antialiasing\n    for (float x = 0.0; x < 1.0; x += float(antialiasing)) {\n        for (float y = 0.0; y < 1.0; y += float(antialiasing)) {\n            color += render(gl_FragCoord.xy + vec2(x, y));\n            n += 1.0;\n        }\n    }\n    color /= n;\n#else\n    color = render(gl_FragCoord.xy);\n#endif\n    \n    if (color.a < 0.00392) discard; // Less than 1/255\n    \n    gl_FragColor = vec4(pow(color.rgb, vec3(1.0 / gamma)), color.a);\n}\n","vertex":"attribute vec3 vertexPosition;\n\nvoid main() \n{\n    gl_Position = vec4(vertexPosition, 1.0);\n}"};

var timeline = [
	{
        f: 1,
        t: 'Cubic.EaseInOut',
        o: {"cameraFocalLength":0.9,"cameraPitch":0,"cameraPosition":[-0.064575,0.089261,-1.361713],"cameraRoll":0,"cameraYaw":42}
    },  
    {
        f: 91,
        t:'Cubic.EaseOut',
        o: {"cameraFocalLength":0.9,"cameraPitch":0,"cameraPosition":[-0.119779,0.089261,-1.423023],"cameraRoll":0,"cameraYaw":42}
	},  
	{
		f: 151,
		t:'Cubic.EaseInOut',
		o: {"cameraFocalLength":0.9,"cameraPitch":0,"cameraPosition":[-0.016064,0.089261,-1.307834],"cameraRoll":0,"cameraYaw":42}
	},  
	{
		f: 211,
		o: {"cameraFocalLength":0.9,"cameraPitch":6,"cameraPosition":[-0.016064,0.089261,-1.307834],"cameraRoll":0,"cameraYaw":163.5}
	},  
	{
		f: 241,
		t:'Cubic.EaseInOut',
		o: {"cameraFocalLength":0.9,"cameraPitch":-47,"cameraPosition":[-0.016064,0.089261,-1.307834],"cameraRoll":0,"cameraYaw":-41}
	},
	{
		f: 271,
		t:'Cubic.EaseInOut',
		o: {"cameraFocalLength":0.9,"cameraPitch":6,"cameraPosition":[-0.016064,0.089261,-1.307834],"cameraRoll":0,"cameraYaw":163.5}
	},  
	{
		f: 301,
		t:'Cubic.EaseOut',
		o: {"cameraFocalLength":0.9,"cameraPitch":-31,"cameraPosition":[-0.016064,0.089261,-1.307834],"cameraRoll":0,"cameraYaw":34.5}
	},
	{
		f: 331,
		t:'Linear.EaseNone',
		o: {"cameraFocalLength":0.9,"cameraPitch":-22.5,"cameraPosition":[-0.022127,0.090401,-1.309612],"cameraRoll":0,"cameraYaw":47.5}
	},  
	{
		f: 421,
		t:'Cubic.EaseInOut',
		o: {"cameraFocalLength":0.9,"cameraPitch":-17,"cameraPosition":[0.023913,0.086996,-1.308191],"cameraRoll":0,"cameraYaw":-57.5}
	},
	{
		f: 511,
		t:'',
		o: {"cameraFocalLength":0.9,"cameraPitch":-34,"cameraPosition":[0.004798,0.060993,-1.270303],"cameraRoll":0,"cameraYaw":-26}
	}
];

var project = {
    fps: 30,
    length:511,
    id: 'f1',
    key: 'a4b43',
    settings: {"scale":-2.81, "power":8, "surfaceDetail":0.66, "surfaceSmoothness":0.79, "boundingRadius":114.02, "offset":[0,0,0], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":0, "cameraYaw":42, "cameraFocalLength":0.9, "cameraPosition":[-0.064575,0.089261,-1.361713], "colorIterations":3, "color1":[0.0315625,0.0315625,0.0315625], "color1Intensity":0.96, "color2":[0.9803921568627451,0.7843137254901961,0.0196078431372549], "color2Intensity":1.26, "color3":[1,1,1], "color3Intensity":0.51, "transparent":false, "gamma":0.99, "light":[48,191,-198], "ambientColor":[0.41,0], "background1Color":[0.7450980392156863,0.9450980392156862,0.9372549019607843], "background2Color":[0,0,0], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.24, "outerGlowColor":[1,1,1], "outerGlowIntensity":0, "fog":0.14, "fogFalloff":2.8, "specularity":0.86, "specularExponent":7, "size":[1023,954], "aoIntensity":0.21, "aoSpread":11.79, "objectRotation":[1,0,0,0,1,0,0,0,1], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "phi":1.618, "boxScale":0.5, "boxFold":1, "fudgeFactor":0, "juliaFactor":0, "radiolariaFactor":0, "radiolaria":0, "dE":"Mandelbox", "maxIterations":15, "stepLimit":105, "aoIterations":3, "antialiasing":false, "_objectRotation":[0,0,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5},
	shaders: shaders,
    timeline: timeline,
    height: 720,//480 720 240
    width: 1280 //720 1280  320
};

/*
 * This is the project settings for 2d fractal duck
 */

var shaders2d = {"fragment":"#ifdef GL_ES\nprecision highp float;\n#endif\n\n/**\n * Fractal Lab's 2D fractal shader\n * Last update: 10 March 2011\n *\n * Changelog:\n *      0.1     - Initial release\n *      0.2     - Added orbit trap option\n *      0.3     - Added 'Ducks' formula by Samuel Monnier\n *\n * Copyright 2011, Tom Beddard\n * http://www.subblue.com\n *\n * For more generative graphics experiments see:\n * http://www.subblue.com\n *\n * Licensed under the GPL Version 3 license.\n * http://www.gnu.org/licenses/\n *\n*/\n\n#define dE Mandelbrot             // {\"label\":\"Fractal type\", \"control\":\"select\", \"options\":[\"Mandelbrot\", \"OrbitTrap\", \"Ducks\"]}\n\n#define maxIterations 50            // {\"label\":\"Iterations\", \"min\":1, \"max\":400, \"step\":1, \"group_label\":\"2D parameters\"}\n#define antialiasing 0.5            // {\"label\":\"Anti-aliasing\", \"control\":\"bool\", \"default\":false, \"group_label\":\"Render quality\"}\n\nuniform float scale;                // {\"label\":\"Scale\",        \"min\":-10,  \"max\":10,   \"step\":0.1,     \"default\":2,    \"group\":\"Fractal\", \"group_label\":\"Fractal parameters\"}\nuniform float power;                // {\"label\":\"Power\",        \"min\":-20,  \"max\":20,   \"step\":0.001,     \"default\":2,    \"group\":\"Fractal\"}\nuniform float bailout;              // {\"label\":\"Bailout\", \"min\":0.1, \"max\":50, \"step\":0.01, \"default\":4, \"group\":\"Fractal\"}\nuniform int   minIterations;        // {\"label\":\"Min. iterations\", \"min\":1, \"max\":400, \"step\":1, \"group\":\"Fractal\"}\n\nuniform bool  juliaMode;            // {\"label\":\"Enable\", \"default\":false,    \"group\":\"Fractal\", \"group_label\":\"Julia mode\"}\nuniform vec2  offset;               // {\"label\":[\"Offset x\",\"Offset y\"],  \"min\":-2,   \"max\":2,    \"step\":0.001,    \"default\":[0.36,0.06],  \"group\":\"Fractal\"}\n\nuniform int   colorMode;            // {\"label\":\"Colour mode\",  \"min\":0,  \"max\":6,   \"step\":1,     \"default\":0,    \"group\":\"Colour\"}\nuniform int   bailoutStyle;         // {\"label\":\"Colour style\", \"min\":0,  \"max\":4,   \"step\":1,     \"default\":0,    \"group\":\"Colour\"}\nuniform float colorScale;           // {\"label\":\"Colour scale\",  \"min\":0,  \"max\":10,   \"step\":0.01,     \"default\":1,    \"group\":\"Colour\"}\nuniform float colorCycle;           // {\"label\":\"Colour cycle\", \"min\":0,  \"max\":10,   \"step\":0.01,     \"default\":1,    \"group\":\"Colour\"}\nuniform float colorCycleOffset;     // {\"label\":\"Colour cycle offset\", \"min\":-10,  \"max\":10,   \"step\":0.01,     \"default\":0,    \"group\":\"Colour\"}\nuniform bool  colorCycleMirror;     // {\"label\":\"Colour mirror\", \"default\":true,    \"group\":\"Colour\"}\nuniform bool  hsv;                  // {\"label\":\"Rainbow\", \"default\":false,    \"group\":\"Colour\"}\nuniform float iterationColorBlend;  // {\"label\":\"Iteration blend\", \"min\":0,  \"max\":10,   \"step\":0.01,     \"default\":0,    \"group\":\"Colour\"}\n\nuniform int   colorIterations;      // {\"label\":\"Colour iterations\", \"default\": 4, \"min\":0, \"max\": 30, \"step\":1, \"group\":\"Colour\", \"group_label\":\"Base colour\"}\nuniform vec3  color1;               // {\"label\":\"Colour 1\",  \"default\":[1.0, 1.0, 1.0], \"group\":\"Colour\", \"control\":\"color\"}\nuniform vec3  color2;               // {\"label\":\"Colour 2\",  \"default\":[0, 0.53, 0.8], \"group\":\"Colour\", \"control\":\"color\"}\nuniform vec3  color3;               // {\"label\":\"Inside/background colour\",  \"default\":[0.0, 0.0, 0.0], \"group\":\"Colour\", \"control\":\"color\"}\nuniform bool  transparent;          // {\"label\":\"Transparent background\", \"default\":false, \"group\":\"Colour\"}\nuniform float gamma;                // {\"label\":\"Gamma correction\", \"default\":1, \"min\":0.1, \"max\":2, \"step\":0.01, \"group\":\"Colour\"}\n\nuniform bool  orbitTrap;            // {\"label\":\"Orbit trap\", \"default\":false, \"group\":\"Image\", \"group_label\":\"Map images into fractal space\"}\nuniform vec2  orbitTrapOffset;      // {\"label\":[\"Orbit offset x\", \"Orbit trap y\"], \"min\":-3, \"max\":3, \"default\":[0, 0], \"step\":0.001, \"group\":\"Image\"}\nuniform float orbitTrapScale;       // {\"label\":\"Image scale\", \"min\": 0.1, \"max\": 10, \"step\": 0.001, \"default\":1, \"group\":\"Image\"}\nuniform float orbitTrapEdgeDetail;  // {\"label\":\"Edge detail\", \"min\": 0, \"max\": 1, \"step\": 0.001, \"default\":0.5, \"group\":\"Image\"}\nuniform float orbitTrapRotation;    // {\"label\":\"Rotation\", \"min\": -360, \"max\": 360, \"step\": 0.1, \"default\":0, \"group\":\"Image\"}\nuniform float orbitTrapSpin;        // {\"label\":\"Spin\", \"min\": -360, \"max\": 360, \"step\": 0.1, \"default\":0, \"group\":\"Image\"}\nuniform sampler2D texture;          // {\"label\":\"Mapping image URL\", \"default\":\"/images/flower.png\", \"group\":\"Image\"}\n\n\nuniform float rotation;             // {\"label\":\"Rotation\",         \"min\":-180, \"max\":180,  \"step\":0.5,     \"default\":0,    \"group\":\"Camera\", \"group_label\":\"Camera parameters\"}\nuniform vec3  cameraPosition;       // {\"label\":[\"Camera x\", \"Camera y\", \"Camera z\"],   \"default\":[-0.5, 0, 2.5], \"min\":0, \"max\": 200, \"step\":0.0000001, \"control\":\"camera\", \"group\":\"Camera\"}\nuniform vec2  size;                 // {\"default\":[400, 300]}\nuniform vec2  outputSize;           // {\"default\":[800, 600]}\n\n\nfloat aspectRatio = outputSize.x / outputSize.y;\nmat2  rotationMatrix;\nmat2  orbitRotation;\nmat2  orbitSpin;\n\n\n#define BAILOUT 4.0\n#define LOG2 float(log(2.0))\n\n// Complex math operations\n#define complexMult(a,b) vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x)\n#define complexMag(z) float(pow(length(z), 2.0))\n#define complexReciprocal(z) vec2(z.x / complexMag(z), -z.y / complexMag(z))\n#define complexDivision(a,b) complexMult(a, complexReciprocal(b))\n#define complexArg(z) float(atan(z.y, z.x))\n#define complexLog(z) vec2(log(length(z)), complexArg(z))\n#define complexExp(z) vec2(exp(z.x) * cos(z.y), exp(z.x) * sin(z.y))\n#define sinh(x) float((exp(x) - exp(-x)) / 2.0)\n#define cosh(x) float((exp(x) + exp(-x)) / 2.0)\n#define complexSin(z) vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y))\n#define complexCos(z) vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y))\n#define complexTan(z) vec2(sin(2.0 * z.x)/(cos(2.0 * z.x) + cosh(2.0 * z.y)), sinh(2.0 * z.y)/(cos(2.0 * z.x) + cosh(2.0 * z.y)))\n#define complexSinh(z) vec2(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y))\n#define complexCosh(z) vec2(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y))\n#define complexTanh(z) vec2(sinh(2.0 * z.x)/(cosh(2.0 * z.a) + cos(2.0 * z.y)), sin(2.0 * z.y)/(cosh(2.0 * z.x) + cos(2.0 * z.y)))\n#define polar(r,a) vec2(cos(a) * r, sin(a) * r)\n#define complexPower(z,p) vec2(polar(pow(length(z), float(p)), float(p) * complexArg(z)))\n\n// x^y = exp(y * log(x))\n#define complexPower2(z, p) vec2(complexExp(complexMult(p, complexLog(z))))\n\n\n// RGB to HSV\n// http://www.easyrgb.com/index.php?X=MATH&H=20#text20\nvec3 rgb2hsv(vec3 color)\n{\n    float rgb_min = min(color.r, min(color.g, color.b));\n    float rgb_max = max(color.r, max(color.g, color.b));\n    float rgb_delta = rgb_max - rgb_min;\n    \n    float v = rgb_max;\n    float h, s;\n    \n    if (rgb_delta == 0.0) {\n        // Grey\n        h = 0.0;\n        s = 0.0;\n    } else {\n        // Colour\n        s = rgb_delta / rgb_max;\n        float r_delta = (((rgb_max - color.r) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;\n        float g_delta = (((rgb_max - color.g) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;\n        float b_delta = (((rgb_max - color.b) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;\n        \n        if (color.r == rgb_max) {\n            h = b_delta - g_delta;\n        } else if (color.g == rgb_max) {\n            h = 1.0 / 3.0 + r_delta - b_delta;\n        } else if (color.b == rgb_max) {\n            h = 2.0 / 3.0 + g_delta - r_delta;\n        }\n        \n        if (h < 0.0) h += 1.0;\n        if (h > 1.0) h -= 1.0;\n    }\n    \n    return vec3(h, s, v);\n}\n\n\nvec3 hsv2rgb(vec3 hsv)\n{\n    float h, s, v, r, g, b, j, p, q, t;\n    int i;\n    vec3 color;\n    \n    h = hsv.x;\n    s = hsv.y;\n    v = hsv.z;\n\t\n    if (h == 1.0) {\n\t\th = 0.0;\n\t}\n    \n    if (v == 0.0) {\n        // No brightness so return black\n        color = vec3(0.0);\n        \n    } else if (s == 0.0) {\n        // No saturation so return grey\n        color = vec3(v);\n        \n    } else {\n\t\t// RGB color\n        h *= 6.0;\n\t\ti = int(floor(h));\n\t\tj = h - float(i);\n\t\tp = v * (1.0 - s);\n\t\tq = v * (1.0 - (s * j));\n\t\tt = v * (1.0 - (s * (1.0 - j)));\n\t\t\n\t\tif (i == 0) {\n\t\t\tr = v;\n\t\t\tg = t;\n\t\t\tb = p;\n\t\t} else if (i == 1) {\n\t\t\tr = q;\n\t\t\tg = v;\n\t\t\tb = p;\n\t\t} else if (i == 2) {\n\t\t\tr = p;\n\t\t\tg = v;\n\t\t\tb = t;\n\t\t} else if (i == 3) {\n\t\t\tr = p;\n\t\t\tg = q;\n\t\t\tb = v;\n\t\t} else if (i == 4) {\n\t\t\tr = t;\n\t\t\tg = p;\n\t\t\tb = v;\n\t\t} else if (i == 5) {\n\t\t\tr = v;\n\t\t\tg = p;\n\t\t\tb = q;\n\t\t}\n\t\tcolor = vec3(r, g, b);\n\t}\n    \n    return color;\n}\n\n\n\n\n// ============================================================================================ //\n\n\n#ifdef dEMandelbrot\n\nfloat _bailout = exp(bailout);\nfloat log2Bailout = log(2.0 * log(_bailout));\nfloat logPower = log(abs(power));\n\nbool bailoutLimit(vec2 z) {\n    bool bailing = false;\n    \n    if (bailoutStyle == 3 && (pow(z.x, 2.0) - pow(z.y, 2.0)) >= _bailout) {\n        bailing = true;\n        \n    } else if (bailoutStyle == 4 && (z.y * z.y - z.y * z.x) >= bailout) {\n        bailing = true;\n        \n    } else if (bailoutStyle == 2 && (pow(z.y, 2.0) - pow(z.x, 2.0)) >= _bailout) {\n        bailing = true;\n        \n    } else if (bailoutStyle == 1 && (abs(z.x) > bailout || abs(z.y) > _bailout)) {\n        bailing = true;\n        \n    } else if (dot(z, z) >= _bailout) {\n        bailing = true;\n    }\n    \n    return bailing;\n}\n\n\nvec4 colorMapping(float n, vec2 z) {\n    vec3 color = color3,\n        c1 = color1,\n        c2 = color2;\n    \n    if (hsv) {\n        c1 = rgb2hsv(c1);\n        c2 = rgb2hsv(c2);\n    }\n    \n    if (colorMode == 3) {\n        color = atan(z.y, z.x) > 0.0 ? c1 : c2;\n        \n    } else if (colorMode == 4) {\n        color = mod(n, 2.0) == 0.0 ? c1 : c2;\n        \n    } else if (colorMode == 5) {\n        color = (abs(z.x) < bailout / 2.0 || abs(z.y) < bailout / 2.0) ? c1 : c2;\n        \n    } else if (colorMode == 6) {\n        float v = 0.5 * sin(floor(colorScale) * complexArg(z)) + 0.5;\n        color = mix(c1, c2, v);\n         \n    } else {\n        float v = abs(1.0 - n / float(maxIterations));\n        float v0 = v;\n        float vp, v1;\n        \n        if (colorMode != 2) {\n            // Smooth colouring\n            // From: http://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_.28smooth.29_coloring\n            vp = abs((log2Bailout - log(log(abs(length(z))))) / logPower);\n            v1 = abs(1.0 - (n + 1.0) / float(maxIterations));\n            \n            if (colorMode == 1) {\n                if (n == 0.0) {\n                    v = v - (v - v1) * vp;\n                } else {\n                    v = v1 - (v1 - v) * vp;\n                }\n            } else {\n                v = v + (v1 - v) * vp;\n            }\n        }\n        \n        if (colorMode == 2 && n == 0.0) v = 1.0;\n        \n        v = pow(v, colorScale);\n        v *= colorCycle;\n        v += colorCycleOffset;\n        \n        if (colorCycleMirror) {\n            bool even = mod(v, 2.0) < 1.0 ? true : false;\n            if (even) {\n                v = 1.0 - mod(v, 1.0);\n            } else {\n                v = mod(v, 1.0);\n            }\n        } else {\n            v = 1.0 - mod(v, 1.0);\n        }\n        \n        if (hsv) {\n            color = hsv2rgb(mix(c1, c2, clamp(v, 0.0, 1.0)));\n        } else {\n           color = mix(c1, c2, clamp(v, 0.0, 1.0));\n        }\n    }\n    \n    return vec4(color, 1.0);\n}\n\n\nvec4 Mandelbrot(vec2 z) {\n    vec4  color = vec4(color3, 1.0);\n    float n = 0.0;\n    vec2  c = juliaMode ? offset : z;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        n += 1.0;\n        z = complexPower(z, power) + c;\n        \n        if (n >= float(minIterations) && bailoutLimit(z)) {\n            color = colorMapping(n, z);\n            break;\n        }\n    }\n    \n    if (iterationColorBlend > 0.0) {\n        float blend = clamp(1.0 - (n / float(maxIterations)) * iterationColorBlend, 0.0, 1.0);\n        color.rgb = mix(color3, color.rgb, blend);\n    }\n    \n    return color;\n}\n\n#endif\n\n\n// ============================================================================================ //\n\n\n#ifdef dEOrbitTrap\n\nvec4 orbitMapping(vec4 c, vec2 w)\n{\n    vec4 color = vec4(0);\n    vec2 sp = 0.5 + (w / orbitTrapScale * orbitRotation - orbitTrapOffset) * orbitSpin;\n    \n\tvec4 s = texture2D(texture, sp);\n\tif (s.a > 0.0) c = mix(c, s, s.a);\n    \n    return c;\n}\n\n\nvec4 OrbitTrap(vec2 z) {\n    vec4  color = vec4(color3, 0.0);\n    float n = 0.0;\n    vec2  c = juliaMode ? offset : z;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        n += 1.0;\n        \n        z = complexPower(z, power) + c;\n        \n        if (n >= float(minIterations)) {\n            color = orbitMapping(color, z);\n            if (color.a >= orbitTrapEdgeDetail) break;\n        }\n    }\n    \n    if (iterationColorBlend > 0.0) {\n        float blend = clamp(1.0 - (n / float(maxIterations)) * iterationColorBlend, 0.0, 1.0);\n        color.rgb = mix(color3, color.rgb, blend);\n    }\n    \n    if (!transparent) color.a = 1.0;\n    \n    return color;\n}\n\n#endif\n\n\n// ============================================================================================ //\n\n\n#ifdef dEDucks\n// Ducks and butterflies\n// http://www.algorithmic-worlds.net/blog/blog.php?Post=20110227\n\nvec4 Ducks(vec2 z) {\n    vec4  color = vec4(color3, 1.0);\n    float n = 0.0;\n    vec2  c = juliaMode ? offset : z;\n    float d = 0.0;\n    float v;\n    \n    for (int i = 0; i < int(maxIterations); i++) {\n        n += 1.0;\n        z = complexLog(vec2(z.x, abs(z.y))) + c;\n        \n        if (n >= float(minIterations)) {\n            d += dot(z, z);\n        }\n    }\n    \n    v = sqrt(d / n);\n    v = pow(v, colorScale);\n    v *= colorCycle;\n    v += colorCycleOffset;\n    \n    if (colorCycleMirror) {\n        bool even = mod(v, 2.0) < 1.0 ? true : false;\n        if (even) {\n            v = 1.0 - mod(v, 1.0);\n        } else {\n            v = mod(v, 1.0);\n        }\n    } else {\n        v = 1.0 - mod(v, 1.0);\n    }\n    \n    if (hsv) {\n        color.rgb = hsv2rgb(mix(rgb2hsv(color1.rgb), rgb2hsv(color2.rgb), clamp(v, 0.0, 1.0)));\n    } else {\n       color.rgb = mix(color1.rgb, color2.rgb, clamp(v, 0.0, 1.0));\n    }\n    \n    return color;\n}\n\n#endif\n\n\n// ============================================================================================ //\n\n\nvec4 render(vec2 pixel) {\n    vec2  z = ((pixel - (size * 0.5)) / size) * vec2(aspectRatio, 1.0) * cameraPosition.z + cameraPosition.xy;\n    z *= rotationMatrix;\n    \n    return dE(z);\n}\n\n\n// The main loop\nvoid main()\n{\n    vec4 color = vec4(0.0);\n    float n = 0.0;\n    \n    float rc = cos(radians(rotation));\n    float rs = sin(radians(rotation));\n    rotationMatrix = mat2(rc, rs, -rs, rc);\n    \n#ifdef dEOrbitTrap\n    \n    float otrc = cos(radians(orbitTrapRotation));\n    float otrs = sin(radians(orbitTrapRotation));\n    orbitRotation = mat2(otrc, otrs, -otrs, otrc);\n\n    float otsc = cos(radians(orbitTrapSpin));\n    float otss = sin(radians(orbitTrapSpin));\n    orbitSpin = mat2(otsc, otss, -otss, otsc);\n    \n#endif\n    \n    \n#ifdef antialiasing\n    for (float x = 0.0; x < 1.0; x += float(antialiasing)) {\n        for (float y = 0.0; y < 1.0; y += float(antialiasing)) {\n            color += render(gl_FragCoord.xy + vec2(x, y));\n            n += 1.0;\n        }\n    }\n    color /= n;\n#else\n    color = render(gl_FragCoord.xy);\n#endif\n    \n    if (color.a < 0.00392) discard; // Less than 1/255\n    \n    gl_FragColor = vec4(pow(color.rgb, vec3(1.0 / gamma)), 1.0);\n    \n}\n","vertex":"attribute vec3 vertexPosition;\n\nvoid main() \n{\n    gl_Position = vec4(vertexPosition, 1.0);\n}"};

var timeline01 = [
    {
        f: 1,
        t: 'Exponential.EaseIn',
        o: {"cameraPosition":[-0.494632,-0.190919,0.004133]}
    },  
    {
        f: 125,
        t:'',
        o: {"cameraPosition":[-0.570263,-0.320191,1740554.97023955]} //174055458.97023955
    }
];

var project01 = {
    fps: 25,
    length: 5*25,
    id: 'f1',
    key: 'a4b43',
    settings: {"scale":2, "power":2, "bailout":4, "minIterations":1, "juliaMode":true, "offset":[-0.521,-1.438], "colorMode":0, "bailoutStyle":0, "colorScale":1.79, "colorCycle":1, "colorCycleOffset":0.24, "colorCycleMirror":true, "hsv":false, "iterationColorBlend":0, "colorIterations":4, "color1":[1,1,1], "color2":[0,0.53,0.8], "color3":[0,0,0], "transparent":false, "gamma":1, "orbitTrap":false, "orbitTrapOffset":[0,0], "orbitTrapScale":1, "orbitTrapEdgeDetail":0.5, "orbitTrapRotation":0, "orbitTrapSpin":0, "texture":"/images/flower.png", "rotation":0, "cameraPosition":[-0.570263,-0.320191,10.264668], "size":[873,598], "dE":"Ducks", "maxIterations":50, "antialiasing":false, "stepSpeed":0.5},
    shaders: shaders2d,
    timeline: timeline01,
    height: 480,
    width: 720
};


/********
 * 
 *  Some RenderFlies Settings 
 *  and functios
 * 
 ***************/

// First mark project render frames to unallocated
for (var i=1;i<=project.length;i++) {
    renders[i] = k_UNALLOCATED;
}



// Display stats of rendered frames
function checkRenderStatus() {
    var unalloc = 0,
	alloc = 0,
	rendered = 0,
	c= 0;
    for (var r in renders) {
        c++;
        switch(renders[r]) {
            case k_UNALLOCATED:
                unalloc ++;
                break;
            case k_ALLOCATED:
                alloc ++;
                break;
            case k_RENDERED:
                rendered ++;
                break;
        }
    }
    
    console.log("Unallocated, Allocated, Rendered, Total", unalloc, alloc, rendered, c);
    return {unalloc:unalloc, alloc:alloc, rendered:rendered, c:c};
}

// Return the next unallocated frame to be rendered
function getNextRenderFrame() {
    for (var r in renders) {
        if (renders[r] && renders[r]==k_UNALLOCATED) {
			renders[r] = k_ALLOCATED;
            return r;
        }
    }
    return null;
}

/* Here we spawn a new process, 
 * to encode the image files to a video with ffmpeg 
 * One might want to delete or keep the image files
 */
function encode() {
    console.log("we got an encode request!");
	var timestamp = new Date().getTime();
	var filename = "movie-"+timestamp + ".mp4";
	var args = "-qscale 2 -r "+project.fps+" -b 4Mb -i " + stills_dir+  "finlandia.mp3 -i "+stills_dir+"test%d.png "+renders_dir+filename;
	
	var startTime = new Date();
	var ffmpeg  = spawn('ffmpeg', args.split(' '));
	
	var stdout = "";
	var stderr = "";
	
	ffmpeg.stdout.on('data', function (data) {
		stdout+= data;
		//console.log('stdout: ' + data);
	});
	
	ffmpeg.stderr.on('data', function (data) {
		stderr += data;
		//console.log('stderr: ' + data);
	});
	
	ffmpeg.on('exit', function (code) {
	//console.log('child process exited with code ' + code);
	// Create a return json object
	var ret = {
		status: "ok", 
		filename: filename, 
		code:code, stdout:stdout, 
		stderr:stderr, 
		time: (new Date().getTime()-startTime.getTime())
	};

	console.log("Video Encoding eneded", ret);
	});
}



/********
 * 
 * Express Server Configurations
 * 
 ***************/

app.configure(function(){
	// Sets the root directory
	html_dir =  __dirname + '/public/';
    
    stills_dir = __dirname + "/out/";
    renders_dir = __dirname + "/out/renders/";
    
    console.log(html_dir, stills_dir, renders_dir);
 });

// We send the developer's web application
app.get('/', function(req, res){
	res.sendfile(html_dir + "dev.html");
});


// Send the project configuration when requested 
app.get('/jobs', function(req, res){
	console.log("Job requested");
    res.contentType('application/json');
    res.end(JSON.stringify(project));
});


// We call the on demand encode function when requested
app.get('/encode', function(req, res){
    console.log("Encode request via get request");
	encode();
    res.end();
});


app.get('/ready', function(req, res){
	console.log("Request frame for rendering.");
    var toRender = { id: getNextRenderFrame() };
    if (!toRender.id) {
        console.log("Warning: No rendering to be done!");
    }
    
    res.contentType('application/json');
    res.end(JSON.stringify(toRender));
});

// we send the file, if it match the url wildcard
app.get(/\/(.*)/, function(req, res){
    res.sendfile(html_dir + req.params[0]);
});



var allStartTime, now;

// Parsing image upload
app.post('/upload', function(req, res, next){
    
    var uploadStartTime = new Date().getTime();
	if (!allStartTime) allStartTime = uploadStartTime;
		 
	var form = new formidable.IncomingForm();
		 
    form.parse(req, function(err, fields, files) {
		var fid = fields.id;
		var img = fields.img;
		
		now = new Date().getTime();
        console.log("form parse " + fid, (now - uploadStartTime), (now - allStartTime));
		img = img.replace( /^data:image\/.*;base64/, '' );
		
        
		var buf = new Buffer(img, 'base64');
		var fname = stills_dir+ "test"+fid+".png";
		fs.writeFile(fname, buf, function(err) {
			if(err) {
					console.log(err);
					//res.end("{status:'fail'}");
			} else {
					// console.log("The file "+fname+" was saved!");
                    
                    renders[fid] = k_RENDERED;
                    
					var ret = {
						status: "ok",
						file: fname, 
				    	id: getNextRenderFrame()
					};
                    
					 now = new Date().getTime();
					 console.log("file written " + fid, (now - uploadStartTime), (now - allStartTime));
					 
                    
					res.contentType('application/json');
					res.end(JSON.stringify(ret));
					 
					 now = new Date().getTime();
					 console.log("response end " + fid, (now - uploadStartTime), (now - allStartTime));
                     
                     // If all frames have rendered, start encoding
                     var status = checkRenderStatus();
                     if (status.c == status.rendered) {
                         encode();
                     }
                     
                     
			}
		}); // eo write file
		
			   
    }); // end form parse
}); // end post


// Start the server listening on port
app.listen(port);
