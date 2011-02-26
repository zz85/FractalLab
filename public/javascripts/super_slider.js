/**
 * Super Slider
 * Last update: 12 Jan 2011
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

/*global window, $, document*/

function SuperSlider(id, opts) {
	this.id = id;
	this.init(opts);
	
	return this.slider;
}

SuperSlider.prototype = {
	
	init: function (opts) {
		var self = this,
			opt,
			style;
	
		this.options =  { 
			slider_class   : 'ss_slider', // slider class name
			track_class    : 'ss_track',  // track class name
			handle_class   : 'ss_handle', // handle class name
			input_class    : 'ss_input',  // input class name
			label_class    : 'ss_label',  // label class name
			min            : 0,           // minimum value
			max            : 1,           // maximum value
			step           : 0.01,        // step increment
			"default"      : 0.5,         // default value
			decimal_places : 3,           // decimal place rounding
			label          : null,        // label
			name           : null,        // input name attribute
			hide_slider	   : false,		  // hide slider
			hide_input	   : false		  // hide slider
		};
		
		this.options = $.extend({}, this.options, opts);
		
		// console.log(this.options)
		// Build slider
		this.slider = $("<div>")
			.addClass(this.options.slider_class)
			.attr("id", this.id)
			.data("superslider", this)
			.css("webkitUserSelect", 'none');
	
		this.track  = $("<div>").addClass(this.options.track_class);
		this.handle = $("<div>").addClass(this.options.handle_class);
		
		this.input = $("<input>")
			.attr("type", this.options.hide_input ? "hidden" : "input")
			.addClass(this.options.input_class)
			.attr("name", this.options.name || this.id)
			.attr("value", this.options['default']);
		
		if (this.options.label) {
			this.label = $("<label>")
				.text(this.options.label)
				.addClass(this.options.label_class)
				.attr("title", "Click to reset to default");
			this.slider.append(this.label.get(0));
		}
	
		this.track.append(this.handle.get(0));
		this.slider.append(this.track.get(0));
		this.slider.append(this.input.get(0));
		
		if (this.options.hide_slider) {
			this.track.hide();
		}
		
		// Define event listeners
		this.mouseDown = function (event) {
			self.startDrag(event);
		};

		this.mouseMove = function (event) {
			self.onDrag(event);
		};

		this.mouseUp = function (event) {
			self.endDrag(event);
		};
	
		this.mouseOver = function (event) {
			self.infocus = true;
			event.stopPropagation();
		};
	
		this.mouseOut = function (event) {
			self.infocus = false;
			event.stopPropagation();
		};
	
		this.keyDown = function (event) {
			self.keyPress(event);
		};
	
		this.startEdit = function (event) {
			self.editing = true;
		};
	
		this.endEdit = function (event) {
			self.value(self.input.get(0).value);
			self.editing = false;
		};
	
		this.labelClick = function (event) {
			self.updateSlider(self.options['default']);
			return false;
		};
	
		this.slider.bind("DOMNodeInserted", function (event) {
			self.sliderInserted(event);
			self.initialised = true;
		});
		
		this.infocus = false;
		this.slider.data("slider", this);
	},
	
	
	// Slider inserted into the DOM and ready for action
	sliderInserted: function (event) {
		var self = this;
		
		// Little delay for Webkit before we query its styles
		window.setTimeout(function () {
			// Get computed style dimensions
			self.handle_width = parseInt(window.getComputedStyle(self.handle.get(0), null).getPropertyValue("width"), 10);
			self.track_width = parseInt(window.getComputedStyle(self.track.get(0), null).getPropertyValue("width"), 10) - self.handle_width;

			// Setup default value
			self.updateSlider(self.options['default']);

			if (self.label) {
				self.label.bind("click", self.labelClick);
			}

			self.track.bind("mousedown", self.mouseDown);
			self.track.bind("selectstart", function () { 
				return false;
			});
			self.slider.bind("mouseover", self.mouseOver);
			self.slider.bind("mouseout", self.mouseOut);
			self.input.bind("blur", self.endEdit);
			document.addEventListener("keydown", self.keyDown, false);
		}, 1);
		
	},

	value: function (v) {
		if (typeof v !== "undefined") {
			this.updateSlider(v);
		}
		return this.val;
	},
	
	
	// Update the slider and fire the change event
	updateSlider: function (value) {
		var v = Math.min(Math.max(value, this.options.min), this.options.max),
			val = this.round(parseFloat(v), this.options.decimal_places),
			pos = this.track_width * ((val - this.options.min) / (this.options.max - this.options.min));
		
		if (isNaN(val) || value === '') {
			// Invalid number, reset
			this.input.attr("value", this.val);
			this.input.get(0).value = this.val;
		} else {
			// Valid number
			this.handle.css("left", pos);
			this.val = val;
			this.input.attr("value", this.val);
			this.input.get(0).value = this.val;		// This way too therwise the field doesn't always update
			this.input.get(0).val = this.val;
			
			if (this.initialised && this.old_val !== this.val) {
				this.input.trigger("change");
				this.old_val = this.val;
			}
		}
	},
	
	
	startDrag: function (event) {
		// event.preventDefault();
		if (event.currentTarget === event.target) {
			// Clicked track
			this.ox = this.handle_width / 2;
			this.onDrag(event);
		} else {
			// Clicked handle
			this.ox = event.offsetX || event.layerX;
		}
	
		this.track.get(0).addEventListener("mousemove", this.mouseMove, false);
		$("body").bind("mouseup", this.mouseUp);
	},


	onDrag: function (event) {
		var x, v;
	
		if (event.currentTarget === event.target) {
			// track clicked
			x = event.offsetX || event.layerX;
		} else {
			// handle clicked
			x = event.target.offsetLeft + (event.offsetX || event.layerX);
		}
	
		x -= this.ox;
		v = (x / this.track_width) * (this.options.max - this.options.min);
	
		if (!event.altKey) {
			// Snap to step increments
			v = Math.floor(v / this.options.step) * this.options.step;
		}
	
		this.updateSlider(this.options.min + v);
	},


	endDrag: function (event) {
		this.track.get(0).removeEventListener("mousemove", this.mouseMove, false);
		$("body").unbind("mouseup", this.mouseUp);
	},
	
	
	keyPress: function (event) {
		var delta = 0,
			mult = 1;
		
		// event.preventDefault();
		
		if (this.infocus) {
			// console.log("key", event);
			if (event.shiftKey && event.altKey) {
				mult = 0.01;
			} else if (event.altKey) {
				mult = 0.1;
			} else if (event.shiftKey) {
				mult = 10;
			}
		
			switch (event.keyCode) {
			case 38:
				// Up arrow 38 - event.DOM_VK_UP
				this.value(this.val += this.options.step * mult);
				event.preventDefault();
				return false;
			case 40:
				// Down arrow 40 - event.DOM_VK_DOWN
				this.value(this.val -= this.options.step * mult);
				event.preventDefault();
				return false;
			case 13:
				// Enter pressed 13 - event.DOM_VK_RETURN
				this.input.get(0).blur();
				event.preventDefault();
				return false;
			}
		}
	
		return true;
	},

	round: function (v, n) {
		var exp = Math.pow(10, n || 1);
		return Math.round(v * exp) / exp;
	}
};


