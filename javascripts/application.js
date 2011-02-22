/**
 * Fractal lab application
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

/*global window, jQuery, document, $, console, FractalLab*/

var application = function () {
	
	var color_picker = new ColorPicker(
		{
			vertex_path: 'shaders/color_picker.vs',
			fragment_path: 'shaders/color_picker.fs',
			width: 128,
			height: 128
		}),
		fractal_lab = new FractalLab(
			$("#params"),
			{
				canvas: $("#canvas"),
				// vertex_path: 'shaders/3d_fractals.vs?' + Date.now(),
				// fragment_path: 'shaders/3d_fractals.fs?' + Date.now(),
				framerate: $("#average_fps"),
				color_picker: color_picker
			});
	
	$("#color_picker").append(color_picker);
	
	// Set fractal type
	$("#type_buttons a").click(function () {
		$("#type_buttons a").removeClass("active");
		$(this).addClass("active");
		fractal_lab.load_by_path(
			'shaders/' + this.id + '_fractals.vs?' + Date.now(),
			'shaders/' + this.id + '_fractals.fs?' + Date.now()
		);
	});
	
	$("#3d").trigger("click");
	
	// Fullscreen mode?
	if (document.documentElement.webkitRequestFullScreen || document.documentElement.requestFullScreen) {
		$("#fullscreen").click(function () {
			if (document.documentElement.webkitRequestFullScreen) {
				document.documentElement.webkitRequestFullScreen();
			} else if (document.documentElement.requestFullScreen) {
				document.documentElement.requestFullScreen();
			}
		});
	} else {
		$("#fullscreen").hide();
 	}
	
	
	// Help
	$("#help_button").click(function () {
		$("#help").toggle();
	});
	
	$("#help").click(function () {
		$("#help").hide();
	});
	
	
	// Save image
	$("#save_image").click(function () {
		var src = $("#canvas").get(0).toDataURL("image/png"),
			img = new Image();
		
		img.src = src;
		$("#render_panel p").after(img);
		$("#render_tab").trigger("click");
	});
	
	
	// Quick test, still TODO
	// $("#save_tiled_image").click(function () {
	// 	var src = $("#canvas").get(0).toDataURL("image/png"),
	// 		img = new Image(),
	// 		new_canvas = $("<canvas>").attr({width: 1200, height: 1200}).get(0),
	// 		context = new_canvas.getContext("2d");
	// 	
	// 	img.onload = function () {
	// 		context.drawImage(img, 400, 400);
	// 		window.open(new_canvas.toDataURL("image/png"));
	// 	};
	// 	
	// 	img.src = src;
	// 	
	// });
	
	
	fractal_library(fractal_lab);
	
};