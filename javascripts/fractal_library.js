/*global window, jQuery, document, $, console, FractalLab*/

var fractal_library = function (fractal_lab) {
	var fractal_index = new IndexedLocalStorage("shader_index", "shader_"),
		shader_index = [],
		current_title = ''
	
	// Show library on click
	$("#library_button").click(function (event) {
		event.preventDefault();
		$("#mode").val("auto");
		$("#library").toggle();
	});
	
	// Create the table rows for the shader listing
	function listShaders() {
		var tbody = $("table tbody"),
			idx = fractal_index.index();
		
		if ($("td", tbody).length > 1 || idx.length > 0) {
			tbody.html('');
		}
		
		$.each(idx, function (i, row) {
			var date = new Date(row.updated_at),
				shader = fractal_index.find(row.id),
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
			id = fractal_index.find_by_title(title);
		
		if (title && fractal_index.save(id, fractal_lab.params(title))) {
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
			shader = fractal_index.find(id);
		
		if (shader) {
			current_title = shader.title;
			fractal_lab.load(shader);
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
			fractal_index.destroy($(event.target).data("id"));
		}
		
		listShaders();
	});
	
	
	listShaders();
	
};