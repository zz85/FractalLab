/*global window, jQuery, document, $, console, FractalLab, ColorPicker, Image, fractal_library*/

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
				framerate: $("#average_fps"),
				color_picker: color_picker,
				ready_callback: function () {
					$("#library").trigger("load_presets");
				}
			});
	
	$("#color_picker").append(color_picker);
	
	
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
	
	
	// Code editors
	$("#vertex_code, #fragment_code")
		.change(function () {
			$("#compile").addClass("enabled");
		})
		.bind("keydown", function (event) {
			// console.log(event.which);
			var input = $(event.target),
				output,
				s,
				s1 = input[0].selectionStart,
				s2 = input[0].selectionEnd;

			if (event.which === 9) {
				// Insert tab
				output = input.val().substring(0, s1) + "    " + input.val().substring(s2);
				input.val(output);
				input[0].setSelectionRange(s1 + 4, s1 + 4);
				input.focus();
				event.preventDefault();
			}

			$("#compile").addClass("enabled");
		})
		.bind("scroll", function (event) {
			$(event.target).data("scrollTop", event.target.scrollTop);
		});
	
	
	// Tab menu
	$("#menu .image_tab, #menu .code_tab")
		.click(function (event) {
			var tab = $(event.target),
				panel = $("#" + tab.data("for")),
				textarea = $("textarea", panel);

			if (!tab.hasClass("active")) {
				$("#menu a").removeClass("active");
				tab.addClass("active");

				$(".panel").hide();

				panel.show();

				if (textarea.length > 0) {
					textarea.attr("scrollTop", textarea.data("scrollTop"));
				}
			}

			fractal_lab.interacting(tab.data("for") === 'stage');
			return false;
		});
	
	
	// Save image
	$("#save_image").click(function (event) {
		event.preventDefault();

		if ($("body").hasClass("ready")) {
			var img = new Image();

			img.src = fractal_lab.canvas().toDataURL("image/png");

			$("#render_panel p").after(img);
			$("#render_tab").trigger("click");
		}
	});
	
	
	
	// GL rendering events
	$("#canvas")
		.bind("before_compile", function () {
			// The main shader compiling starts a little after this
			$("#compiling").show();
		})
		.bind("ready", function () {
			// Called after successful compile
			fractal_lab.init();
	
			$("#log").text("Shader compiled ok.");
			$("#image_tab").trigger("click");
			
			$("#compiling").hide();
			$("#compile").text("Recompile");
			$("body").addClass("ready");
			$("#menu a:first").trigger("click");
			
			
			// Recompile button
		   	$("#compile")
				.unbind("click")
		   		.click(function (event) {
		   			if ($(this).hasClass("enabled")) {
		   				fractal_lab.recompile();
		   			}
		   			return false;
		   		});
		})
		.bind("loaded", function (event) {
			// console.log("loaded shaders");
		})
		.bind("error", function (event) {
			$("#log").text($(event.target).data("GLQuad").error);
			$("#compiling").hide();
			$("#log_tab").trigger("click");
			$("#compile").addClass("enabled");
		});
	
	
	
	// Set fractal type
	$("#type_buttons a").click(function () {
		$("#type_buttons a").removeClass("active");
		$(this).addClass("active");
		
		fractal_lab.load_by_path(
			'shaders/' + this.id + '_fractals.vs?' + Date.now(),
			'shaders/' + this.id + '_fractals.fs?' + Date.now()
		);
	});
	
	
	// Help
	$("#help_button").click(function () {
		$("#help").toggle();
	});
	
	$("#help").click(function (event) {
		if (!$(event.target).is("a")) {
			$("#help").hide();
		}
	});
	
	
	// Render button
	$("#compile")
		.click(function (event) {
			$("#3d").trigger("click");
			$("#compile").unbind("click");
			return false;
		});
	
	
	// Main body click kicks it all off
	$("body").click(function (event) {
		if (!event.target.href || !event.target.href.match(/^http\:\/\//)) {
			$("body")
				.removeClass("initialising")
				.unbind("click");
			$("#help").hide();
		}
	});
	
	
	// Initalise the fractal library
	fractal_library(fractal_lab);
};