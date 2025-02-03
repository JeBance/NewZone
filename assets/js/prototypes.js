Array.prototype.unique = function () {
	return Array.from(new Set(this));
};

String.prototype.isJsonString = function() {
	try {
		JSON.parse(this);
	} catch(e) {
		return false;
	}
	return true;
};

String.prototype.hasPGPmessageStructure = function () {
	if (typeof this !== 'string') return false;
	try {
		if ((this.slice(0,27) === '-----BEGIN PGP MESSAGE-----')
		&& (this.slice(this.length - 25) === '-----END PGP MESSAGE-----')) {
			return true;
		}
	} catch(e) {
		console.log(e);
	}
	return false;
};

String.prototype.hasPGPpublicKeyStructure = function () {
	if (typeof this !== 'string') return false;
	try {
		if ((this.slice(0,27) === '-----BEGIN PGP MESSAGE-----')
		&& (this.slice(this.length - 25) === '-----END PGP MESSAGE-----')) {
			return true;
		}
	} catch(e) {
		console.log(e);
	}
	return false;
};
