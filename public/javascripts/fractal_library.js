/*global window, jQuery, document, $, console, FractalLab, IndexedLocalStorage, prompt, alert, confirm*/

var fractal_library = function (fractal_lab) {
	var fractal_index = new IndexedLocalStorage("shader_index", "shader_"),
		shader_index = [],
		current_title = '',
		presets3d = [
			{
				title: 'Menger Cube',
			 	params: '{"scale":1, "power":8, "surfaceSmoothness":0.6, "stepMultiplier":1, "boundingRadius":5, "offset":[0,0,0], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-31.5, "cameraYaw":-42.5, "cameraFocalLength":0.9, "cameraPosition":[1.910704,1.380376,-2.196909], "colorIterations":4, "color1":[1,1,1], "color1Intensity":0.57, "color2":[0.6666666666666666,0.792156862745098,0.8117647058823529], "color2Intensity":1.16, "color3":[1,0.53,0], "color3Intensity":0.57, "transparent":false, "gamma":1, "light":[-16,100,-60], "ambientColor":[0.5,0.3], "background1Color":[0,0.46,0.8], "background2Color":[0,0,0], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.12, "outerGlowColor":[1,1,1], "outerGlowIntensity":0, "fog":0, "fogFalloff":0, "specularity":0.8, "specularExponent":4, "size":[400,257], "aoIntensity":0.09, "aoSpread":4.6, "objectRotation":[1,0,0,0,1,0,0,0,1], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "boxScale":0.5, "boxFold":1, "radiolariaFactor":0, "radiolaria":0, "dE":"MengerSponge", "maxIterations":8, "stepLimit":60, "aoIterations":4, "antialiasing":false, "_objectRotation":[0,0,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			},
			{
				title: 'Sphere Sponge',
				params: '{"scale":4, "power":8, "surfaceSmoothness":0.6, "stepMultiplier":1, "boundingRadius":40, "offset":[0,0,0], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-16, "cameraYaw":43, "cameraFocalLength":0.9, "cameraPosition":[-0.788623,-0.682783,0.171216], "colorIterations":2, "color1":[1,1,1], "color1Intensity":0.48, "color2":[0,0.53,0.8], "color2Intensity":0.44, "color3":[1,0.53,0], "color3Intensity":0.36, "transparent":false, "gamma":1, "light":[-16,100,-60], "ambientColor":[0.31,0.42], "background1Color":[0.9882352941176471,0.8117647058823529,0.44313725490196076], "background2Color":[0,0,0], "innerGlowColor":[0.8588235294117647,0.803921568627451,0.7725490196078432], "innerGlowIntensity":0.14, "outerGlowColor":[1,1,1], "outerGlowIntensity":0, "fog":0.17, "fogFalloff":0, "specularity":0.8, "specularExponent":4, "size":[400,257], "aoIntensity":0.15, "aoSpread":4.8, "objectRotation":[1,0,0,0,1,0,0,0,1], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":2.05, "boxScale":0.5, "boxFold":1, "radiolariaFactor":0, "radiolaria":0, "dE":"SphereSponge", "maxIterations":7, "stepLimit":60, "aoIterations":4, "antialiasing":false, "_objectRotation":[0,0,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			},
			{
				title: 'Mandelbox',
				params: '{"scale":2, "power":8, "surfaceDetail":0.4, "surfaceSmoothness":1, "boundingRadius":114.02, "offset":[0,0,0], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-35, "cameraYaw":-37.5, "cameraFocalLength":0.9, "cameraPosition":[8.514214,8.706627,-11.932482], "colorIterations":3, "color1":[0.0315625,0.0315625,0.0315625], "color1Intensity":0.96, "color2":[0.9803921568627451,0.7843137254901961,0.0196078431372549], "color2Intensity":1.26, "color3":[1,1,1], "color3Intensity":0.51, "transparent":false, "gamma":0.99, "light":[48,191,-198], "ambientColor":[0.41,0], "background1Color":[0.7450980392156863,0.9450980392156862,0.9372549019607843], "background2Color":[0,0,0], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.13, "outerGlowColor":[1,1,1], "outerGlowIntensity":0, "fog":0, "fogFalloff":0, "specularity":0.86, "specularExponent":7.5, "size":[1020,822], "aoIntensity":0.15, "aoSpread":8.8, "objectRotation":[1,0,0,0,1,0,0,0,1], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "boxScale":0.5, "boxFold":1, "juliaFactor":0, "radiolariaFactor":0, "radiolaria":0, "dE":"Mandelbox", "maxIterations":12, "stepLimit":105, "shadowSteps":10, "aoIterations":3, "antialiasing":false, "_objectRotation":[0,0,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			},
			{
				title: 'Mandelbulb',
				params: '{"scale":1, "power":8, "surfaceSmoothness":0.59, "stepMultiplier":1, "boundingRadius":5.09, "offset":[0,0,0], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-22, "cameraYaw":1, "cameraFocalLength":0.9, "cameraPosition":[-0.113937,0.913814,-2.31178], "colorIterations":6, "color1":[1,1,1], "color1Intensity":0.66, "color2":[0.6666666666666666,0.792156862745098,0.8117647058823529], "color2Intensity":0.3, "color3":[1,0.53,0], "color3Intensity":0.6, "transparent":false, "gamma":1, "light":[174,210,-66], "ambientColor":[0.44,0.5], "background1Color":[0.8509803921568627,0.803921568627451,0.611764705882353], "background2Color":[0.09411764705882353,0.15294117647058825,0.1568627450980392], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.12, "outerGlowColor":[1,1,1], "outerGlowIntensity":0, "fog":0.06, "fogFalloff":0, "specularity":0.81, "specularExponent":4.5, "size":[860,554], "aoIntensity":0.1, "aoSpread":4.6, "objectRotation":[1,0,0,0,-0.19936793441719705,-0.9799247046208296,0,0.9799247046208296,-0.19936793441719705], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "boxScale":0.5, "boxFold":1, "radiolariaFactor":0, "radiolaria":0, "dE":"Mandelbulb", "maxIterations":8, "stepLimit":60, "aoIterations":4, "antialiasing":false, "_objectRotation":[101.5,0,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			},
			{
				title: 'Sierpinski octahedron',
				params: '{"scale":2, "power":8, "surfaceSmoothness":0.6, "stepMultiplier":1, "boundingRadius":5, "offset":[1,0,0], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-10, "cameraYaw":-11.5, "cameraFocalLength":0.9, "cameraPosition":[0.452288,0.41647,-1.896852], "colorIterations":4, "color1":[1,1,1], "color1Intensity":0.45, "color2":[0,0.53,0.8], "color2Intensity":0.3, "color3":[1,0.53,0], "color3Intensity":0, "transparent":false, "gamma":1, "light":[-16,100,-60], "ambientColor":[0.5,0.3], "background1Color":[0,0.46,0.8], "background2Color":[0,0,0], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.1, "outerGlowColor":[1,1,1], "outerGlowIntensity":0, "fog":0, "fogFalloff":0, "specularity":0.8, "specularExponent":4, "size":[400,259], "aoIntensity":0.11, "aoSpread":4.8, "objectRotation":[1,0,0,0,1,0,0,0,1], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "boxScale":0.5, "boxFold":1, "radiolariaFactor":0, "radiolaria":0, "dE":"OctahedralIFS", "maxIterations":8, "stepLimit":60, "aoIterations":4, "antialiasing":false, "_objectRotation":[0,0,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			},
			{
				title: 'Sierpinski dodecahedron',
				params: '{"scale":2.7, "power":8, "surfaceDetail":1.22, "surfaceSmoothness":0.53, "boundingRadius":6.09, "offset":[1,1,1], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-6.5, "cameraYaw":-17.5, "cameraFocalLength":0.9, "cameraPosition":[1.093726,0.628911,-3.908039], "colorIterations":4, "color1":[1,1,1], "color1Intensity":0.45, "color2":[0,0.53,0.8], "color2Intensity":0.3, "color3":[1,0.53,0], "color3Intensity":0, "transparent":false, "gamma":1, "light":[-66,162,-30], "ambientColor":[0.5,0.3], "background1Color":[0,0.46,0.8], "background2Color":[0,0,0], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.1, "outerGlowColor":[1,1,1], "outerGlowIntensity":0.02, "fog":0.01, "fogFalloff":0, "specularity":0.8, "specularExponent":4, "size":[1020,822], "aoIntensity":0.16, "aoSpread":10.6, "objectRotation":[0.30901699437494745,0,0.9510565162951535,0,1,0,-0.9510565162951535,0,0.30901699437494745], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "boxScale":0.5, "boxFold":1, "juliaFactor":0, "radiolariaFactor":0, "radiolaria":0, "dE":"DodecahedronIFS", "maxIterations":8, "stepLimit":60, "shadowSteps":10, "aoIterations":4, "antialiasing":false, "_objectRotation":[0,72,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			},
			{
				title: 'Sierpinski icosahedron',
				params: '{"scale":2, "power":8, "surfaceDetail":1.22, "surfaceSmoothness":0.53, "boundingRadius":6.09, "offset":[0.61,0,0.99], "shift":[0,0,0], "cameraRoll":0, "cameraPitch":-15.5, "cameraYaw":-16.5, "cameraFocalLength":0.9, "cameraPosition":[0.678432,0.696559,-2.590894], "colorIterations":4, "color1":[1,1,1], "color1Intensity":0.45, "color2":[0,0.53,0.8], "color2Intensity":0.3, "color3":[1,0.53,0], "color3Intensity":0, "transparent":false, "gamma":1, "light":[-66,162,-30], "ambientColor":[0.5,0.3], "background1Color":[0,0.46,0.8], "background2Color":[0,0,0], "innerGlowColor":[0,0.6,0.8], "innerGlowIntensity":0.1, "outerGlowColor":[1,1,1], "outerGlowIntensity":0.02, "fog":0.01, "fogFalloff":0, "specularity":0.8, "specularExponent":4, "size":[1020,822], "aoIntensity":0.16, "aoSpread":10.6, "objectRotation":[0.26723837607825696,0,0.963630453208623,0.48907942272058585,0.8616291604415258,-0.13563372791503553,-0.8302920983740328,0.5075383629607041,0.23026037761806528], "fractalRotation1":[1,0,0,0,1,0,0,0,1], "fractalRotation2":[1,0,0,0,1,0,0,0,1], "depthMap":false, "sphereHoles":4, "sphereScale":1, "boxScale":0.5, "boxFold":1, "juliaFactor":0, "radiolariaFactor":0, "radiolaria":0, "dE":"DodecahedronIFS", "maxIterations":8, "stepLimit":60, "shadowSteps":10, "aoIterations":4, "antialiasing":false, "_objectRotation":[30.5,74.5,0], "_fractalRotation1":[0,0,0], "_fractalRotation2":[0,0,0], "stepSpeed":0.5}'
			}
			
		],
		presets2d = [
			{
				title: 'Mandelbrot steps',
				params: '{"scale":2, "power":2, "bailout":11.1, "minIterations":1, "juliaMode":false, "offset":[0.36,0.06], "colorMode":1, "bailoutStyle":0, "colorScale":1.4, "colorCycle":8.6, "colorCycleOffset":0, "colorCycleMirror":true, "hsv":true, "iterationColorBlend":1, "colorIterations":4, "color1":[0.8588235294117647,0.21568627450980393,0.0196078431372549], "color2":[0.8941176470588236,0.9607843137254902,0.8470588235294118], "color3":[0.01578125,0.01578125,0.01578125], "gamma":1.2, "rotation":0, "cameraPosition":[0.396367,-0.133508,0.00219], "size":[1020,822], "dE":"Mandelbrot", "maxIterations":164, "antialiasing":false, "stepSpeed":0.5}'
			},
			{
				title: 'Julia set',
				params: '{"scale":2, "power":3, "bailout":9.1, "minIterations":1, "juliaMode":true, "offset":[-0.121,0.799,0.59], "colorMode":0, "bailoutStyle":0, "colorScale":10, "colorCycle":2, "colorCycleOffset":0, "colorCycleMirror":true, "hsv":true, "iterationColorBlend":1.49, "colorIterations":4, "color1":[1,1,1], "color2":[0.01568627450980392,0.4745098039215686,0.7254901960784313], "color3":[0.00784313725490196,0.00392156862745098,0], "gamma":1, "rotation":0, "cameraPosition":[-0.009946,0.201874,-2.275821], "size":[1020,822], "dE":"DodecahedronIFS", "maxIterations":188, "antialiasing":false, "stepSpeed":0.5}'
			},
			{
				title: 'Checker',
				params: '{"scale":2, "power":2, "bailout":4, "minIterations":1, "juliaMode":false, "offset":[0.36,0.06], "colorMode":3, "bailoutStyle":0, "colorScale":2.8, "colorCycle":1, "colorCycleOffset":0, "colorCycleMirror":false, "hsv":false, "iterationColorBlend":2.47, "colorIterations":4, "color1":[1,1,1], "color2":[0,0.53,0.8], "color3":[0,0,0], "gamma":1, "rotation":-90, "cameraPosition":[-0.101591,0.648791,3.39984], "size":[400,322], "dE":"Mandelbrot", "maxIterations":80, "antialiasing":false, "stepSpeed":0.5}'
			},
			{
				title: 'Contour valley',
				params: '{"scale":2, "power":2, "bailout":11.1, "minIterations":1, "juliaMode":false, "offset":[0.36,0.06], "colorMode":4, "bailoutStyle":3, "colorScale":0, "colorCycle":8.6, "colorCycleOffset":0, "colorCycleMirror":false, "hsv":false, "iterationColorBlend":1.62, "colorIterations":4, "color1":[0.8588235294117647,0.21568627450980393,0.0196078431372549], "color2":[0.8941176470588236,0.9607843137254902,0.8470588235294118], "color3":[0.00784313725490196,0.00392156862745098,0.00392156862745098], "gamma":1.03, "rotation":0, "cameraPosition":[-0.722524,0.344711,0.000982], "size":[1020,822], "dE":"Mandelbrot", "maxIterations":132, "antialiasing":false, "stepSpeed":0.5}'
			}
		
		];
	
	
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
	function installPresets (sources, presets) {
		var timeout;
		
		$.each(presets, function (idx, preset) {
			var id = fractal_index.find_by_title(preset.title);

			if (!fractal_index.find_by_title(preset.title)) {
				console.log("Loaded", preset.title);
				
				try {
					params = JSON.parse(preset.params);
				} catch (e) {
					console.log("error adding preset", preset.title);
				}
				
				fractal_index.save(null, {
					title: preset.title,
					vertex: sources.vertex,
					fragment: sources.fragment,
					params: params
				});
				
				window.clearTimeout(timeout);
				timeout = window.setTimeout(listShaders, 500);
			}
		});
	}
	
	
	// Add the presets
	loadShaders([{path: '3d_fractals.vs', type: 'vertex'}, {path: '3d_fractals.fs', type: 'fragment'}], presets3d);
	loadShaders([{path: '2d_fractals.vs', type: 'vertex'}, {path: '2d_fractals.fs', type: 'fragment'}], presets2d);
	
	
	
	// Show library on click
	$("#library_button").click(function (event) {
		event.preventDefault();
		$("#mode").val("auto");
		
		if ($("#library:visible").length > 0) {
			$("#library_button").text("Fractal library");
			$("#library").hide();
		} else {
			$("#library_button").text("Close");
			$("#library").show();
		}
		
	});
	
	// Create the table rows for the shader listing
	function listShaders() {
		var tbody = $("table tbody"),
			idx;
		
		idx = _.sortBy(fractal_index.index(), function (item) {
			return item.title.toLowerCase();
		});
		
		if ($("td", tbody).length > 1 || idx.length > 0) {
			tbody.html('');
		}
		
		$.each(idx, function (i, row) {
			var date = new Date(row.updated_at),
				shader = fractal_index.find(row.id),
				tr = $("<tr>")
					.addClass(row.title === current_title ? "updated" : '')
					.append($("<td>")
						.addClass("shader_title")
						.append($("<a>")
							.data("id", row.id)
							.attr("title", "cmd + click to only load parameters")
							.text(row.title))
						.append($("<span>")
							.addClass("more")
							.text("[+]"))
						.append($("<textarea>")
							.addClass("params")
							.text(JSON.stringify(shader.params).replace(/,"/g, ", \""))))
					.append($("<td>")
						.addClass("shader_date")
						.text(date.toDateString() + ", " + date.toLocaleTimeString()))
					.append($("<td>")
						.data("id", row.id)
						.attr("title", "Click to delete")
						.addClass("shader_destroy")
						.html("&#x2716;"));
			
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
			id = fractal_index.find_by_title(title);
		
		if (title && fractal_index.save(id, fractal_lab.params(title))) {
			current_title = title;
			listShaders();
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
	
	
	$("#apply_paste").click(function (event) {
		event.preventDefault();
		
		var params;
		
		try {
			params = JSON.parse($("#paste_input").val());
			fractal_lab.load({
				title: current_title,
				vertex: $("#vertex_code").val(),
				fragment: $("#fragment_code").val(),
				params: params
			});
			$("#paste_block").hide();
			$("#paste_input").val("");
			$("#library_button").text("Fractal library");
			$("#library").hide();
			
		} catch (e) {
			alert(e);
		}
		
	});
	
	
	// Loading a new shader
	$(".shader_title a").live("click", function (event) {
		event.preventDefault();
		
		var id = $(event.target).data("id"),
			shader = fractal_index.find(id);
		
		if (shader) {
			current_title = shader.title;
			
			if (event.metaKey) {
			  console.log("Meta key");
			  shader.fragment = $("#fragment_code").val();
			  shader.vertex = $("#vertex_code").val();
			}
			
			fractal_lab.load(shader);
			$("#library").hide();
			$("#image_tab").trigger("click");
			$("#library_button").text("Fractal library");
			
		} else {
			console.log("Could not find", id);
		}
	});
	
	
	$(".more").live("click", function (event) {
		var more = $(event.target);
		event.preventDefault();
		
		if (more.text() === "[+]") {
			more.text("[-]");
			more.next().show().focus().get(0).select();
		} else {
			more.text("[+]");
			more.next().hide();
		}
	});
	
	
	// Destroy shader
	$(".shader_destroy").live("click", function (event) {
		event.preventDefault();
		
		if (confirm("Are you sure you want to delete this?")) {
			console.log("delete", $(event.target).data("id"));
			fractal_index.destroy($(event.target).data("id"));
		}
		
		listShaders();
	});
	
	
	listShaders();
	
};