PresetManager = function (callback) {
  
  if (window.openDatabase) {
    this.backend = new SQLStore({}, callback);
  }
  
  if (!this.backend) {
    this.backend = new LocalStorageAdapter("preset_index", "preset_");
	_.defer(callback);
  }
}



PresetManager.prototype = {
  all: function (callback) {
    this.backend.index(callback);
  },
  
  find: function (id, callback) {
    this.backend.find(id, callback);
  },
  
  find_by_title: function (title, callback) {
    this.backend.find_by_title(title, callback);
  },
  
  save: function (id, params, callback) {
    this.backend.save(id, params, callback);
  },
  
  destroy: function (id, callback) {
    this.backend.destroy(id, callback);
  }
  
};