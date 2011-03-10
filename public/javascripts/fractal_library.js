/*jslint nomen: false*/
/*global window, jQuery, document, $, console, FractalLab, IndexedLocalStorage, prompt, alert, confirm, _, PresetManager, Image, localStorage*/
var LIBRARY_VERSION = 2;

var fractal_library = function (fractal_lab) {
	var fractal_index,
		shader_index = [],
		current_title = '',
		self = this,
	
		// Initialise preset manager
		preset_manager = new PresetManager(function (tx, results) {
			checkPresets();
		});
	
	
	// Load presets if we haven't yet used Fractal Lab
	function checkPresets() {
		if (localStorage.getItem("fractal_lab_initialised") === 'true') {
			localStorage.setItem("fractal_lab_initialised", 1);
		}
		
		if (parseInt(localStorage.getItem("fractal_lab_initialised") * 1) < LIBRARY_VERSION) {
			// console.log("load presets library version", LIBRARY_VERSION);
			loadPresets("javascripts/presets.js");
		} else {
			listShaders();
		}
	}
	
	
	function loadPresets(path) {
		$.ajax({
			url: path, 
			dataType: 'script',
			headers: {"Access-Control-Allow-Origin": "*"},
			success: function (data, textStatus, jqXHR) {
				
				// Add the presets
				loadShaders([{path: '3d_fractals.vs', type: 'vertex'}, {path: '3d_fractals.fs', type: 'fragment'}], presets.presets3d);
		    	loadShaders([{path: '2d_fractals.vs', type: 'vertex'}, {path: '2d_fractals.fs', type: 'fragment'}], presets.presets2d);
				
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log(textStatus, errorThrown);
			}
		});
	}
	
	
	// Load shaders required by the presets
	function loadShaders(shaders, presets) {
		var loaded = 0,
			sources = {};
		
		$.each(shaders, function (i, shader) {
			$.ajax({
				url: "shaders/" + shader.path, 
				dataType: 'text',
				headers: {"Access-Control-Allow-Origin": "*"},
				success: function (data, textStatus, jqXHR) {
					loaded += 1;
					sources[shader.type] = data;
					
					if (loaded === shaders.length) {
						installPresets(sources, presets);
					}
				}
			});
		});
	}
	
	
	// Install presets if not already present
	function installPresets(sources, presets) {
		var ix = 0,
			next = function () {
				if (ix >= presets.length) {
					// No more presets to check, so load the listing now
					localStorage.setItem("fractal_lab_initialised", LIBRARY_VERSION);
					listShaders();
					return;
				}
				
				var preset = presets[ix],
					params;
				
				preset_manager.find_by_title(preset.title, function (rs) {
					if (rs.length === 0) {
						try {
							params = JSON.parse(preset.params);
						} catch (e) {
							console.log("error adding preset", preset.title);
						}
						
						preset_manager.save(null,
							{
								title: preset.title,
								vertex: sources.vertex,
								fragment: sources.fragment,
								thumbnail: preset.thumbnail || null,
								params: JSON.stringify(params)
							},
							function () {
								_.defer(next);
							}
						);
					} else {
						ix += 1;
						_.defer(next);
					}
				});
			
				ix += 1;
			};
		
		_.defer(next);
	}
	
	
	// Show library on click
	$("#library_button").click(function (event) {
		event.preventDefault();
		$("#mode").val("auto");
		
		if ($("#library:visible").length > 0) {
			$("#library_button").text("Fractal library");
			$("#paste_block").hide();
			$("#paste_input").val("");
			$("#library").hide();
		} else {
			$("#library_button").text("Close");
			$("#library").show();
			
			$("#library_list").attr("scrollTop", $("#library_list").data("scrollTop") || 0);
		}
		
	});
	
	// Create the table rows for the shader listing
	function listShaders() {
		
		var presets = $("#presets"),
			buildList = function (rs) {
				presets.html("");
				
				if (rs.length === 0) {
					// Extra check for missing presets
					localStorage.setItem("fractal_lab_initialised", false);
					loadPresets("javascripts/presets.js");
					return false;
				}
				
				$.each(rs, function (i, row) {
					
					var date = new Date(row.updated_at),
						img = new Image(),
						div = $("<div>")
							.addClass("preset")
							.addClass(row.title === current_title ? "updated" : '')
							.append($("<a>")
								.data("id", row.id)
								.attr({title: "cmd + click to only load parameters"})
								.addClass("thumbnail").html("&nbsp;"))
							.append($("<div>")
								.addClass("preset_title")
								.append($("<a>")
									.data("id", row.id)
									.attr("title", "Click to delete")
									.addClass("destroy")
									.html("[-]"))
								.append($("<a>")
									.data("id", row.id)
									.attr("title", "Click to show params for copying")
									.addClass("more")
									.text("[+]"))
								.append($("<a>")
									.addClass("title")
									.data("id", row.id)
									.attr({title: "cmd + click to only load parameters"})
									.text(row.title))
								.append($("<textarea>")
									.addClass("params")
									.text((row.params || "").replace(/,"/g, ", \"")))
								);
					
					
					if (row.thumbnail) {
						img.onload = function () {
							$(".thumbnail", div).html(img);
						};

						img.src = row.thumbnail;
					}

					presets.append(div);
				});
				
			};
		
		preset_manager.all(buildList);
		
	}
	
	
	// Handle the save button click
	$("#save_fractal, #save").click(function (event) {
		event.preventDefault();
		
		if ($("body").hasClass("ready")) {
			
			var title = prompt("Enter a title for the fractal:", current_title),
				afterPresetSave = function () {
					current_title = title;
					listShaders();
				},
				savePreset = function (rs) {
					// console.log("save preset", title, rs)
					if (rs[0] && current_title !== title) {
						if (!confirm("Replace '" + title + "' in the library?")) {
							return;
						}
					}
				
					preset_manager.save(rs[0] && rs[0].id, fractal_lab.params(title), afterPresetSave);
				};
			
			preset_manager.find_by_title(title, savePreset);
		}
	});
	
	
	
	// Show paste params
	$("#paste_params").click(function (event) {
		event.preventDefault();
		
		if ($("#paste_block:visible").length > 0) {
			$("#paste_block").hide();
		} else {
			$("#paste_block").show().focus();
			$("#paste_input").val('').focus();
			$("#library_list").attr("scrollTop", 0);
		}
	});
	
	
	$("#cancel_paste").click(function (event) {
		event.preventDefault();
		
		$("#paste_block").hide();
		$("#paste_input").val("");
	});
	
	
	
	function loadFractal(shader) {
		fractal_lab.load(shader);
		
		$("#paste_block").hide();
		$("#paste_input").val("");
		$("#image_tab").trigger("click");
		$("#library").hide();
		$("#library_button").text("Fractal library");
		$("#type_buttons a").removeClass("active");
		
		if (typeof(shader.params.cameraPitch) !== 'undefined') {
			$("#3d").addClass("active");
		} else {
			$("#2d").addClass("active");
		}
	}
	
	
	
	$("#apply_paste").click(function (event) {
		event.preventDefault();
		var shader;
		
		try {
			shader = {
				title: current_title,
				vertex: $("#vertex_code").val(),
				fragment: $("#fragment_code").val(),
				params: JSON.parse($("#paste_input").val())
			};
		} catch (e) {
			alert(e);
			return;
		}
		
		loadFractal(shader);
		
	});
	
	
	// Loading a new shader
	$(".preset a.title, .preset a.thumbnail").live("click", function (event) {
		event.preventDefault();
		
		var id = $(event.currentTarget).data("id");
		
		preset_manager.find(id, function (rs) {
			var shader = rs[0];
			
			if (shader) {
				current_title = shader.title;
				
				try {
					shader.params = JSON.parse(shader.params);
				} catch (e) {
					console.error("JSON error", e, shader.params);
					alert("Error loading fractal");
					return;
				}
				
				// Load just the presets with the current GLSL code
				if (event.metaKey) {
					shader.fragment = $("#fragment_code").val();
					shader.vertex = $("#vertex_code").val();
				}

				loadFractal(shader);
				
			} else {
				console.log("Could not find", id);
			}
		});
		
		
	});
	
	
	$(".more").live("click", function (event) {
		var params = $("textarea", $(event.target).parent());
		event.preventDefault();
		
		$("#paste_block").show();
		$("#paste_input").val(params.val()).focus();
		$("#library_list").attr("scrollTop", 0);
	});
	
	
	// Destroy shader
	$(".destroy").live("click", function (event) {
		event.preventDefault();
		
		if (confirm("Are you sure you want to delete this?")) {
			// console.log("delete", $(event.target).data("id"));
			preset_manager.destroy($(event.target).data("id"), listShaders);
		}
	});
	
	
	// Track scroll position
	$("#library_list").bind("scroll", function (event) {
		$(event.target).data("scrollTop", event.target.scrollTop);
	});
	
	
};