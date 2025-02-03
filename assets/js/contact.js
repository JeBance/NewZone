class Contact {
	db;
	transaction;
	contacts;

	nickname;
	email;
	fingerprint;
	publicKey;
	receivedContactMessage;

	async initDB() {
		this.db = await dbInit(config.dbName).then((db) => { return db; });
		this.transaction = this.db.transaction("contacts", "readwrite");
		this.contacts = this.transaction.objectStore("contacts");
	}

	isValidFingerprint(fingerprint) {
		let matches = fingerprint.match(/^[a-z0-9]{40}$/i);
		if (matches === null) {
			return false;
		} else {
			return true;
		}
	}

	isValidObjectContact(contact) {
		const type = Object.prototype.toString.call(contact);
		if (type !== '[object Object]') return false;
		if (contact.nickname === undefined
		|| contact.email === undefined
		|| contact.fingerprint === undefined
		|| contact.publicKey === undefined
		|| contact.receivedContactMessage === undefined)
		return false;
		return true;
	}

	async check(fingerprint) {
		try {
			await this.initDB();
			let request = this.contacts.get(fingerprint);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			let contact = await x.then((value) => { return value; });
			if (contact === undefined) return false;
			return contact;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async add(contact = { nickname: '', email: '', fingerprint: '', publicKey: '', receivedContactMessage: '' }) {
		try {
			if (!this.isValidObjectContact(contact)) throw new Error('Parameter is not a valid contact object');

			await this.initDB();
			let request = this.contacts.add(contact);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => { return value; });
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async init(contact = { nickname: '', email: '', fingerprint: '', publicKey: '', receivedContactMessage: false }) {
		try {
			if (!this.isValidFingerprint(contact.fingerprint)) throw new Error('Incorrect fingerprint entered');
			this.fingerprint = contact.fingerprint;
			let check = await this.check(this.fingerprint);
			if (!check) {
				let resultOfAdding = await this.add(contact);
				if (!resultOfAdding) throw new Error('Failed to add contact');

				this.nickname = contact.nickname;
				this.email = contact.email;
				this.fingerprint = contact.fingerprint;
				this.publicKey = contact.publicKey;
				this.receivedContactMessage = contact.receivedContactMessage;
			} else {
				this.nickname = check.nickname;
				this.email = check.email;
				this.fingerprint = check.fingerprint;
				this.publicKey = check.publicKey;
				this.receivedContactMessage = check.receivedContactMessage;
			}
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async save() {
		try {
			let addedContact = {
				nickname: this.nickname,
				email: this.email,
				fingerprint: this.fingerprint,
				publicKey: this.publicKey,
				receivedContactMessage: this.receivedContactMessage
			};

			await this.initDB();
			let request = this.contacts.put(addedContact);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => { return value; });
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async getAllContacts() {
		try {
			await this.initDB();
			let request = this.contacts.getAll();
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			let allContacts = await x.then((value) => { return value; });
			return allContacts;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

}
