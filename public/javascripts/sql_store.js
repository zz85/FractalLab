/*global window, $, console*/

function SQLStore(name, options) {
	var config = { 
			version: '1.0',
			name: name,
			display_name: name,
			max_size: 65536
		};
	
	this.options = $.extend({}, config, options);
	this.query = '';
	this.values = [];
	this.results = null;
	
	if (window.openDatabase) {
		return this.init();
	} else {
		console.error("Database not supported");
		return false;
	}
}

SQLStore.prototype = {
	
	init: function () {
		// Try creating a database
		try {
			this.db = window.openDatabase(this.options.name, this.options.version, this.options.display_name, this.options.max_size);
			return this;
				
		} catch (e) {
			console.error(this.errorMessage(e));
		}
		return false;
	},
	
	
	// Create a table based on an array of hashes defining the fields
	// 
	// fields = [{'name': FIELD_NAME, 
	//			  'type': FIELD_TYPE, 
	//			  'default': DEFAULT_VALUE, 
	//			  'null': TRUE/FALSE}]
	// FIELD_TYPES: string, text, integer, bool
	//
	// An id primary key field is created by default unless id_field is false
	createTable: function (table_name, fields, id_field, data_handler, error_handler) {
		var sql = 'CREATE TABLE IF NOT EXISTS `' + table_name + '` (',
			query_parts = [],
			i, col, str;
		
		if (id_field !== false) {
			query_parts.push('id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT');
		}
		
		// Build query
		for (i = 0; i < fields.length; i += 1) {
			col = fields[i];
			str = "`" + col.name + "`";
			
			switch (col.type) {
			case 'text':
				str += ' TEXT';
				break;
			case 'integer':
				str += ' INTEGER';
				break;
			case 'datetime':
				str += ' DATETIME';
				break;
			case 'bool':
				str += ' SMALLINT(1)';
				str += col['default'] ? ' DEFAULT `0`' : ' DEFAULT `1` ';
				break;
			default:
				str += ' VARCHAR(255)';
			}
			
			if (col['default'] && col.type !== 'bool') {
				str += ' DEFAULT `' + col['default'] + '`';
			}
			
			if (col['null'] === false || col.type === 'bool' || col['default']) {
				str += ' NOT NULL';
			} else {
				str += ' NULL';
			}
			query_parts.push(str);
		}
		
		// Execute final query
		sql += query_parts.join(', ') + ")";
		this.execute(sql, [], data_handler, error_handler);
	},
	
	
	// Drop the DB table
	dropTable: function (table_name) {
		this.execute("DROP TABLE `" + table_name + "`");
	},
	
	
	// Execute SQL query in a transaction
	execute: function (query, values, data_handler, error_handler) {
		var self = this;
		
		this.values = values || [];
		this.query = query;
		
		this.db.transaction(function (tx) {
			tx.executeSql(self.query, self.values, data_handler || self.dataHandler, error_handler || self.errorHandler);
		});
	},
	
	
	nullDataHandler: function (tx, results) {
		
	},
	
	
	errorHandler: function (tx, error) {
		console.error("Error (" + error.code + "): " + error.message);
	},
	
	
	dataHandler: function (tx, results) {
		this.results = results;
	},
	
	
	list: function (result_set) {
		var rows = [],
			row, col, result, i, l;
		
		this.results = result_set || this.results;
		
		if (this.results && this.results.rows) {
			for (i = 0, l = this.results.rows.length; i < l; i += 1) {
				result = this.results.rows.item(i);
				row = {};
				
				for (col in result) {
					if (result.hasOwnProperty(col)) {
						row[col] = result[col];
					}
				}
				rows.push(row);
			}
		}
		
		return rows;
	},
	
	
	// Return the current DB version string
	version: function () {
		return this.db.version;
	},
	
	
	// Expose the DB connection object directly
	connection: function () {
		return this.db;
	},
	
	
	errorMessage: function (num) {
		var errors = [
				"Unknown error: " + num,
				"Error 1: Other database related error.",
				"Error 2: The version of this database is not the version requested.",
				"Error 3: Data set too large.",
				"Error 4: Storage limit exceeded.",
				"Error 5: Lock contention error.",
				"Error 6: Constraint error.",
				"Error 7: Timeout error."
			];
		
		return errors[num] || errors[0];
	}
};
