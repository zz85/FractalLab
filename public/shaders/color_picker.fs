#ifdef GL_ES
precision highp float;
#endif

varying vec2  position;
uniform vec3  base_color;		// {"label":"Base colour"}
uniform vec3  color1;			// {"label":"Color 1"}
uniform vec3  color2;			// {"label":"Color 2"}
uniform float amount;			// {"label":"Amount"}
uniform float mode;				// {"label":"Mode"}

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


void main(void) {
	vec3 white = vec3(1.0),
		black = vec3(0.0),
		color = base_color,
		col0, col1, col2;
	
	
	if (mode == 1.0) {
		// Changing saturation
		col0 = hsv2rgb(vec3(position.x, amount, position.y));
	} else if (mode == 2.0) {
		// Changing brightness
		col0 = hsv2rgb(vec3(position.x, position.y, 1.0)) * amount;	
	
	} else if (mode == 3.0) {
		// Red fixed
		col1 = mix(vec3(amount, 1.0, 0.0), vec3(amount, 1.0, 1.0), position.x);
		col2 = mix(vec3(amount, 0.0, 0.0), vec3(amount, 0.0, 1.0), position.x);
		col0 = mix(col2, col1, position.y);
		
	} else if (mode == 4.0) {
		// Green fixed
		col1 = mix(vec3(1.0, amount, 0.0), vec3(1.0, amount, 1.0), position.x);
		col2 = mix(vec3(0.0, amount, 0.0), vec3(0.0, amount, 1.0), position.x);
		col0 = mix(col2, col1, position.y);
		
	} else if (mode == 5.0) {
		// Blue fixed
		col1 = mix(vec3(0.0, 1.0, amount), vec3(1.0, 1.0, amount), position.x);
		col2 = mix(vec3(0.0, 0.0, amount), vec3(1.0, 0.0, amount), position.x);
		col0 = mix(col2, col1, position.y);
	
	} else if (mode == 6.0) {
		// Palette slider for hue
		col0 = hsv2rgb(vec3(position.x, 1, 1));
	
	} else if (mode == 7.0) {
		// Palette slider for saturation (input colors in hsv)
		// col1 = mix(vec3(base_color.x, 0, base_color.z), base_color, position.x);
		col1 = mix(color2, color1, position.x);
		col0 = hsv2rgb(col1);
	
	} else if (mode == 8.0) {
		// Palette slider for brightness
		col0 = mix(black, color1, position.x);
	
	} else if (mode == 9.0) {
		// Palette slider for red
		col0 = mix(color2, color1, position.x);
	
	} else if (mode == 10.0) {
		// Palette slider for green
		col0 = mix(color2, color1, position.x);
	
	} else if (mode == 11.0) {
		// Palette slider for blue
		col0 = mix(color2, color1, position.x);
	
	} else {
		// Changing hue
		col1 = mix(white, color, position.x);
		col0 = mix(black, col1, position.y);
	}
	
    gl_FragColor = vec4(col0, 1.0);
}

