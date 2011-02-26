/**
 * GLQuad
 * 
 * A wrapper for creating a WebGL based quad and attaching shaders to it.
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

/*global window, $, document, alert, Float32Array, Image, console*/

function GLQuad(opts) {
	this.init(opts);
	
	return this.canvas;
}

GLQuad.supported = function (canvas) {
	var gl_strings = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"],
		gl, i;
	
	// Initialise WebGL
	for (i = 0; i < gl_strings.length; i += 1) {
		try {
			gl = (canvas || $("<canvas>")).get(0).getContext(gl_strings[i]);
		} catch (error) {
			//
		}
		if (gl) {
			break;
		}
	}
	
	// if (!gl) {
	// 	alert("WebGL not supported");
	// 	throw "Cannot create WebGL context";
	// }
	
	return gl;
};

GLQuad.prototype = {
	
	init: function (opts) {
		var self = this;
		
		// Set options
		this.options = {
			canvas			: null,			// target canvas element
			canvas_class	: 'gl_canvas',	// canvas class
			width			: 400,			// canvas width
			height			: 400,			// canvas height
			vertex			: null,			// vertext shader code
			fragment		: null,			// fragment shader code
			vertext_path	: null,			// path/URL to vertext shader file
			fragment_path	: null,			// path/URL to fragment shader file
			magic_define    : 'dE'			// Magic keyword to add a custom #define ... line
		};
		
		$.extend(this.options, opts);
		
		if (this.options.canvas) {
			this.canvas = this.options.canvas;
		} else {
			this.canvas = $("<canvas>")
				.bind("DOMNodeInserted", function (event) {
					// For some reason this event is firing twice :/
					if (!self.gl) {
						self.initGL();
					}
				});
		}
		
		this.canvas
			.attr({width: this.options.width, height: this.options.height})
			.addClass(this.options.canvas_class)
			.data("GLQuad", this);
		
		this.parameters = {};		// Object to store the current uniform values
		
		if (this.options.canvas && !self.gl) {
			self.initGL();
		}
		
	},
	
	
	initGL: function () {
		this.gl = GLQuad.supported(this.canvas);
		
		if (!this.gl) {
			alert("WebGL not supported");
			throw "Cannot create WebGL context";
		}
		
		this.reset();
		
		// Create Vertex buffer (2 triangles)
		this.vertex_buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, 
			new Float32Array([
				-1.0, -1.0, 1.0, 
				-1.0, -1.0, 1.0, 
				1.0, -1.0, 1.0, 
				1.0, -1.0, 1.0
			]),
			this.gl.STATIC_DRAW);
		
		if (this.options.vertex && this.options.fragment) {
			// Create shader from options src
			this.createProgram(this.options.vertex, this.options.fragment);
			
		} else if (this.options.vertex_path && this.options.fragment_path) {
			// Load shader files
			this.loadShaders(this.options.vertex_path, this.options.fragment_path);
		}
		
	},
	
	
	loadShaders: function (vert_path, frag_path) {
		this.options.vertex = '';
		this.options.fragment = '';
		this.loadShader('vertex', vert_path);
		this.loadShader('fragment', frag_path);
	},
	
	
	reset: function (full) {
		this.error = '';
		this.uniforms = {};							// Store objects for the uniform params
		this.controls = [];							// Reference the order of the uniforms for UI
		this.defines = {vertex: {}, fragment: {}};	// Shader specific define statements
		
		if (full) {
			this.parameters = {};
		}
	},
	
	
	loadShader: function (type, path) {
		var self = this;
		
		// Note: as of jQuery 1.5 loading the shaders locally from file:// no longer works.
		// ShaderLab should be run from a local web server at least
		$.ajax({
			url: path, 
			dataType: 'text',
			headers: {"Access-Control-Allow-Origin": "*"},
			success: function (data, textStatus, jqXHR) {
				self.options[type] = data;
				
				if (self.options.vertex && self.options.fragment) {
					// console.log("loaded shaders");
					self.canvas.trigger("loaded");
					self.createProgram(self.options.vertex, self.options.fragment);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				self.error += "Could not load the " + type + " shader: " + path + "\n";
				self.canvas.trigger("error");
			}
		});
	},
	
	
	loadTexture: function (path) {
		var texture = this.gl.createTexture(),
			image = new Image(),
			gl = this.gl,
			t2d = this.gl.TEXTURE_2D;

		image.src = path;
		image.onload = function () {
			gl.enable(t2d);
			gl.bindTexture(t2d, texture);
			gl.texImage2D(t2d, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(t2d, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(t2d, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(t2d, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(t2d, gl.TEXTURE_WRAP_T, gl.REPEAT);
			gl.generateMipmap(t2d);
			gl.bindTexture(t2d, null);
		};

		return texture;
	},
	
	createProgram: function (vertex_src, fragment_src) {
		this.reset();
		
		var program = this.gl.createProgram(),
			vsrc = this.parseShader('vertex', vertex_src),
			fsrc = this.parseShader('fragment', fragment_src),
			vs, fs;
		
		this.setDefaultParameters();
		
		vs = this.createShader(this.gl.VERTEX_SHADER, vsrc, this.defines.vertex);
		fs = this.createShader(this.gl.FRAGMENT_SHADER, fsrc, this.defines.fragment);
		
		if (vs === null || fs === null) {
			console.log("No program");
			return false;
		}
		
		
		this.gl.attachShader(program, vs);
		this.gl.attachShader(program, fs);
		this.gl.deleteShader(vs);
		this.gl.deleteShader(fs);
		this.gl.linkProgram(program);

		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			this.error += "VALIDATE_STATUS: " + this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS) + "\n" +
				"ERROR: " + this.gl.getError() + "\n" + fragment_src + "\n\n";
		}
		
		if (this.error !== '') {
			this.canvas.trigger("error");
			return false;
		} else {
			this.glProgram = program;
		}
		
		this.options.vertex = vertex_src;
		this.options.fragment = fragment_src;
		this.resize(this.options.width, this.options.height);
		
		this.canvas.trigger("ready");
		// this.draw();
		
		return true;
	},
	
	
	// Extract parameter options for the UI
	parseShader: function (type, src) {
		var lines = src.split("\n"),
			new_lines = [],
			i, 
			l = lines.length,
			m,
			opts;

		for (i = 0; i < l; i += 1) {
			m = lines[i].match(new RegExp("^uniform (float|int|int2|int3|int4|vec2|vec3|vec4|bool|mat2|mat3|mat4)\\s*([\\w]+)[^\\{]*(\\{[^\\}]+\\})?"));
			
			if (m) {
				// Matched a uniform input
				if (m.length === 4 && typeof(m[3]) !== 'undefined') {
					opts = {type: m[1], name: m[2]};
					
					try {
						$.extend(opts, JSON.parse(m[3]));
					} catch (e1) {
						// console.warn(e1, m[3]);
						this.error += e1 + "\n" + m[3] + "\n\n";
						continue;
					}
					
					if (!this.uniforms[opts.name]) {
						this.uniforms[opts.name] = opts;
						this.controls.push(opts.name);
					} else {
						$.extend(this.uniforms[opts.name], opts);
					}
					
					if (typeof(opts.value) === 'undefined') {
						opts.value = opts['default'];
					}
					
				}
			} else {
				
				m = lines[i].match(new RegExp("^#define\\s*([\\w]+)\\s*([\\w.\\-]+)[^\\{]*(\\{[^\\}]+\\})?"));
				
				if (m) {
					// Match a #define option
					if (m.length === 4 && typeof(m[3]) !== 'undefined') {
						opts = {name: m[1], value: m[2], "default": m[2], constant: true};
					
						try {
							$.extend(opts, JSON.parse(m[3]));
						} catch (e2) {
							// console.warn(e2, m[3]);
							this.error += e2 + "\n" + m[3] + "\n\n";
							continue;
						}
					
						this.defines[type][opts.name] = opts;
					
						continue;
					}
				}
			}
			
			new_lines.push(lines[i].replace(/\t/g, "    "));
			
		}
		
		// Recompile augmented shader
		return new_lines.join("\n");
		
	},
	
	createShader: function (type, src, defs) {
		var gl = this.gl,
			shader = gl.createShader(type),
			pre_src = [],
			full_src,
			i, l, prop, def, error_src = '';
		
		// Add any define 'controls' to the start of the shader
		for (prop in defs) {
			if (defs.hasOwnProperty(prop)) {
				def = '';
				if (defs[prop].control === 'bool' && this.parameters[prop] === false) {
					def += "//";
				}
				def += "#define " + prop + " " + this.parameters[prop];
				pre_src.push(def);
			}
		}
		
		// Magic define to help separate different code blocks
		if (defs[this.options.magic_define]) {
			pre_src.push("#define " + this.options.magic_define + this.parameters[this.options.magic_define] + " 1");
		}
		
		full_src = pre_src.join("\n") + "\n" + src;
		// gl.shaderSource(shader, full_src.replace(new RegExp("\\/\\/[^\\n]*", "g"), ''));
		gl.shaderSource(shader, full_src);
		gl.compileShader(shader);
		
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			// Create line numbered error message
			$.each(gl.getShaderSource(shader).split("\n"), function (i, line) { error_src += (i + 1) + ": " + line + "\n"; });
			
			this.error += ((type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") + " SHADER:\n" + gl.getShaderInfoLog(shader) + "\n\n" + error_src);
			this.canvas.trigger("error");
			return null;
		}
		
		this.options[type] = full_src;
		
		return shader;
	},
	
	
	sendUniforms: function () {
		var location, prop,
			gl = this.gl;
		
		// Set values to program variables
		for (prop in this.parameters) {
			if (this.parameters.hasOwnProperty(prop)) {
				this.sendUniform(prop);
			}
		}
	},
	
	
	sendUniform: function (key) {
		var gl = this.gl,
			param = this.parameters[key],
			location = this.getUniformLocation(key),
			uniform = this.uniforms[key],
			type;
		
		if (location && uniform && param !== null) {
			type = uniform.type;
			
			switch (type) {
			case 'float':
				gl.uniform1f(location, param);
				break;
			case 'int':
			case 'bool':
				gl.uniform1i(location, param);
				break;
			case 'vec2':
				gl.uniform2fv(location, param);
				break;
			case 'int2':
				gl.uniform2iv(location, param);
				break;
			case 'vec3':
				gl.uniform3fv(location, param);
				break;
			case 'int3':
				gl.uniform3iv(location, param);
				break;
			case 'vec4':
				gl.uniform4fv(location, param);
				break;
			case 'int4':
				gl.uniform4iv(location, param);
				break;
			case 'mat2':
				gl.uniformMatrix2fv(location, gl.FALSE, param);
				break;
			case 'mat3':
				gl.uniformMatrix3fv(location, gl.FALSE, param);
				break;
			case 'mat4':
				gl.uniformMatrix4fv(location, gl.FALSE, param);
				break;
		    }
		}
	},
	
	
	getUniformLocation: function (key) {
		return this.gl.getUniformLocation(this.glProgram, key);
	},
	
	
	// Only set the parameters if none have been set
	setDefaultParameters: function () {
		var key,
			params = {};
		
		params = this.setParameterObj(this.uniforms, params);
		
		if (this.defines.vertex) {
			params = this.setParameterObj(this.defines.vertex, params);
		}
		
		if (this.defines.fragment) {
			params = this.setParameterObj(this.defines.fragment, params);
		}
		
		this.parameters = params;
	},
	
	setParameterObj: function (obj, params) {
		var key;
		
		for (key in obj) {
			if (!this.parameters || typeof(this.parameters[key]) === 'undefined' || !obj[key].label) {
				// Set the default if no custom value set or the parameter doesn't have a control
				params[key] = obj[key]['default'];
			} else {
				params[key] = this.parameters[key];
			}
		}
		
		return params;
	},
	
	
	resize: function (w, h) {
		this.canvas.attr({width: w, height: h});
		this.gl.viewport(0, 0, w, h);
	},
	
	
	getPixels: function (x, y, w, h) {
		var pixels;
		w = w || this.options.width;
		h = h || this.options.height;
		
		pixels = new Uint8Array(w * h * 4);
		this.gl.readPixels(x || 0, y || 0, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
		
		return pixels;
	},
	
	
	draw: function () {
		var uniform,
			loc,
			vertexPositionLocation,
			textureLocation,
			gl = this.gl;

		if (!this.glProgram) {
			// console.warn("WebGL program not setup");
			return false;
		}
		
		// console.log("draw");
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// Load the program & set parameters
		gl.useProgram(this.glProgram);
		this.sendUniforms();

		// Bind textures
		if (this.texture) {
			textureLocation = gl.getUniformLocation(this.glProgram, 'texture');
			gl.uniform1i(textureLocation, 0);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
		}

		// Render geometry
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		vertexPositionLocation = gl.getAttribLocation(this.glProgram, 'vertexPosition');
		gl.vertexAttribPointer(vertexPositionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionLocation);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.disableVertexAttribArray(vertexPositionLocation);
	}
	
};