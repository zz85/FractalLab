/**
 * Frames per second
 */

function FPS(average) {
	this.lastUpdated = 0;
	this.samples = [];
	this.fps = 0;
	this.average_over = average || 10;
}

FPS.prototype = {
	capture: function () {
		var now = Date.now();
		this.samples.push(now - this.lastUpdated);
	
		if (this.samples.length > this.average_over) {
			this.samples.shift();
		}
	
		this.lastUpdated = now;
	},
	
	display: function () {
		var fps = 0,
			i, 
			l = this.samples.length;
	
		if (l < 2) {
			return 0;
		}
	
		for (i = 0; i < l; i += 1) {
			fps += this.samples[i];
		}
	
		return Math.round(10000 / (fps / l)) / 10;
	}
};