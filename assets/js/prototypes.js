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
	try {
		if (Object.prototype.toString.call(this) !== '[object String]')
		throw new Error('parameter not string');

		if (this.indexOf('-----BEGIN PGP MESSAGE-----') == -1)
		throw new Error('no begin');

		if (this.indexOf('-----END PGP MESSAGE-----') == -1)
		throw new Error('no end');

		let explode = this.split('-----');
		if (explode[1] !== 'BEGIN PGP MESSAGE'
		|| explode[3] !== 'END PGP MESSAGE')
		throw new Error('data sequence is broken');

		return true;
	} catch(e) {
		return false;
	}
};

String.prototype.hasPGPpublicKeyStructure = function () {
	try {
		if (Object.prototype.toString.call(this) !== '[object String]')
		throw new Error('parameter not string');

		if (this.indexOf('-----BEGIN PGP PUBLIC KEY BLOCK-----') == -1)
		throw new Error('no begin');

		if (this.indexOf('-----END PGP PUBLIC KEY BLOCK-----') == -1)
		throw new Error('no end');

		let explode = this.split('-----');
		if (explode[1] !== 'BEGIN PGP PUBLIC KEY BLOCK'
		|| explode[3] !== 'END PGP PUBLIC KEY BLOCK')
		throw new Error('data sequence is broken');

		return true;
	} catch(e) {
		return false;
	}
};
