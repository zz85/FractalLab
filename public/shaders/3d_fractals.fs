#ifdef GL_ES
precision highp float;
#endif

/**
 * Fractal Lab's uber 3D fractal shader
 * Last update: 26 February 2011
 *
 * Changelog:
 *      0.1     - Initial release
 *      0.2     - Refactor for Fractal Lab
 *
 * 
 * Copyright 2011, Tom Beddard
 * http://www.subblue.com
 *
 * For more generative graphics experiments see:
 * http://www.subblue.com
 *
 * Licensed under the GPL Version 3 license.
 * http://www.gnu.org/licenses/
 *
 * 
 * Credits and references
 * ======================
 * 
 * http://www.fractalforums.com/3d-fractal-generation/a-mandelbox-distance-estimate-formula/
 * http://www.fractalforums.com/3d-fractal-generation/revenge-of-the-half-eaten-menger-sponge/msg21700/
 * http://www.fractalforums.com/index.php?topic=3158.msg16982#msg16982
 * 
 * Various other discussions on the fractal can be found here:
 * http://www.fractalforums.com/3d-fractal-generation/
 *
 *
*/

#define HALFPI 1.570796
#define MIN_EPSILON 6e-7
#define MIN_NORM 1.5e-7
#define dE MengerSponge             // {"label":"Fractal type", "control":"select", "options":["MengerSponge", "SphereSponge", "Mandelbulb", "Mandelbox", "MandelboxAlt", "OctahedralIFS", "DodecahedronIFS"]}

#define maxIterations 8             // {"label":"Iterations", "min":1, "max":30, "step":1, "group_label":"Fractal parameters"}
#define stepLimit 60                // {"label":"Max steps", "min":10, "max":300, "step":1}

#define aoIterations 4              // {"label":"AO iterations", "min":0, "max":10, "step":1}

#define minRange 6e-5
#define bailout 4.0
#define antialiasing 0.5            // {"label":"Anti-aliasing", "control":"bool", "default":false, "group_label":"Render quality"}


uniform float scale;                // {"label":"Scale",        "min":-10,  "max":10,   "step":0.01,     "default":2,    "group":"Fractal", "group_label":"Fractal parameters"}
uniform float power;                // {"label":"Power",        "min":-20,  "max":20,   "step":0.1,     "default":8,    "group":"Fractal"}
uniform float surfaceDetail;        // {"label":"Detail",   "min":0.1,  "max":2,    "step":0.01,    "default":0.6,  "group":"Fractal"}
uniform float surfaceSmoothness;    // {"label":"Smoothness",   "min":0.01,  "max":1,    "step":0.01,    "default":0.8,  "group":"Fractal"}
uniform float boundingRadius;       // {"label":"Bounding radius", "min":0.1, "max":150, "step":0.01, "default":5, "group":"Fractal"}
uniform vec3  offset;               // {"label":["Offset x","Offset y","Offset z"],  "min":-3,   "max":3,    "step":0.01,    "default":[0,0,0],  "group":"Fractal", "group_label":"Offsets"}
uniform vec3  shift;                // {"label":["Shift x","Shift y","Shift z"],  "min":-3,   "max":3,    "step":0.01,    "default":[0,0,0],  "group":"Fractal"}

uniform float cameraRoll;           // {"label":"Roll",         "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera", "group_label":"Camera parameters"}
uniform float cameraPitch;          // {"label":"Pitch",        "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera"}
uniform float cameraYaw;            // {"label":"Yaw",          "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera"}
uniform float cameraFocalLength;    // {"label":"Focal length", "min":0.1,  "max":3,    "step":0.01,    "default":0.9,  "group":"Camera"}
uniform vec3  cameraPosition;       // {"label":["Camera x", "Camera y", "Camera z"],   "default":[0.0, 0.0, -2.5], "control":"camera", "group":"Camera", "group_label":"Position"}

uniform int   colorIterations;      // {"label":"Colour iterations", "default": 4, "min":0, "max": 30, "step":1, "group":"Colour", "group_label":"Base colour"}
uniform vec3  color1;               // {"label":"Colour 1",  "default":[1.0, 1.0, 1.0], "group":"Colour", "control":"color"}
uniform float color1Intensity;      // {"label":"Colour 1 intensity", "default":0.45, "min":0, "max":3, "step":0.01, "group":"Colour"}
uniform vec3  color2;               // {"label":"Colour 2",  "default":[0, 0.53, 0.8], "group":"Colour", "control":"color"}
uniform float color2Intensity;      // {"label":"Colour 2 intensity", "default":0.3, "min":0, "max":3, "step":0.01, "group":"Colour"}
uniform vec3  color3;               // {"label":"Colour 3",  "default":[1.0, 0.53, 0.0], "group":"Colour", "control":"color"}
uniform float color3Intensity;      // {"label":"Colour 3 intensity", "default":0, "min":0, "max":3, "step":0.01, "group":"Colour"}
uniform bool  transparent;          // {"label":"Transparent background", "default":false, "group":"Colour"}
uniform float gamma;                // {"label":"Gamma correction", "default":1, "min":0.1, "max":2, "step":0.01, "group":"Colour"}

uniform vec3  light;                // {"label":["Light x", "Light y", "Light z"], "default":[-16.0, 100.0, -60.0], "min":-300, "max":300,  "step":1,   "group":"Shading", "group_label":"Light position"}
uniform vec2  ambientColor;         // {"label":["Ambient intensity", "Ambient colour"],  "default":[0.5, 0.3], "group":"Colour", "group_label":"Ambient light & background"}
uniform vec3  background1Color;     // {"label":"Background top",   "default":[0.0, 0.46, 0.8], "group":"Colour", "control":"color"}
uniform vec3  background2Color;     // {"label":"Background bottom", "default":[0, 0, 0], "group":"Colour", "control":"color"}
uniform vec3  innerGlowColor;       // {"label":"Inner glow", "default":[0.0, 0.6, 0.8], "group":"Shading", "control":"color", "group_label":"Glows"}
uniform float innerGlowIntensity;   // {"label":"Inner glow intensity", "default":0.1, "min":0, "max":1, "step":0.01, "group":"Shading"}
uniform vec3  outerGlowColor;       // {"label":"Outer glow", "default":[1.0, 1.0, 1.0], "group":"Shading", "control":"color"}
uniform float outerGlowIntensity;   // {"label":"Outer glow intensity", "default":0.0, "min":0, "max":1, "step":0.01, "group":"Shading"}
uniform float fog;                  // {"label":"Fog intensity",          "min":0,    "max":1,    "step":0.01,    "default":0,    "group":"Shading", "group_label":"Fog"}
uniform float fogFalloff;           // {"label":"Fog falloff",  "min":0,    "max":10,   "step":0.01,    "default":0,    "group":"Shading"}
uniform float specularity;          // {"label":"Specularity",  "min":0,    "max":3,    "step":0.01,    "default":0.8,  "group":"Shading", "group_label":"Shininess"}
uniform float specularExponent;     // {"label":"Specular exponent", "min":0, "max":50, "step":0.1,     "default":4,    "group":"Shading"}

uniform vec2  size;                 // {"default":[400, 300]}
uniform float aoIntensity;          // {"label":"AO intensity",     "min":0, "max":1, "step":0.01, "default":0.15,  "group":"Shading", "group_label":"Ambient occlusion"}
uniform float aoSpread;             // {"label":"AO spread",    "min":0, "max":20, "step":0.01, "default":9,  "group":"Shading"}

uniform mat3  objectRotation;       // {"label":["Rotate x", "Rotate y", "Rotate z"], "group":"Fractal", "control":"rotation", "default":[0,0,0], "min":-360, "max":360, "step":1, "group_label":"Object rotation"}
uniform mat3  fractalRotation1;     // {"label":["Rotate x", "Rotate y", "Rotate z"], "group":"Fractal", "control":"rotation", "default":[0,0,0], "min":-360, "max":360, "step":1, "group_label":"Fractal rotation 1"}
uniform mat3  fractalRotation2;     // {"label":["Rotate x", "Rotate y", "Rotate z"], "group":"Fractal", "control":"rotation", "default":[0,0,0], "min":-360, "max":360, "step":1, "group_label":"Fractal rotation 2"}
uniform bool  depthMap;             // {"label":"Depth map", "default": false, "value":1, "group":"Shading"}


float aspectRatio = size.x / size.y;
float fovfactor = 1.0 / sqrt(1.0 + cameraFocalLength * cameraFocalLength);
float pixelScale = 1.0 / min(size.x, size.y);
float epsfactor = 2.0 * fovfactor * pixelScale * surfaceDetail;
vec3  w = vec3(0, 0, 1);
vec3  v = vec3(0, 1, 0);
vec3  u = vec3(1, 0, 0);
mat3  cameraRotation;


// Return rotation matrix for rotating around vector v by angle
mat3 rotationMatrixVector(vec3 v, float angle)
{
    float c = cos(radians(angle));
    float s = sin(radians(angle));
    
    return mat3(c + (1.0 - c) * v.x * v.x, (1.0 - c) * v.x * v.y - s * v.z, (1.0 - c) * v.x * v.z + s * v.y,
              (1.0 - c) * v.x * v.y + s * v.z, c + (1.0 - c) * v.y * v.y, (1.0 - c) * v.y * v.z - s * v.x,
              (1.0 - c) * v.x * v.z - s * v.y, (1.0 - c) * v.y * v.z + s * v.x, c + (1.0 - c) * v.z * v.z);
}




// ============================================================================================ //


#ifdef dESphereSponge
uniform float sphereHoles;          // {"label":"Holes",        "min":3,    "max":6,    "step":0.01,    "default":4,    "group":"Fractal", "group_label":"Additional parameters"}
uniform float sphereScale;          // {"label":"Sphere scale", "min":0.01, "max":3,    "step":0.01,    "default":2.05,    "group":"Fractal"}

// Adapted from Buddhis algorithm
// http://www.fractalforums.com/3d-fractal-generation/revenge-of-the-half-eaten-menger-sponge/msg21700/
vec3 SphereSponge(vec3 w)
{
    w *= objectRotation;
    float k = scale;
    float d = -10000.0;
    float d1, r, md = 100000.0, cd = 0.0;
    
    for (int i = 0; i < maxIterations; i++) {
        vec3 zz = mod(w * k, sphereHoles) - vec3(0.5 * sphereHoles) + offset;
        r = length(zz);
        
        // distance to the edge of the sphere (positive inside)
        d1 = (sphereScale - r) / k;
        k *= scale;
        
        // intersection
        d = max(d, d1);
        
        if (i < colorIterations) {
            md = min(md, d);
            cd = r;
        }
    }
    
    return vec3(d, cd, md);
}
#endif


// ============================================================================================ //


#ifdef dEMengerSponge
// Pre-calculations
vec3 halfSpongeScale = vec3(0.5) * scale;

// Adapted from Buddhis algorithm
// http://www.fractalforums.com/3d-fractal-generation/revenge-of-the-half-eaten-menger-sponge/msg21700/
vec3 MengerSponge(vec3 w)
{
    w *= objectRotation;
    w = (w * 0.5 + vec3(0.5)) * scale;  // scale [-1, 1] range to [0, 1]

    vec3 v = abs(w - halfSpongeScale) - halfSpongeScale;
    float d1 = max(v.x, max(v.y, v.z));     // distance to the box
    float d = d1;
    float p = 1.0;
    float md = 10000.0;
    vec3 cd = v;
    
    for (int i = 0; i < maxIterations; i++) {
        vec3 a = mod(3.0 * w * p, 3.0);
        p *= 3.0;
        
        v = vec3(0.5) - abs(a - vec3(1.5)) + offset;
        v *= fractalRotation1;

        // distance inside the 3 axis aligned square tubes
        d1 = min(max(v.x, v.z), min(max(v.x, v.y), max(v.y, v.z))) / p;
        
        // intersection
        d = max(d, d1);
        
        if (i < colorIterations) {
            md = min(md, d);
            cd = v;
        }
    }
    
    // The distance estimate, min distance, and fractional iteration count
    return vec3(d * 2.0 / scale, md, dot(cd, cd));
}
#endif


// ============================================================================================ //


#ifdef dEOctahedralIFS
// Pre-calculations
vec3 scale_offset = offset * (scale - 1.0);

vec3 OctahedralIFS(vec3 w)
{
    w *= objectRotation;
    float d, t;
    float md = 1000.0, cd = 0.0;
    
    for (int i = 0; i < maxIterations; i++) {
        w *= fractalRotation1;
        w = abs(w + shift) - shift;
        
        // Octahedral
        if (w.x < w.y) w.xy = w.yx;
        if (w.x < w.z) w.xz = w.zx;
        if (w.y < w.z) w.yz = w.zy;
        
        w *= fractalRotation2;
        w *= scale;
        w -= scale_offset;

        // Record minimum orbit for colouring
        d = dot(w, w);
        
        if (i < colorIterations) {
            md = min(md, d);
            cd = d;
        }
    }
        
    return vec3((length(w) - 2.0) * pow(scale, -float(maxIterations)), md, cd);
}
#endif


// ============================================================================================ //



#ifdef dEDodecahedronIFS

// phi = 1.61803399
uniform float phi;  // {"label":"Phi", "min":0.1, "max":3, "step":0.01, "default":1.618, "group":"Fractal"}

// Dodecahedron serpinski
// Thanks to Knighty:
// http://www.fractalforums.com/index.php?topic=3158.msg16982#msg16982
// The normal vectors for the dodecahedra-siepinski folding planes are:
// (phi^2, 1, -phi), (-phi, phi^2, 1), (1, -phi, phi^2), (-phi*(1+phi), phi^2-1, 1+phi), (1+phi, -phi*(1+phi), phi^2-1) and x=0, y=0, z=0 planes.

// Pre-calculations
vec3 scale_offset = offset * (scale - 1.0);

float _IKVNORM_ = 1.0 / sqrt(pow(phi * (1.0 + phi), 2.0) + pow(phi * phi - 1.0, 2.0) + pow(1.0 + phi, 2.0));
float _C1_ = phi * (1.0 + phi) * _IKVNORM_;
float _C2_ = (phi * phi - 1.0) * _IKVNORM_;
float _1C_ = (1.0 + phi) * _IKVNORM_;

vec3 phi3 = vec3(0.5, 0.5 / phi, 0.5 * phi);
vec3 c3   = vec3(_C1_, _C2_, _1C_);


vec3 DodecahedronIFS(vec3 w)
{
    w *= objectRotation;
    float d, t;
    float md = 1000.0, cd = 0.0;

    for (int i = 0; i < maxIterations; i++) {
        w *= fractalRotation1;
        w = abs(w + shift) - shift;
        
        t = w.x * phi3.z + w.y * phi3.y - w.z * phi3.x;
        if (t < 0.0) w += vec3(-2.0, -2.0, 2.0) * t * phi3.zyx;
        
        t = -w.x * phi3.x + w.y * phi3.z + w.z * phi3.y;
        if (t < 0.0) w += vec3(2.0, -2.0, -2.0) * t * phi3.xzy;
        
        t = w.x * phi3.y - w.y * phi3.x + w.z * phi3.z;
        if (t < 0.0) w += vec3(-2.0, 2.0, -2.0) * t * phi3.yxz;
        
        t = -w.x * c3.x + w.y * c3.y + w.z * c3.z;
        if (t < 0.0) w += vec3(2.0, -2.0, -2.0) * t * c3.xyz;
        
        t = w.x * c3.z - w.y * c3.x + w.z * c3.y;
        if (t < 0.0) w += vec3(-2.0, 2.0, -2.0) * t * c3.zxy;
        
        w *= fractalRotation2;
        w *= scale;
        w -= scale_offset;

        // Record minimum orbit for colouring
        d = dot(w, w);
        
        if (i < colorIterations) {
            md = min(md, d);
            cd = d;
        }
    }
        
    return vec3((length(w) - 2.0) * pow(scale, -float(maxIterations)), md, cd);
}
#endif


// ============================================================================================ //



#ifdef dEMandelbox
uniform float sphereScale;          // {"label":"Sphere scale", "min":0.01, "max":3,    "step":0.01,    "default":1,    "group":"Fractal", "group_label":"Additional parameters"}
uniform float boxScale;             // {"label":"Box scale",    "min":0.01, "max":3,    "step":0.001,   "default":0.5,  "group":"Fractal"}
uniform float boxFold;              // {"label":"Box fold",     "min":0.01, "max":3,    "step":0.001,   "default":1,    "group":"Fractal"}
uniform float fudgeFactor;          // {"label":"Box size fudge factor",     "min":0, "max":100,    "step":0.001,   "default":0,    "group":"Fractal"}

// Pre-calculations
float mR2 = boxScale * boxScale;    // Min radius
float fR2 = sphereScale * mR2;      // Fixed radius
vec2  scaleFactor = vec2(scale, abs(scale)) / mR2;

// Details about the Mandelbox DE algorithm:
// http://www.fractalforums.com/3d-fractal-generation/a-mandelbox-distance-estimate-formula/
vec3 Mandelbox(vec3 w)
{
    w *= objectRotation;
    float md = 1000.0;
    vec3 c = w;
    
    // distance estimate
    vec4 p = vec4(w.xyz, 1.0),
        p0 = vec4(w.xyz, 1.0);  // p.w is knighty's DEfactor
    
    for (int i = 0; i < maxIterations; i++) {
        // box fold:
        // if (p > 1.0) {
        //   p = 2.0 - p;
        // } else if (p < -1.0) {
        //   p = -2.0 - p;
        // }
        p.xyz = clamp(p.xyz, -boxFold, boxFold) * 2.0 * boxFold - p.xyz;  // box fold
        p.xyz *= fractalRotation1;
        
        // sphere fold:
        // if (d < minRad2) {
        //   p /= minRad2;
        // } else if (d < 1.0) {
        //   p /= d;
        // }
        float d = dot(p.xyz, p.xyz);
        p.xyzw *= clamp(max(fR2 / d, mR2), 0.0, 1.0);  // sphere fold
        
        p.xyzw = p * scaleFactor.xxxy + p0 + vec4(offset, 0.0);
        p.xyz *= fractalRotation2;

        if (i < colorIterations) {
            md = min(md, d);
            c = p.xyz;
        }
    }
    
    // Return distance estimate, min distance, fractional iteration count
    return vec3((length(p.xyz) - fudgeFactor) / p.w, md, 0.33 * log(dot(c, c)) + 1.0);
}
#endif



// ============================================================================================ //



#ifdef dEMandelbulb
uniform float juliaFactor; // {"label":"Juliabulb factor", "min":0, "max":1, "step":0.01, "default":0, "group":"Fractal", "group_label":"Additional parameters"}
uniform float radiolariaFactor; // {"label":"Radiolaria factor", "min":-2, "max":2, "step":0.1, "default":0, "group":"Fractal"}
uniform float radiolaria;       // {"label":"Radiolaria", "min":0, "max":1, "step":0.01, "default": 0, "group":"Fractal"}


// Scalar derivative approach by Enforcer:
// http://www.fractalforums.com/mandelbulb-implementation/realtime-renderingoptimisations/
void powN(float p, inout vec3 z, float zr0, inout float dr)
{
    float zo0 = asin(z.z / zr0);
    float zi0 = atan(z.y, z.x);
    float zr = pow(zr0, p - 1.0);
    float zo = zo0 * p;
    float zi = zi0 * p;
    float czo = cos(zo);

    dr = zr * dr * p + 1.0;
    zr *= zr0;

    z = zr * vec3(czo * cos(zi), czo * sin(zi), sin(zo));
}



// The fractal calculation
//
// Calculate the closest distance to the fractal boundary and use this
// distance as the size of the step to take in the ray marching.
//
// Fractal formula:
//    z' = z^p + c
//
// For each iteration we also calculate the derivative so we can estimate
// the distance to the nearest point in the fractal set, which then sets the
// maxiumum step we can move the ray forward before having to repeat the calculation.
//
//   dz' = p * z^(p-1)
//
// The distance estimation is then calculated with:
//
//   0.5 * |z| * log(|z|) / |dz|
//
vec3 Mandelbulb(vec3 w)
{
    w *= objectRotation;
    
    vec3 z = w;
    vec3 c = mix(w, offset, juliaFactor);
    vec3 d = w;
    float dr = 1.0;
    float r  = length(z);
    float md = 10000.0;
    
    for (int i = 0; i < maxIterations; i++) {
        powN(power, z, r, dr);
        
        z += c;
            
        if (z.y > radiolariaFactor) {
            z.y = mix(z.y, radiolariaFactor, radiolaria);
        }
        
        r = length(z);
        
        if (i < colorIterations) {
            md = min(md, r);
            d = z;
        }
        
        if (r > bailout) break;
    }

    return vec3(0.5 * log(r) * r / dr, md, 0.33 * log(dot(d, d)) + 1.0);
}
#endif



// ============================================================================================ //



// Define the ray direction from the pixel coordinates
vec3 rayDirection(vec2 pixel)
{
    vec2 p = (0.5 * size - pixel) / vec2(size.x, -size.y);
    p.x *= aspectRatio;
    vec3 d = (p.x * u + p.y * v - cameraFocalLength * w);
    
    return normalize(cameraRotation * d);
}



// Intersect bounding sphere
//
// If we intersect then set the tmin and tmax values to set the start and
// end distances the ray should traverse.
bool intersectBoundingSphere(vec3 origin,
                             vec3 direction,
                             out float tmin,
                             out float tmax)
{
    bool hit = false;
    float b = dot(origin, direction);
    float c = dot(origin, origin) - boundingRadius;
    float disc = b*b - c;           // discriminant
    tmin = tmax = 0.0;

    if (disc > 0.0) {
        // Real root of disc, so intersection
        float sdisc = sqrt(disc);
        float t0 = -b - sdisc;          // closest intersection distance
        float t1 = -b + sdisc;          // furthest intersection distance

        if (t0 >= 0.0) {
            // Ray intersects front of sphere
            tmin = t0;
            tmax = t0 + t1;
        } else if (t0 < 0.0) {
            // Ray starts inside sphere
            tmax = t1;
        }
        hit = true;
    }

    return hit;
}




// Calculate the gradient in each dimension from the intersection point
vec3 generateNormal(vec3 z, float e)
{
    vec2 eps = vec2(0, max(e * 0.5, MIN_NORM));
        
    return normalize(vec3(
            dE(z + eps.yxx).x - dE(z - eps.yxx).x, 
            dE(z + eps.xyx).x - dE(z - eps.xyx).x, 
            dE(z + eps.xxy).x - dE(z - eps.xxy).x));
}


// Blinn phong shading model
// http://en.wikipedia.org/wiki/BlinnPhong_shading_model
// base color, incident, point of intersection, normal
vec3 blinnPhong(vec3 color, vec3 p, vec3 n)
{
    // Ambient colour based on background gradient
    vec3 ambColor = clamp(mix(background2Color, background1Color, (sin(n.y * HALFPI) + 1.0) * 0.5), 0.0, 1.0);
    ambColor = mix(vec3(ambientColor.x), ambColor, ambientColor.y);
    
    vec3  halfLV = normalize(light - p);
    float diffuse = max(dot(n, halfLV), 0.0);
    float specular = pow(diffuse, specularExponent);
    
    return ambColor * color + color * diffuse + specular * specularity;
}



// Ambient occlusion approximation.
// Based upon boxplorer's implementation which is derived from:
// http://www.iquilezles.org/www/material/nvscene2008/rwwtt.pdf
float ambientOcclusion(vec3 p, vec3 n, float eps)
{
    float o = 1.0;                  // Start at full output colour intensity
    eps *= aoSpread;                // Spread diffuses the effect
    float k = aoIntensity / eps;    // Set intensity factor
    float d = 2.0 * eps;            // Start ray a little off the surface
    
    for (int i = 0; i < aoIterations; ++i) {
        o -= (d - dE(p + n * d).x) * k;
        d += eps;
        k *= 0.5;                   // AO contribution drops as we move further from the surface 
    }
    
    return clamp(o, 0.0, 1.0);
}


// Calculate the output colour for each input pixel
vec4 render(vec2 pixel)
{
    vec3  ray_direction = rayDirection(pixel);
    float ray_length = minRange;
    vec3  ray = cameraPosition + ray_length * ray_direction;
    vec4  bg_color = vec4(clamp(mix(background2Color, background1Color, (sin(ray_direction.y * HALFPI) + 1.0) * 0.5), 0.0, 1.0), 1.0);
    vec4  color = bg_color;
    
    float eps = MIN_EPSILON;
    vec3  dist;
    vec3  normal = vec3(0);
    int   steps = 0;
    bool  hit = false;
    float tmin = 0.0;
    float tmax = 10000.0;
    
    if (intersectBoundingSphere(ray, ray_direction, tmin, tmax)) {
        ray_length = tmin;
        ray = cameraPosition + ray_length * ray_direction;
        
        for (int i = 0; i < stepLimit; i++) {
            steps = i;
            dist = dE(ray);
            dist.x *= surfaceSmoothness;
            
            // If we hit the surface on the previous step check again to make sure it wasn't
            // just a thin filament
            if (hit && dist.x < eps || ray_length > tmax || ray_length < tmin) {
                steps--;
                break;
            }
            
            hit = false;
            ray_length += dist.x;
            ray = cameraPosition + ray_length * ray_direction;
            eps = ray_length * epsfactor;

            if (dist.x < eps || ray_length < tmin) {
                hit = true;
            }
        }
    }
    
    // Found intersection?
    float glowAmount = float(steps)/float(stepLimit);
    float glow;
    
    if (hit) {
        float aof = 1.0, shadows = 1.0;
        glow = clamp(glowAmount * innerGlowIntensity * 3.0, 0.0, 1.0);

        if (steps < 1 || ray_length < tmin) {
            normal = normalize(ray);
        } else {
            normal = generateNormal(ray, eps);
            aof = ambientOcclusion(ray, normal, eps);
        }
        
        color.rgb = mix(color1, mix(color2, color3, dist.y * color2Intensity), dist.z * color3Intensity);
        color.rgb = blinnPhong(clamp(color.rgb * color1Intensity, 0.0, 1.0), ray, normal);
        color.rgb *= aof;
        color.rgb = mix(color.rgb, innerGlowColor, glow);
        color.rgb = mix(bg_color.rgb, color.rgb, exp(-pow(ray_length * exp(fogFalloff), 2.0) * fog));
        color.a = 1.0;
    } else {
        // Apply outer glow and fog
        ray_length = tmax;
        color.rgb = mix(bg_color.rgb, color.rgb, exp(-pow(ray_length * exp(fogFalloff), 2.0)) * fog);
        glow = clamp(glowAmount * outerGlowIntensity * 3.0, 0.0, 1.0);
        color.rgb = mix(color.rgb, outerGlowColor, glow);
        if (transparent) color.a = 0.0;
    }
    
    // if (depthMap) {
    //     color.rgb = vec3(ray_length / 10.0);
    // }
    
    return color;
}


// ============================================================================================ //


// The main loop
void main()
{
    vec4 color = vec4(1.0);
    float n = 0.0;
    
    cameraRotation = rotationMatrixVector(v, 180.0 - cameraYaw) * rotationMatrixVector(u, -cameraPitch) * rotationMatrixVector(w, cameraRoll);
    
    
#ifdef antialiasing
    for (float x = 0.0; x < 1.0; x += float(antialiasing)) {
        for (float y = 0.0; y < 1.0; y += float(antialiasing)) {
            color += render(gl_FragCoord.xy + vec2(x, y));
            n += 1.0;
        }
    }
    color /= n;
#else
    color = render(gl_FragCoord.xy);
#endif
    
    if (color.a == 0.0) discard;
    
    gl_FragColor = vec4(pow(color.rgb, vec3(1.0 / gamma)), color.a);
}
