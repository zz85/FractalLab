#ifdef GL_ES
precision highp float;
#endif

/**
 * FractalLab's uber 2D fractal shader
 * Last update: 19 February 2011
 *
 * Changelog:
 *      0.1     - Initial release
 *
 * 
 * Copyright (c) 2011 Hyperlabs - Tom Beddard
 * http://www.hyperlabs.co.uk
 *
 * For more generative graphics experiments see:
 * http://www.subblue.com/blog
 *
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * 
 * Credits and references
 * ======================
 * 
 * THE place to discuss fractals:
 * http://www.fractalforums.com/
 *
 *
*/

#define maxIterations 50           // {"label":"Iterations", "min":1, "max":400, "step":1, "group_label":"2D parameters"}
#define bailout 4.0
#define antialiasing 0.5            // {"label":"Anti-aliasing", "control":"bool", "default":false, "group_label":"Render quality"}


uniform float scale;                // {"label":"Scale",        "min":-10,  "max":10,   "step":0.1,     "default":2,    "group":"Fractal", "group_label":"Fractal parameters"}
uniform float power;                // {"label":"Power",        "min":-20,  "max":20,   "step":0.1,     "default":8,    "group":"Fractal"}
uniform float surfaceSmoothness;    // {"label":"Smoothness",   "min":0.1,  "max":2,    "step":0.01,    "default":0.6,  "group":"Fractal"}
uniform float stepMultiplier;       // {"label":"Step multiplier",   "min":0.01,  "max":2,    "step":0.01,    "default":1,  "group":"Fractal"}
uniform float boundingRadius;       // {"label":"Bounding radius", "min":0.1, "max":50, "step":0.01, "default":5, "group":"Fractal"}
uniform vec3  offset;               // {"label":["Offset x","Offset y","Offset z"],  "min":-3,   "max":3,    "step":0.01,    "default":[0,0,0],  "group":"Fractal", "group_label":"Offsets"}

uniform float cameraRoll;           // {"label":"Roll",         "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera", "group_label":"Camera parameters"}
uniform float cameraPitch;          // {"label":"Pitch",        "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera"}
uniform float cameraYaw;            // {"label":"Yaw",          "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera"}
uniform float cameraFocalLength;    // {"label":"Focal length", "min":0.1,  "max":3,    "step":0.01,    "default":0.9,  "group":"Camera"}
uniform vec3  cameraPosition;       // {"label":["Camera x", "Camera y", "Camera z"],   "default":[0.467, -0.44, -1.5], "control":"camera", "group":"Camera", "group_label":"Position"}

uniform int   colorIterations;      // {"label":"Colour iterations", "default": 4, "min":0, "max": 30, "step":1, "group":"Colour", "group_label":"Base colour"}
uniform vec3  color1;               // {"label":"Colour 1",  "default":[1.0, 1.0, 1.0], "group":"Colour", "control":"color"}
uniform float color1Intensity;      // {"label":"Colour 1 intensity", "default":0.45, "min":0, "max":3, "step":0.01, "group":"Colour"}
uniform vec3  color2;               // {"label":"Colour 2",  "default":[0, 0.53, 0.8], "group":"Colour", "control":"color"}
uniform float color2Intensity;      // {"label":"Colour 2 intensity", "default":0.3, "min":0, "max":3, "step":0.01, "group":"Colour"}
uniform vec3  color3;               // {"label":"Colour 3",  "default":[1.0, 0.53, 0.0], "group":"Colour", "control":"color"}
uniform float color3Intensity;      // {"label":"Colour 3 intensity", "default":0, "min":0, "max":3, "step":0.01, "group":"Colour"}
uniform float gamma;                // {"label":"Gamma correction", "default":1, "min":0.1, "max":2, "step":0.01, "group":"Colour"}

uniform vec2  size;                 // {"default":[400, 300]}

uniform mat3  objectRotation;       // {"label":["Rotate x", "Rotate y", "Rotate z"], "group":"Fractal", "control":"rotation", "default":[0,0,0], "min":-360, "max":360, "step":1, "group_label":"Object rotation"}
uniform mat3  fractalRotation1;     // {"label":["Rotate x", "Rotate y", "Rotate z"], "group":"Fractal", "control":"rotation", "default":[0,0,0], "min":-360, "max":360, "step":1, "group_label":"Fractal rotation 1"}
uniform mat3  fractalRotation2;     // {"label":["Rotate x", "Rotate y", "Rotate z"], "group":"Fractal", "control":"rotation", "default":[0,0,0], "min":-360, "max":360, "step":1, "group_label":"Fractal rotation 2"}

varying float aspectRatio;





// ============================================================================================ //
// 2D rendering

#define BAILOUT 4.0
#define LOG2 float(log(2.0))

// Complex math operations
#define complexMult(a,b) vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x)
#define complexMag(z) float(pow(length(z), 2.0))
#define complexReciprocal(z) vec2(z.x / complexMag(z), -z.y / complexMag(z))
#define complexDivision(a,b) complexMult(a, complexReciprocal(b))
#define complexArg(z) float(atan(z.y, z.x))
#define complexLog(z) vec2(log(length(z)), complexArg(z))
#define complexExp(z) vec2(exp(z.x) * cos(z.y), exp(z.x) * sin(z.y))
#define sinh(x) float((exp(x) - exp(-x)) / 2.0)
#define cosh(x) float((exp(x) + exp(-x)) / 2.0)
#define complexSin(z) vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y))
#define complexCos(z) vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y))
#define complexTan(z) vec2(sin(2.0 * z.x)/(cos(2.0 * z.x) + cosh(2.0 * z.y)), sinh(2.0 * z.y)/(cos(2.0 * z.x) + cosh(2.0 * z.y)))
#define complexSinh(z) vec2(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y))
#define complexCosh(z) vec2(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y))
#define complexTanh(z) vec2(sinh(2.0 * z.x)/(cosh(2.0 * z.a) + cos(2.0 * z.y)), sin(2.0 * z.y)/(cosh(2.0 * z.x) + cos(2.0 * z.y)))
#define polar(r,a) vec2(cos(a) * r, sin(a) * r)
#define complexPower(z,p) vec2(polar(pow(length(z), float(p)), float(p) * complexArg(z)))

// x^y = exp(y * log(x))
#define complexPower2(z, p) vec2(complexExp(complexMult(p, complexLog(z))))


uniform float colorMode;            // {"label":"Colour mode",  "min":0,  "max":6,   "step":1,     "default":0,    "group":"Colour"}
uniform float bailoutStyle;         // {"label":"Colour style", "min":0,  "max":4,   "step":1,     "default":0,    "group":"Colour"}
uniform float colorScale;           // {"label":"Colour scale",  "min":0,  "max":10,   "step":0.01,     "default":1,    "group":"Colour"}
uniform float colorCycle;           // {"label":"Colour cycle", "min":0,  "max":10,   "step":0.01,     "default":1,    "group":"Colour"}
uniform float iterationColorBlend;  // {"label":"Iteration blend", "min":1,  "max":50,   "step":0.01,     "default":1,    "group":"Colour"}




float _bailout = exp(bailout);
float log2Bailout = log(2.0 * log(_bailout));
float logPower = log(abs(power));


bool bailoutLimit(vec2 z) {
    bool bailing = false;
    
    if (int(bailoutStyle) == 3) {
        if ((pow(z.x, 2.0) - pow(z.y, 2.0)) >= _bailout) bailing = true;
    } else if (int(bailoutStyle) == 4) {
        if ((z.y * z.y - z.y * z.x) >= bailout) bailing = true;
    } else if (int(bailoutStyle) == 2) {
        if ((pow(z.y, 2.0) - pow(z.x, 2.0)) >= _bailout) bailing = true;
    } else if (int(bailoutStyle) == 1) {
        if (abs(z.x) > bailout || abs(z.y) > _bailout) bailing = true;
    } else {
        if ((pow(z.x, 2.0) + pow(z.y, 2.0)) >= _bailout) bailing = true;
    }
    
    return bailing;
}


vec3 colorMapping(float n, vec2 z) {
    vec3 color = color3;
    
    if (int(colorMode) == 3) {
        color = atan(z.y, z.x) > 0.0 ? color1 : color2;
    } else if (int(colorMode) == 4) {
        color = mod(n, 2.0) == 0.0 ? color1 : color2;
    } else if (int(colorMode) == 5) {
        color = (abs(z.x) < bailout / 2.0 || abs(z.y) < bailout / 2.0) ? color1 : color2;
    } else if (int(colorMode) == 6) {
        float v = 0.5 * sin(floor(colorScale) * complexArg(z)) + 0.5;
         color = mix(color1, color2, v);
    } else {
        float v = abs(1.0 - n / float(maxIterations));
        float v0 = v;
        float vp, v1;
        
        if (int(colorMode) != 2) {
            // Smooth colouring
            // From: http://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_.28smooth.29_coloring
            vp = abs((log2Bailout - log(log(abs(length(z))))) / logPower);
            v1 = abs(1.0 - (n + 1.0) / float(maxIterations));
            
            if (int(colorMode) == 1) {
                if (n == 0.0) {
                    v = v - (v - v1) * vp;
                } else {
                    v = v1 - (v1 - v) * vp;
                }
            } else {
                v = v + (v1 - v) * vp;
            }
        }
        
        if (int(colorMode) == 2 && n == 0.0) v = 1.0;
        if (colorScale > 1.0) v = pow(v, colorScale);
        if (colorCycle > 1.0) v *= colorCycle;
        // v += colorCycleOffset;
        
        // if (colorCycleMirror) {
        //  bool even = mod(v, 2.0) < 1.0 ? true : false;
        //  if (even) {
        //      v = 1.0 - mod(v, 1.0);
        //  } else {
        //      v = mod(v, 1.0);
        //  }
        // } else {
            v = 1.0 - mod(v, 1.0);
        // }
        
        color = mix(color1, color2, clamp(v, 0.0, 1.0));
    }
    
    return color;
}


vec4 render(vec2 pixel) {
    vec3 color;
    float blend = 1.0;
    float n = 0.0;
    vec2 z = (pixel / size) * vec2(aspectRatio, 1.0) + cameraPosition.xy;
    vec2 c = z;
    float mag = 0.0;
    bool bailing = false;
    
    for (int i = 0; i < maxIterations; i++) {
        n += 1.0;
        z = complexPower(z, power) + c;
        
        if (bailoutLimit(z)) {
            color = colorMapping(n, z);
            break;
        }
    }
    
    if (iterationColorBlend > 0.0) {
        blend = clamp(1.0 - (n / float(maxIterations)) * iterationColorBlend, 0.0, 1.0);
        color = mix(color3, color, blend);
    }
     
    return vec4(color.rgb, 1.0);
}





// The main loop
void main()
{
    vec4 color = vec4(0.0);
    
#ifdef antialiasing
    for (float x = 0.0; x < 1.0; x += float(antialiasing)) {
        for (float y = 0.0; y < 1.0; y += float(antialiasing)) {
            color += render(gl_FragCoord.xy + vec2(x, y));
        }
    }
    color /= 1.0 / float(antialiasing * antialiasing);
#else
    color = render(gl_FragCoord.xy);
#endif

    gl_FragColor = vec4(pow(color.rgb, vec3(1.0 / gamma)), 1.0);
}
