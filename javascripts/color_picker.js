/**
 * Color Picker
 * 
 * A WebGL based colour picker based on the Photoshop colour picker.
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


/*global window, jQuery, document, $, console, Color, GLQuad*/


function ColorPicker(opts) {
	this.init(opts);
	this.container.data("color_picker", this);
	
	return this.container;
}

ColorPicker.prototype = {
	init: function (opts) {
		var self = this,
			default_options = {
				container_class: 'cp_container',
				canvas_container_class: 'cp_canvas_container',
				canvas_class: 'cp_canvas',
				canvas_slider_class: 'cp_canvas_slider',
				slider_cursor_class: 'cp_slider_cursor',
				ui_class: 'cp_ui',
				label_class: 'cp_label',
				radio_class: 'cp_radio',
				input_class: 'cp_input',
				hex_input_class: 'cp_hex_input',
				cursor_class: 'cp_cursor',
				colorbox_class: 'cp_colorbox',
				canvas_overlay: 'cp_overlay',
				canvas_slider_overlay: 'cp_slider_overlay',
				width: 256,
				height: 256,
				base_color: new Color(255, 0, 0),
				current_color: new Color(255, 0, 0),
				old_color: new Color(255, 0, 0),
				amount: 1,
				mode: 0,
				vertex_path: null,
				fragment_path: null
			},
			canvas_slider_width;
		
		this.options = $.extend({}, default_options, opts);
		
		$.each(['base_color', 'current_color', 'base_color'], function (i, val) {
			if (typeof(self.options[val].length) === 'number') {
				self.options[val] = new Color(self.options[val]);
			}
		});
		this.color_for_slider = this.options.base_color;
		
		this.onDown = function (event) {
			self.sampleCanvas(event);
			self.canvas_overlay.bind("mousemove", self.onDrag);
			self.canvas_overlay.bind("mouseup mouseout", self.onUp);
		};
		
		this.onDrag = function (event) {
			self.sampleCanvas(event);
		};
		
		this.onUp = function (event) {
			self.canvas_overlay.unbind("mousemove mouseup");
		};
		
		this.onSliderDown = function (event) {
			self.canvas_slider_overlay.bind("mousemove", self.onSliderDrag);
			self.canvas_slider_overlay.bind("mouseup mouseout", self.onSliderUp);
			self.onSliderDrag(event);
			
		};
		
		this.onSliderDrag = function (event) {
			var x = (event.offsetX || event.layerX);
			self.sliderEvent(Math.max(Math.min((x - 10) / self.options.width, 1), 0));
		};
		
		this.onSliderUp = function (event) {
			self.canvas_slider_overlay.unbind("mousemove mouseup mouseout");
		};
		
		this.inputChange = function (event) {
			if (self.options.mode < 3) {
				self.updateHSB();
			} else {
				self.updateRGB();
			}
			
			self.updateColor();
			self.switchMode();
		};
		
		this.hexChange = function (event) {
			self.updateColor(new Color(event.target.value));
			self.switchMode();
		};
		
		this.resetColor = function (event) {
			self.updateColor(self.options.base_color);
			self.switchMode();
		};
		
		this.initUI();
		this.current_mode = "cb_Hue";
		
		this.container
			.bind("DOMNodeInserted", function (event) {
				if (!self.palette) {
					self.initWebGL();
				}
			});
		
	},
	
	
	initUI: function () {
		var self = this,
			control, label, radio, input;
		
		// Setup interface
		this.container = $("<div>")
			.addClass(this.options.container_class)
			.data("picker", this);
		this.canvas_container = $("<div>")
			.attr({width: this.options.width, height: this.options.height})
			.addClass(this.options.canvas_container_class);
		this.canvas = $("<canvas>")
			.attr({width: this.options.width, height: this.options.height})
			.addClass(this.options.canvas_class);
		this.canvas_slider = $("<canvas>")
			.attr({width: this.options.width, height: 20})
			.addClass(this.options.canvas_slider_class);
		
		this.canvas_container.append(this.canvas);
		this.canvas_container.append(this.canvas_slider);
		
		this.cx = 0;
		this.cy = 0;
		this.cursor = $("<span>")
			.addClass(this.options.cursor_class)
			.css({left: this.cx, top: this.cy});
		this.ui = $("<div>").addClass(this.options.ui_class);
		
		this.slider_cursor = $("<span>")
			.addClass(this.options.slider_cursor_class)
			.css({left: this.cx, top: this.options.height + 4})
			.appendTo(this.canvas_container);
		
		this.canvas_slider_overlay = $("<div>")
			.addClass(this.options.canvas_slider_overlay)
			.appendTo(this.canvas_container)
			.bind("mousedown", this.onSliderDown)
			.bind("selectstart", function () {
				return false;
			});
		
		this.canvas_overlay = $("<div>")
			.addClass(this.options.canvas_overlay)
			.bind("mousedown", this.onDown)
			.bind("selectstart", function () {
				return false;
			});
		
		this.canvas_container.append(this.cursor);
		this.canvas_container.append(this.canvas_overlay);
		this.container.append(this.canvas_container);
		this.container.append(this.ui);
		// target.append(this.container);
		
		
		// Create color box for current and default colours
		this.color_box = $("<div>")
			.addClass(this.options.colorbox_class);
		
		this.color_box1 = $("<span>")
			.addClass(this.options.colorbox_class + "_1")
			.css("backgroundColor", this.options.current_color.hex());
		
		this.color_box2 = $("<span>")
			.addClass(this.options.colorbox_class + "_2")
			.css("backgroundColor", this.options.base_color.hex())
			.click(this.resetColor);
		
		this.color_box.append(this.color_box1);
		this.color_box.append(this.color_box2);
		this.ui.append(this.color_box);
		
		
		// Radio button views
		$.each(["Hue", "Saturation", "Brightness", "Red", "Green", "Blue"], function (idx, val) {
			label = $("<label>")
				.addClass(self.options.label_class + " cp_label_" + val)
				.attr("for", "cb_" + val)
				.text(val[0]);
			radio = $("<input>")
				.addClass(self.options.radio_class)
				.attr({id: "cb_" + val, value: idx, name: "cp_mode", type: "radio"});
			label.prepend(radio);
			
			input = $("<input>")
				.addClass(self.options.input_class)
				.attr({id: "inp_" + val, value: 0, type: "text", maxlength: 3})
				.bind("change blur", self.inputChange);
			self["inp_" + val] = input;
			label.prepend(input);
			self.ui.append(label);
			
			// Change color mode
			radio.bind("change", function (event) {
				self.switchMode(event);
			});
		});
		
		label = $("<label>")
			.addClass(self.options.label_class + " cp_label_hex")
			.attr("for", "cb_hex")
			.text("#");
		
		this.hex_input = $("<input>")
			.attr({type: "text", maxlength: 7})
			.addClass(self.options.hex_input_class)
			.change(self.hexChange)
			.appendTo(label);
		this.ui.append(label);
		
	},
	
	
	// Setup WebGL
	initWebGL: function () {
		var self = this;
		
		this.palette = new GLQuad({
			canvas: this.canvas,
			vertex: null,
			fragment: null,
			width: this.options.width,
			height: this.options.height,
			vertex_path: this.options.vertex_path,
			fragment_path: this.options.fragment_path
		});
		this.palette_quad = this.palette.data("GLQuad");

		this.palette
			.bind("loaded", function (event) { })
			.bind("ready", function (event) {
				// Create the canvas slider with the same shader
				self.palette_slider = new GLQuad({
					canvas: self.canvas_slider,
					vertex: self.palette_quad.options.vertex,
					fragment: self.palette_quad.options.fragment,
					width: self.options.width,
					height: 20
				});
				self.palette_slider_quad = self.palette_slider.data("GLQuad");
				
				// Kick it all off
				$("input[type=radio]", self.ui).first().attr("checked", true).trigger("change");
			})
			.bind("error", function (event) {
				console.log("Error", $(event.target).data("GLQuad").error);
			});
	},
	
	
	setColor: function (color) {
		this.options.old_color = new Color(color);
		this.options.base_color = new Color(color);
		this.color_for_slider = this.options.base_color;
		this.updateColor(this.options.old_color);
		this.canvas_overlay.unbind("mousemove mouseup mouseout");
		this.canvas_slider_overlay.unbind("mousemove mouseup mouseout");
		this.switchMode();
	},
	
	
	// Change colour picker mode
	switchMode: function (event) {
		var mode = event ? parseInt(event.target.value, 10) : this.options.mode, 
			val,
			hsv = this.options.current_color.hsv_normalized(),
			rgb = this.options.current_color.normalized();
		
		switch (mode) {
		case 0:
			// Fixed hue
			val = hsv[0];
			this.cx = hsv[1] * this.options.width;
			this.cy = (1 - hsv[2]) * this.options.height;
			break;
		case 1:
			// Fixed saturation
			val = hsv[1];
			this.cx = hsv[0] * this.options.width;
			this.cy = (1 - hsv[2]) * this.options.height;
			break;
		case 2:
			// Fixed brightness
			val = hsv[2];
			this.cx = hsv[0] * this.options.width;
			this.cy = (1 - hsv[1]) * this.options.height;
			break;
		case 3:
			// Fixed red
			val = rgb[0];
			this.cx = rgb[2] * this.options.width;
			this.cy = (1 - rgb[1]) * this.options.height;
			break;
		case 4:
			// Fixed green
			val = rgb[1];
			this.cx = rgb[2] * this.options.width;
			this.cy = (1 - rgb[0]) * this.options.height;
			break;
		case 5:
			// Fixed blue
			val = rgb[2];
			this.cx = rgb[0] * this.options.width;
			this.cy = (1 - rgb[1]) * this.options.height;
			break;
		}
		
		this.options.mode = mode;
		this.sliderEvent(val);
		
		if (mode === 2) {
			this.color_for_slider = this.options.current_color;
		}
		
		this.cursor.css({left: this.cx, top: this.cy});
		this.current_mode = event && event.currentTarget.id || this.current_mode || "cb_Hue";
	},
	
	
	// Change colour range value
	sliderEvent: function (value) {
		var limits = [359, 100, 100, 255, 255, 255];
		
		this.slider_cursor.css("left", value * this.options.width);
		this.options.amount = value;
		
		$("#" + this.current_mode.replace("cb_", "inp_")).val(Math.round(value * limits[this.options.mode]));
		
		if (this.options.mode < 3) {
			this.updateHSB();
			
		} else {
			this.updateRGB();
		}
		
		this.updateColor(this.samplePalette(this.cx, this.cy));
	},
	
	sampleCanvas: function (event) {
		var x = (event.offsetX || event.layerX) - 11,
			y = (event.offsetY || event.layerY) - 11,
			c;
		
		this.cx = Math.max(Math.min(x, this.options.width - 1), 0);
		this.cy = Math.max(Math.min(y, this.options.height - 1), 0);
		this.cursor.css({left: this.cx, top: this.cy});
		c = this.samplePalette(this.cx, this.cy);
		this.color_for_slider = c.clone();
		this.color_for_slider.brightness(100);
		
		this.updateColor(c);
	},
	
	samplePalette: function (x, y) {
		var color = new Color(),
			color1,
			color2;
		
		x /= this.options.width;
		y /= this.options.height;
		y = 1 - y;
		
		switch (this.options.mode) {
		case 0:
			// Fixed hue
			color.hsv([360 * this.options.amount, 101 * x, 101 * y]);
			break;
		
		case 1:
			// Fixed saturation
			color.hsv([360 * x, 101 * this.options.amount, 101 * y]);
			break;
		
		case 2:
			// Fixed brightness
			color.hsv([360 * x, 101 * y, 101 * this.options.amount]);
			break;
		
		case 3:
			// Fixed red
			color = new Color([this.options.amount * 255, y * 255, x * 255]);
			break;
		
		case 4:
			// Fixed green
			color = new Color([y * 255, this.options.amount * 255, x * 255]);
			break;
		
		case 5:
			// Fixed blue
			color = new Color([x * 255, y * 255, this.options.amount * 255]);
			break;
		
		}
		
		return color;
	},
	
	updateRGB: function () {
		this.options.current_color = new Color([this.inp_Red.val(), this.inp_Green.val(), this.inp_Blue.val()]);
	},
	
	updateHSB: function () {
		this.options.current_color.hsv([this.inp_Hue.val(), this.inp_Saturation.val(), this.inp_Brightness.val()]);
	},
	
	updateColor: function (color) {
		if (color) {
			this.options.current_color = color;	
		}
		
		this.color_box1.css("background-color", this.options.current_color.css());
		this.color_box2.css("background-color", this.options.old_color.css());
		
		this.inp_Red.val(this.options.current_color.r());
		this.inp_Green.val(this.options.current_color.g());
		this.inp_Blue.val(this.options.current_color.b());
		
		this.inp_Hue.val(this.options.current_color.h());
		this.inp_Saturation.val(this.options.current_color.s());
		this.inp_Brightness.val(this.options.current_color.v());
		this.hex_input.val(this.options.current_color.hex());
		this.draw();
	},
	
	
	draw: function () {
		var color;
		
		if (this.palette_slider_quad) {
			// Set palette slider options
			color = new Color();
			
			if (this.options.mode === 0) {
				// Set base color based on current hue but max sat and brightness
				color.hue(this.options.amount * 359);
				color.saturation(100);
				color.brightness(100);
				this.options.base_color = color;
				this.options.slider_color = color.normalized();
				
			} else if (this.options.mode === 1) {
				// Fixed saturation
				this.options.slider_color1 = [this.options.current_color.hue() / 359, 1, 1];
				
				this.options.slider_color2 = [this.options.slider_color1[0], 0, Math.max(this.options.current_color.brightness() / 100, 0.33)];
				
				color.hue(this.options.current_color.hue());
				color.saturation(100);
				color.brightness(100);
				this.options.base_color = color;
				
			} else if (this.options.mode === 2) {
				// Fixed brightness
				color.hue(this.options.current_color.hue());
				color.saturation(100);
				color.brightness(100);
				this.options.slider_color = color.normalized();
				this.options.slider_color1 = this.color_for_slider.normalized();
				this.options.base_color = this.options.current_color;
			
			} else if (this.options.mode === 3) {
				// Fixed Red
				color.rgb([255, this.options.current_color.g(), this.options.current_color.b()]);
				this.options.slider_color1 = color.normalized();
				color.red(0);
				this.options.slider_color2 = color.normalized();
				
			} else if (this.options.mode === 4) {
				// Fixed Green
				color.rgb([this.options.current_color.r(), 255, this.options.current_color.b()]);
				this.options.slider_color1 = color.normalized();
				color.green(0);
				this.options.slider_color2 = color.normalized();
				
			} else if (this.options.mode === 5) {
				// Fixed Blue
				color.rgb([this.options.current_color.r(), this.options.current_color.g(), 255]);
				this.options.slider_color1 = color.normalized();
				color.blue(0);
				this.options.slider_color2 = color.normalized();
				
			}
			
			this.palette_quad.parameters = {
				amount:     this.options.amount,
				base_color: this.options.base_color.normalized(),
				mode:       this.options.mode
			};
			
			this.palette_slider_quad.parameters = {
				amount:     this.options.slider_amount || 0,
				base_color: this.options.slider_color,
				color1:     this.options.slider_color1 || [0, 0, 0],
				color2:     this.options.slider_color2 || [0, 0, 0],
				mode:       this.options.mode + 6
			};
			
			this.palette_quad.draw();	
			this.palette_slider_quad.draw();
			
			this.container.trigger("change", [this.options.current_color]);
		}	
	}
	
};

