/*jslint nomen: false*/
/*global window, jQuery, localStorage, console, QUOTA_EXCEEDED_ERR*/

function IndexedLocalStorage(index_key, prefix_key) {
	this.index_key = index_key || "local_index";
	this.prefix_key = prefix_key || "store_";
	
	if (typeof(localStorage) === 'undefined') {
		return false;
	} else {
		return this;
	}
}

IndexedLocalStorage.prototype = {
	
	index: function () {
		return this.readLocalStorage(this.index_key) || [];
	},
	
	
	find: function (id) {
		return this.readLocalStorage(id);
	},
	
	
	find_by_title: function (title) {
		var i, l, id,
			idx = this.index();
		
		for (i = 0, l = idx.length; i < l; i += 1) {
			if (idx[i].title === title) {
				id = idx[i].id;
				break;
			}
		}
		
		return id;
	},
	
	
	save: function (id, params) {
		var updated_at = Date.now(),
			key = id || this.prefix_key + updated_at;
		
		this.updateIndex({id: key, title: params.title, updated_at: updated_at});
		return this.writeLocalStorage(key, params);
	},
	
	
	updateIndex: function (params) {
		var idx = this.index(),
			updated, i, l;
		
		for (i = 0, l = idx.length; i < l; i += 1) {
			if (idx[i].id === params.id) {
				idx[i] = params;
				updated = true;
				break;
			}
		}
		
		if (!updated) {
			idx.push(params);
		}
		
		this.writeLocalStorage(this.index_key, idx);
	},
	
	
	destroy: function (id) {
		var idx = this.index(), i, l;
		
		try {
			localStorage.removeItem(id);
			
			// remove from index
			for (i = 0, l = idx.length; i < l; i += 1) {
				if (idx[i].id === id) {
					idx.splice(i, 1);
					this.writeLocalStorage(this.index_key, idx);
					break;
				}
			}
			
		} catch (e) {
			console.error("localStorage removeItem error", e);
		}
	},
	
	
	readLocalStorage: function (id) {
		var value;
		
		try {
			value = JSON.parse(localStorage.getItem(id));
		} catch (e) {
			console.error("Read local storage error", e);
		}
		
		return value;
	},
	
	
	writeLocalStorage: function (id, params) {
		var status = false;
		
		try {
			localStorage.setItem(id, JSON.stringify(params));
			status = true;
		} catch (e) {
			if (e === QUOTA_EXCEEDED_ERR) {
				console.error("Local storage quota exceeded!");
			} else {
				console.error("Write local storage error", e);
			}
		}
		
		return status;
	}
};