/**
 * Color object
 * 
 * An object for manipulating colours in RGB and HSV space.
 * 
 * Last update: 14 Feb 2011
 * 
 * Changelog:
 *   0.1   - Initial release
 * 
 * 
 * Copyright (c) 2011 Tom Beddard
 * http://www.subblue.com
 * 
 * Released under the MIT License: 
 * http://www.opensource.org/licenses/mit-license.php
 */

/*jslint nomen: false*/

function Color(r, g, b) {
	this._r = 0;
	this._g = 0;
	this._b = 0;
	
	if (typeof(r) === 'object') {
		this.r(r[0], false);
		this.g(r[1], false);
		this.b(r[2], false);
	} else if (typeof(r) === 'string') {
		this.hex(r);
	} else {
		this.r(r, false);
		this.g(g, false);
		this.b(b, false);
	}
	
	this.rgb2hsv();
}

Color.rgb2hsv = function (r, g, b) {
	var color = typeof(r) === 'number' ? [r / 255, g / 255, b / 255] : [r.r / 255, r.g / 255, r.b / 255],
		rgb_min = Math.min(color[0], Math.min(color[1], color[2])),
		rgb_max = Math.max(color[0], Math.max(color[1], color[2])),
		rgb_delta = rgb_max - rgb_min,
		v = rgb_max,
		h, s, r_delta, g_delta, b_delta;
	
    if (rgb_delta === 0.0) {
        // Grey
        h = 0.0;
        s = 0.0;
    } else {
        // Colour
        s = rgb_delta / rgb_max;
        r_delta = (((rgb_max - color[0]) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;
        g_delta = (((rgb_max - color[1]) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;
        b_delta = (((rgb_max - color[2]) / 6.0) + (rgb_delta / 2.0)) / rgb_delta;

        if (color[0] === rgb_max) {
            h = b_delta - g_delta;
        } else if (color[1] === rgb_max) {
            h = 1.0 / 3.0 + r_delta - b_delta;
        } else if (color[2] === rgb_max) {
            h = 2.0 / 3.0 + g_delta - r_delta;
        }

        if (h < 0.0) {
			h += 1.0;
		}
        if (h > 1.0) {
			h -= 1.0;
		}
    }
	
    return [Math.round(h * 359), Math.round(s * 100), Math.round(v * 100)];
};

Color.hsv2rgb = function (h, s, v) {
	var r, g, b, j, p, q, t, i;
    
	// Normalise
	h /= 359;
	s /= 100;
	v /= 100;

    if (h === 1.0) {
		h = 0.0;
    }
	
    if (v === 0.0) {
        // No brightness so return black
        return [0, 0, 0];
        
    } else if (s === 0.0) {
        // No saturation so return grey
		v *= 255;
		return [v, v, v];
        
    } else {
		// RGB color
        h *= 6.0;
		i = parseInt(Math.floor(h), 10);
		j = h - i;
		p = v * (1.0 - s);
		q = v * (1.0 - (s * j));
		t = v * (1.0 - (s * (1.0 - j)));
		
		if (i === 0) {
			r = v;
			g = t;
			b = p;
		} else if (i === 1) {
			r = q;
			g = v;
			b = p;
		} else if (i === 2) {
			r = p;
			g = v;
			b = t;
		} else if (i === 3) {
			r = p;
			g = q;
			b = v;
		} else if (i === 4) {
			r = t;
			g = p;
			b = v;
		} else if (i === 5) {
			r = v;
			g = p;
			b = q;
		}
	}	
	
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

Color.mix = function (color1, color2, amount) {
	var r = color1.r() * amount + color2.r() * (1 - amount),
		g = color1.g() * amount + color2.g() * (1 - amount),
		b = color1.b() * amount + color2.b() * (1 - amount);
	
	return new Color([r, g, b]);
};


Color.prototype = {
	r: function (val, convert) {
		if (typeof(val) !== 'undefined') {
			this._r = this.clamp(val, 255);
			
			if (convert !== false) {
				this.rgb2hsv();
			}
		}
		
		return this.clamp(this._r, 255, true);
	},
	
	g: function (val, convert) {
		if (typeof(val) !== 'undefined') {
			this._g = this.clamp(val, 255);
			
			if (convert !== false) {
				this.rgb2hsv();
			}
		}
		
		return this.clamp(this._g, 255, true);
	},
	
	b: function (val, convert) {
		if (typeof(val) !== 'undefined') {
			this._b = this.clamp(val, 255);
			
			if (convert !== false) {
				this.rgb2hsv();
			}
		}
		
		return this.clamp(this._b, 255, true);
	},
	
	red: function (val, convert) {
		return this.r(val, convert);
	},
	
	green: function (val, convert) {
		return this.g(val, convert);
	},
	
	blue: function (val, convert) {
		return this.b(val, convert);
	},
	
	_rgbParam: function (param, val, convert) {
		if (typeof(val) !== 'undefined') {
			param = this.clamp(val, 255);
			
			if (convert !== false) {
				this.rgb2hsv();
			}
		}
		
		return this.clamp(param, 255, true);
	},
	
	rgb: function (val) {
		var _rgb;
		
		if (typeof(val) === 'object') {
			this._r = this.clamp(val[0], 255);
			this._g = this.clamp(val[1], 255);
			this._b = this.clamp(val[2], 255);
			this.rgb2hsv();
		}
		
		return [this.r(), this.g(), this.b()];
	},
	
	h: function (val) {
		if (typeof(val) !== 'undefined') {
			this._h = this.clamp(val, 359);
			this.hsv2rgb();
		}
		
		return this.clamp(this._h, 359, true);
	},
	
	s: function (val) {
		if (typeof(val) !== 'undefined') {
			this._s = this.clamp(val, 100);
			this.hsv2rgb();
		}
		
		return this.clamp(this._s, 100, true);
	},
	
	v: function (val) {
		if (typeof(val) !== 'undefined') {
			this._v = this.clamp(val, 100);
			this.hsv2rgb();
		}
		
		return this.clamp(this._v, 100, true);
	},
	
	hue: function (val) {
		return this.h(val);
	},
	
	saturation: function (val) {
		return this.s(val);
	},
	
	brightness: function (val) {
		return this.v(val);
	},
	
	hsv: function (val, convert) {
		var _hsv;
		
		if (typeof(val) === 'object') {
			this._h = this.clamp(val[0], 359);
			this._s = this.clamp(val[1], 100);
			this._v = this.clamp(val[2], 100);
			this.hsv2rgb();
		}
		
		return [this.h(), this.s(), this.v()];
	},
	
	hsv2rgb: function () {
		var _rgb = Color.hsv2rgb(this._h, this._s, this._v);
		this._r = _rgb[0];
		this._g = _rgb[1];
		this._b = _rgb[2];
	},
	
	rgb2hsv: function () {
		var _hsv = Color.rgb2hsv(this._r, this._g, this._b);
		this._h = _hsv[0];
		this._s = _hsv[1];
		this._v = _hsv[2];
	},
	
	normalized: function () {
		return [this._r / 255, this._g / 255, this._b / 255];
	},
	
	hsv_normalized: function () {
		return [this._h / 359, this._s / 100, this._v / 100];
	},
	
	hex: function (val) {
		var _hex = '', i;
		
		if (typeof(val) === 'string') {
			val = val.replace(new RegExp("[^0-9a-f]", "gi"), '');
			
			if (val.length === 3) {
				val += val;
			} else if (val.length === 2) {
				val += val + val;
			}
			
			this._r = parseInt(val.substring(0, 2) || 0, 16);
			this._g = parseInt(val.substring(2, 4) || 0, 16);
			this._b = parseInt(val.substring(4, 6) || 0, 16);
			this.rgb2hsv();
		}
		
		for (i = 0; i < 3; i += 1) {
			if (this.rgb()[i] < 16) {
				_hex += '0';
			}
			_hex += this.rgb()[i].toString(16);
		}
		
		return _hex.toUpperCase();
	},
	
	css: function () {
		return "rgb(" + this.r() + "," + this.g() + "," + this.b() + ")";
	},
	
	// Make sure the number is an integer and within 0-max range
	clamp: function (n, max, round) {
		var num;
		
		n = parseFloat(n, 10) || 0;
		
		if (typeof(n) !== 'number') {
			n = 0;
		}
		
		if (round) {
			num = Math.min(Math.max(Math.floor(n), 0), max);
		} else {
			num = Math.min(Math.max(n, 0), max);
		}
		
		return num;
	},
	
	toString: function () {
		return "Color [red: " + this.r() + ", green: " + this.g() + ", blue: " + this.b() + ", hue: " + this.h() + ", saturation: " + this.s() + ", brightness: " + this.v() + "]";
	},
	
	clone: function () {
		return new Color(this.rgb());
	}
};