function SQLStore(options, callback) {
	this.options = $.extend({}, {db_name: 'fractal_lab', table_name: 'presets'}, options);
	
	return this.init(callback);
}

SQLStore.prototype = {
	init: function (callback) {
		var fields = [
				{name: 'title', type: 'string'},
				{name: 'params', type: 'text'},
				{name: 'vertex', type: 'text'},
				{name: 'fragment', type: 'text'},
				{name: 'thumbnail', type: 'mediumtext'},
				{name: 'created_at', type: 'datetime'},
				{name: 'updated_at', type: 'datetime'}
			];
		
		this.db = new SQLAdapter(this.options.db_name);
		
		if (this.db) {
			this.db.createTable(this.options.table_name, fields, true, callback);
		} else {
			return false;
		}
		
		return this;
	},
	
	
	index: function (callback) {
		this.query("SELECT * FROM `" + this.options.table_name + "` ORDER BY title ASC", [], callback);
	},
	
	
	find: function (id, callback) {
		this.query("SELECT * FROM `" + this.options.table_name + "` WHERE id = ?", [id], callback);
	},
	
	
	find_by_title: function (title, callback) {
	  this.query("SELECT * FROM `" + this.options.table_name + "` WHERE title = ?", [title], callback);
	},
	
	
	save: function (id, params, callback) {
	  if (id) {
	    this.update(id, params, callback);
	  } else {
	    this.create(params, callback);
	  }
	},
	
	create: function (params, callback) {
		var time = Date.now(),
			sql = "INSERT INTO `" + this.options.table_name + "` " +
				  "(title, params, vertex, fragment, thumbnail, created_at, updated_at) VALUES (?,?,?,?,?,?,?);";
		
		this.query(sql, [params.title, params.params, params.vertex, params.fragment, params.thumbnail, time, time], callback);
	},
	
	
	update: function (id, params, callback) {
		var time = Date.now(),
			sql = "UPDATE `" + this.options.table_name + "` " +
				  "SET title = ?, params = ?, vertex = ?, fragment = ?, thumbnail = ?, updated_at = ?" +
				  "WHERE id = ?";
		
		this.query(sql, [params.title, params.params, params.vertex, params.fragment, params.thumbnail, time, id], callback);
	},
	
	
	destroy: function (id, callback) {
		var time = Date.now(),
			sql = "DELETE FROM `" + this.options.table_name + "` " +
				  "WHERE id = ?";
		
		this.query(sql, [id], callback);
	},
	
	
	query: function (sql, values, callback) {
	  var self = this;
	  
		this.db.execute(sql, values, function (tx, results) {
			if (typeof callback === 'function') {
				callback(self.db.list(results));
			}
		});
	}
};

