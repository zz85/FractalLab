// First person camera
function Camera(x, y, z, pitch, yaw) {
	this.x = parseFloat(x || 0);
	this.y = parseFloat(y || 0);
	this.z = parseFloat(z || 0);
	this._pitch = parseFloat(pitch || 0);
	this._yaw = parseFloat(yaw || 0);
	this._step = 0.1;
	this.deg2rad = Math.PI / 180;
}

Camera.prototype = {
	step: function (v) {
		if (typeof v !== "undefined") {
			this._step = v;
		}
		return this._step;
	},
	
	pitch: function (v) {
		if (typeof v !== "undefined") {
			this._pitch = v;
		}
		return this._pitch;
	},
	
	yaw: function (v) {
		if (typeof v !== "undefined") {
			this._yaw = v;
		}
		return this._yaw;
	},
	
	forward: function (s) {
		this.move((s || this._step), this._yaw, this._pitch);
	},
	
	back: function (s) {
		this.move(-(s || this._step), this._yaw, this._pitch);
	},
	
	up: function (s) {
		this.move((s || this._step), this._yaw, 90);
	},
	
	down: function (s) {
		this.move((s || this._step), this._yaw, -90);
	},
	
	strafeLeft: function (s) {
		this.move((s || this._step), this._yaw - 90, 0);
	},
	
	strafeRight: function (s) {
		this.move((s || this._step), this._yaw + 90, 0);
	},
	
	move: function (s, ay, ap) {
		var hstep = s * Math.cos(ap * this.deg2rad);
		
		this.x += hstep * Math.sin(ay * this.deg2rad);
		this.z += hstep * Math.cos(ay * this.deg2rad);
		this.y += s * Math.sin(ap * this.deg2rad);
	},
	
	position: function (pos) {
		if (typeof pos === "object") {
			this.x = pos[0];
			this.y = pos[1];
			this.z = pos[2];
		}
		
		return [this.x, this.y, this.z];
	}
};