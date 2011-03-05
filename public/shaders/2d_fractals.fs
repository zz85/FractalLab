#ifdef GL_ES
precision highp float;
#endif

/**
 * Fractal Lab's 2D fractal shader
 * Last update: 19 February 2011
 *
 * Changelog:
 *      0.1     - Initial release
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
*/


#define maxIterations 50            // {"label":"Iterations", "min":1, "max":400, "step":1, "group_label":"2D parameters"}
#define antialiasing 0.5            // {"label":"Anti-aliasing", "control":"bool", "default":false, "group_label":"Render quality"}

uniform float scale;                // {"label":"Scale",        "min":-10,  "max":10,   "step":0.1,     "default":2,    "group":"Fractal", "group_label":"Fractal parameters"}
uniform float power;                // {"label":"Power",        "min":-20,  "max":20,   "step":0.001,     "default":2,    "group":"Fractal"}
uniform float bailout;              // {"label":"Bailout", "min":0.1, "max":50, "step":1, "default":4, "group":"Fractal"}
uniform int   minIterations;        // {"label":"Min. iterations", "min":1, "max":400, "step":1, "group":"Fractal"}

uniform bool  juliaMode;            // {"label":"Enable", "default":false,    "group":"Fractal", "group_label":"Julia mode"}
uniform vec2  offset;               // {"label":["Offset x","Offset y"],  "min":-2,   "max":2,    "step":0.001,    "default":[0.36,0.06],  "group":"Fractal"}

uniform int   colorMode;            // {"label":"Colour mode",  "min":0,  "max":6,   "step":1,     "default":0,    "group":"Colour"}
uniform int   bailoutStyle;         // {"label":"Colour style", "min":0,  "max":4,   "step":1,     "default":0,    "group":"Colour"}
uniform float colorScale;           // {"label":"Colour scale",  "min":0,  "max":10,   "step":0.01,     "default":1,    "group":"Colour"}
uniform float colorCycle;           // {"label":"Colour cycle", "min":0,  "max":10,   "step":0.01,     "default":1,    "group":"Colour"}
uniform float colorCycleOffset;     // {"label":"Colour cycle offset", "min":-10,  "max":10,   "step":0.01,     "default":0,    "group":"Colour"}
uniform bool  colorCycleMirror;     // {"label":"Colour mirror", "default":false,    "group":"Colour"}
uniform bool  hsv;                  // {"label":"Rainbow", "default":false,    "group":"Colour"}
uniform float iterationColorBlend;  // {"label":"Iteration blend", "min":0,  "max":50,   "step":0.01,     "default":0,    "group":"Colour"}

uniform int   colorIterations;      // {"label":"Colour iterations", "default": 4, "min":0, "max": 30, "step":1, "group":"Colour", "group_label":"Base colour"}
uniform vec3  color1;               // {"label":"Colour 1",  "default":[1.0, 1.0, 1.0], "group":"Colour", "control":"color"}
uniform vec3  color2;               // {"label":"Colour 2",  "default":[0, 0.53, 0.8], "group":"Colour", "control":"color"}
uniform vec3  color3;               // {"label":"Inside colour",  "default":[0.0, 0.0, 0.0], "group":"Colour", "control":"color"}
uniform float gamma;                // {"label":"Gamma correction", "default":1, "min":0.1, "max":2, "step":0.01, "group":"Colour"}

uniform float rotation;             // {"label":"Rotation",         "min":-180, "max":180,  "step":0.5,     "default":0,    "group":"Camera", "group_label":"Camera parameters"}
uniform vec3  cameraPosition;       // {"label":["Camera x", "Camera y", "Camera z"],   "default":[-0.5, 0, 2.5], "control":"camera", "group":"Camera"}

uniform vec2  size;                 // {"default":[400, 300]}

float aspectRatio = size.x / size.y;
mat2  rotationMatrix;


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


// RGB to HSV
// http://www.easyrgb.com/index.php?X=MATH&H=20#text20
vec3 rgb2hsv(vec3 color)
{
    float rgb_min = min(color.r, min(color.g, color.b));
    float rgb_max = max(color.r, max(color.g, color.b));
    float rgb_delta = rgb_max - rgb_min;
    
    float v = rgb_max;
    float h, s;
    
    if (rgb_delta == 0.0) {
        // Grey
        h = 0.0;
        s = 0.0;
    } else {
        // Colour
        s = rgb_delta / rgb_max;
        float r_delta = (((rgb_max - color.r) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;
        float g_delta = (((rgb_max - color.g) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;
        float b_delta = (((rgb_max - color.b) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;
        
        if (color.r == rgb_max) {
            h = b_delta - g_delta;
        } else if (color.g == rgb_max) {
            h = 1.0 / 3.0 + r_delta - b_delta;
        } else if (color.b == rgb_max) {
            h = 2.0 / 3.0 + g_delta - r_delta;
        }
        
        if (h < 0.0) h += 1.0;
        if (h > 1.0) h -= 1.0;
    }
    
    return vec3(h, s, v);
}


vec3 hsv2rgb(vec3 hsv)
{
    float h, s, v, r, g, b, j, p, q, t;
    int i;
    vec3 color;
    
    h = hsv.x;
    s = hsv.y;
    v = hsv.z;
	
    if (h == 1.0) {
		h = 0.0;
	}
    
    if (v == 0.0) {
        // No brightness so return black
        color = vec3(0.0);
        
    } else if (s == 0.0) {
        // No saturation so return grey
        color = vec3(v);
        
    } else {
		// RGB color
        h *= 6.0;
		i = int(floor(h));
		j = h - float(i);
		p = v * (1.0 - s);
		q = v * (1.0 - (s * j));
		t = v * (1.0 - (s * (1.0 - j)));
		
		if (i == 0) {
			r = v;
			g = t;
			b = p;
		} else if (i == 1) {
			r = q;
			g = v;
			b = p;
		} else if (i == 2) {
			r = p;
			g = v;
			b = t;
		} else if (i == 3) {
			r = p;
			g = q;
			b = v;
		} else if (i == 4) {
			r = t;
			g = p;
			b = v;
		} else if (i == 5) {
			r = v;
			g = p;
			b = q;
		}
		color = vec3(r, g, b);
	}
    
    return color;
}

float _bailout = exp(bailout);
float log2Bailout = log(2.0 * log(_bailout));
float logPower = log(abs(power));

bool bailoutLimit(vec2 z) {
    bool bailing = false;
    
    if (bailoutStyle == 3 && (pow(z.x, 2.0) - pow(z.y, 2.0)) >= _bailout) {
        bailing = true;
        
    } else if (bailoutStyle == 4 && (z.y * z.y - z.y * z.x) >= bailout) {
        bailing = true;
        
    } else if (bailoutStyle == 2 && (pow(z.y, 2.0) - pow(z.x, 2.0)) >= _bailout) {
        bailing = true;
        
    } else if (bailoutStyle == 1 && (abs(z.x) > bailout || abs(z.y) > _bailout)) {
        bailing = true;
        
    } else if (dot(z, z) >= _bailout) {
        bailing = true;
    }
    
    return bailing;
}


vec3 colorMapping(float n, vec2 z) {
    vec3 color = color3,
        c1 = color1,
        c2 = color2;
    
    if (hsv) {
        c1 = rgb2hsv(c1);
        c2 = rgb2hsv(c2);
    }
    
    if (colorMode == 3) {
        color = atan(z.y, z.x) > 0.0 ? c1 : c2;
        
    } else if (colorMode == 4) {
        color = mod(n, 2.0) == 0.0 ? c1 : c2;
        
    } else if (colorMode == 5) {
        color = (abs(z.x) < bailout / 2.0 || abs(z.y) < bailout / 2.0) ? c1 : c2;
        
    } else if (colorMode == 6) {
        float v = 0.5 * sin(floor(colorScale) * complexArg(z)) + 0.5;
        color = mix(c1, c2, v);
         
    } else {
        float v = abs(1.0 - n / float(maxIterations));
        float v0 = v;
        float vp, v1;
        
        if (colorMode != 2) {
            // Smooth colouring
            // From: http://en.wikipedia.org/wiki/Mandelbrot_set#Continuous_.28smooth.29_coloring
            vp = abs((log2Bailout - log(log(abs(length(z))))) / logPower);
            v1 = abs(1.0 - (n + 1.0) / float(maxIterations));
            
            if (colorMode == 1) {
                if (n == 0.0) {
                    v = v - (v - v1) * vp;
                } else {
                    v = v1 - (v1 - v) * vp;
                }
            } else {
                v = v + (v1 - v) * vp;
            }
        }
        
        if (colorMode == 2 && n == 0.0) v = 1.0;
        
        if (colorScale > 1.0) v = pow(v, colorScale);
        
        if (colorCycle > 1.0) v *= colorCycle;
        
        v += colorCycleOffset;
        
        if (colorCycleMirror) {
            bool even = mod(v, 2.0) < 1.0 ? true : false;
            if (even) {
                v = 1.0 - mod(v, 1.0);
            } else {
                v = mod(v, 1.0);
            }
        } else {
            v = 1.0 - mod(v, 1.0);
        }
        
        if (hsv) {
            color = hsv2rgb(mix(c1, c2, clamp(v, 0.0, 1.0)));
        } else {
           color = mix(c1, c2, clamp(v, 0.0, 1.0));
        }
    }
    
    return color;
}


vec4 render(vec2 pixel) {
    vec3  color = color3;
    float n = 0.0;
    vec2  z = ((pixel - (size * 0.5)) / size) * vec2(aspectRatio, 1.0) * cameraPosition.z + cameraPosition.xy;
    z *= rotationMatrix;
    
    vec2  c = juliaMode ? offset : z;
    
    for (int i = 0; i < maxIterations; i++) {
        n += 1.0;
        z = complexPower(z, power) + c;
        
        if (n >= float(minIterations) && bailoutLimit(z)) {
            color = colorMapping(n, z);
            break;
        }
    }
    
    if (iterationColorBlend > 0.0) {
        float blend = clamp(1.0 - (n / float(maxIterations)) * iterationColorBlend, 0.0, 1.0);
        color = mix(color3, color, blend);
    }
     
    return vec4(color.rgb, 1.0);
}





// The main loop
void main()
{
    vec4 color = vec4(0.0);
    float n = 0.0;
    
    float rc = cos(radians(rotation));
    float rs = sin(radians(rotation));
    rotationMatrix = mat2(rc, rs, -rs, rc);
    
    
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

    gl_FragColor = vec4(pow(color.rgb, vec3(1.0 / gamma)), 1.0);
}
