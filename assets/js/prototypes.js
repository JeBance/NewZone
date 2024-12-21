Array.prototype.unique = function () {
	var a = [];
	var l = this.length;

	for (var i = 0; i < l; i++) {
		for (var j = i + 1; j < l; j++) {
			if (this[i] === this[j]) {
				j = ++i;
			}
		}
		a.push(this[i]);
	}

	return a;
};
