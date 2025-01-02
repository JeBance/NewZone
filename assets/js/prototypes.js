Array.prototype.unique = function () {
	return Array.from(new Set(this));
};

Object.prototype.hide = function() {
	this.className = 'hide';
}
