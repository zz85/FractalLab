function ShaderLabDB(options) {
	this.options = $.extend({}, {db_name: 'shaderlab', table_name: 'shaders'}, options);
	this.shaders = [];
	
	return this.init();
}

ShaderLabDB.prototype = {
	init: function () {
		var fields = [
				{name: 'title', type: 'string'},
				{name: 'params', type: 'text'},
				{name: 'vertex', type: 'text'},
				{name: 'fragment', type: 'text'},
				{name: 'created_at', type: 'datetime'},
				{name: 'updated_at', type: 'datetime'}
			];
		
		this.db = new SQLStore(this.options.db_name);
		
		if (this.db) {
			db.createTable(this.options.table_name, fields);
		} else {
			return false;
		}
		
		return this;
	},
	
	
	index: function (order, callback) {
		this.query("SELECT * FROM `" + this.options.table_name + "` ORDER BY `" + (order || 'updated_at') + "` DESC", [], callback);
	},
	
	
	show: function (id, callback) {
		this.query("SELECT * FROM `" + this.options.table_name + "` WHERE id = `?`", [id], callback);
	},
	
	
	create: function (params, callback) {
		var time = Date.now(),
			sql = "INSERT INTO `" + this.options.table_name + "` " +
				  "SET title = `?`, params = `?`, vertex = `?`, fragment = `?`, created_at = `?`, updated_at = `?`";
		
		this.query(sql, [params.title, params.params, params.vertex, params.fragment, time, time], callback);
	},
	
	
	update: function (id, params, callback) {
		var time = Date.now(),
			sql = "UPDATE `" + this.options.table_name + "` " +
				  "SET title = `?`, params = `?`, vertex = `?`, fragment = `?`, updated_at = `?` " +
				  "WHERE id = `?`";
		
		this.query(sql, [params.title, params.params, params.vertex, params.fragment, time, id], callback);
	},
	
	
	destory: function (id, callback) {
		var time = Date.now(),
			sql = "DELETE FROM `" + this.options.table_name + "` " +
				  "WHERE id = `?`";
		
		this.query(sql, [id], callback);
	},
	
	
	query: function (sql, values, callback) {
		this.db.execute(sql, values, function (tx, results) {
			if (typeof callback === 'function') {
				callback(self.db.list(results));
			}
		});
	}
};

