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
	
	var colorPicker = new ColorPicker(
		{
			vertex_path: 'shaders/color_picker.vs',
			fragment_path: 'shaders/color_picker.fs',
			width: 128,
			height: 128
		}),
		fractalLab = new FractalLab(
			$("#params"),
			{
				canvas: $("#canvas"),
				vertex_path: 'shaders/3d_fractals.vs?' + Date.now(),
				fragment_path: 'shaders/3d_fractals.fs?' + Date.now(),
				framerate: $("#average_fps"),
				color_picker: colorPicker
			}),
		fractalLibrary = new IndexedLocalStorage("shader_index", "shader_"),
		shader_index = [],
		current_title = '';
	
	$("#color_picker").append(colorPicker);
	
	
	// Set fractal type
	$("#type_buttons a").click(function () {
		$("#type_buttons a").removeClass("active");
		$(this).addClass("active");
		// fractalLab = loadFractalType(this.id);
	});
	
	$("#3d").trigger("click");
	
	
	
	
	
	if (fractalLibrary) {
		// Show library on click
		$("#library_button").click(function (event) {
			event.preventDefault();
			$("#mode").val("auto");
			$("#library").toggle();
		});
		
		// Create the table rows for the shader listing
		function listShaders() {
			var tbody = $("table tbody"),
				idx = fractalLibrary.index();
			
			if ($("td", tbody).length > 1 || idx.length > 0) {
				tbody.html('');
			}
			
			$.each(idx, function (i, row) {
				var date = new Date(row.updated_at),
					shader = fractalLibrary.find(row.id),
					tr = $("<tr>")
						.addClass(row.title == current_title ? "updated" : '')
						.append($("<td>")
							.addClass("shader_title")
							.append($("<a>")
								.data("id", row.id)
								.text(row.title))
							.append($("<span>")
								.addClass("more")
								.text("[+]"))
							.append($("<textarea>")
								.addClass("params")
								.text(JSON.stringify(shader.params).replace(/,"/g, ", \""))))
						.append($("<td>")
							.addClass("shader_date")
							.text(date.toLocaleString()))
						.append($("<td>")
							.data("id", row.id)
							.attr("title", "Click to delete")
							.addClass("shader_destroy")
							.text("✖"));
				
				tbody.append(tr);
			});
			
			window.setTimeout(function () {
				$("tr", tbody).removeClass("updated");
			}, 1);
		}
		
		
		
		// Handle the save button click
		$(".save").click(function (event) {
			event.preventDefault();
			
			var title = prompt("Enter a title for the fractal:", current_title),
				id = fractalLibrary.find_by_title(title);
			
			if (title && fractalLibrary.save(id, fractalLab.params(title))) {
				current_title = title;
				listShaders();
			}
		});
		
		
		
		// Show paste params
		$("#paste_params").click(function (event) {
			event.preventDefault();
			
			$("#paste_input").val("");
			
			if ($("#paste_block:visible").length > 0) {
				$("#paste_block").hide();
			} else {
				$("#paste_block").show().focus();
			}
		});
		
		$("#cancel_paste").click(function (event) {
			event.preventDefault();
			
			$("#paste_block").hide();
			$("#paste_input").val("");
		});
		
		$("#apply_paste").click(function (event) {
			event.preventDefault();
			
			var params;
			
			try {
				params = JSON.parse($("#paste_input").val());
				fractalLab.load({
					title: current_title,
					vertex: $("#vertex_code").val(),
					fragment: $("#fragment_code").val(),
					params: params
					});
				$("#paste_block").hide();
				$("#paste_input").val("");
				$("#library").hide();
				
			} catch(e) {
				alert(e);
			}
			
		});
		
		
		// Loading a new shader
		$(".shader_title a").live("click", function (event) {
			event.preventDefault();
			
			var id = $(event.target).data("id"),
				shader = fractalLibrary.find(id);
			
			if (shader) {
				current_title = shader.title;
				fractalLab.load(shader);
				$("#library").hide();
				
			} else {
				console.log("Could not find", id)
			}
		});
		
		$(".more").live("click", function (event) {
			var more = $(event.target);
			event.preventDefault();
			
			if (more.text() === "[+]") {
				more.text("[-]");
				more.next().show();
			} else {
				more.text("[+]");
				more.next().hide()
			}
		});
		
		
		// Destroy shader
		$(".shader_destroy").live("click", function (event) {
			event.preventDefault();
			
			if (confirm("Are you sure you want to delete this?")) {
				console.log("delete", $(event.target).data("id"))
				fractalLibrary.destroy($(event.target).data("id"));
			}
			
			listShaders();
		});
		
		listShaders();
		
	} else {
		// LocalStorage for library not supported
		$("#library_button").hide();
	}
	
	
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
	
};