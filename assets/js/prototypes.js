Array.prototype.unique = function () {
	return Array.from(new Set(this));
};

//Object.prototype.hide = function() {
//	this.className = 'hide';
//};

//Object.prototype.show = function(attribute = null) {
//	if (attribute == null) {
//		this.className = 'show';
//	} else {
//		this.setAttribute('class', attribute);
//	}
//};

String.prototype.isJsonString = function() {
	try {
		JSON.parse(this);
	} catch(e) {
		return false;
	}
	return true;
};

String.prototype.hasPGPstructure = function () {
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

Object.prototype.incorrect = async function() {
	this.classList.toggle('red');
	await sleep(100);
	this.classList.toggle('red');
	this.value = "";
};

Object.prototype.correct = async function() {
	this.classList.toggle('green');
	await sleep(100);
	this.classList.toggle('green');
};
