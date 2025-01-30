class Contact {
	db;
	transaction;
	contacts;

	nickname;
	email;
	fingerprint;
	publicKey;

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

	async check(fingerprint) {
		await this.initDB();
		let request = this.contacts.get(fingerprint);
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		let contact = await x.then((value) => { return value; });
		if (contact === undefined) return false;
		return contact;
	}

	async add(contact = { nickname: '', email: '', fingerprint: '', publicKey: '' }) {
		await this.initDB();
		let request = this.contacts.add(contact);
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		await x.then((value) => { return value; });
	}

	async init(contact = { nickname: '', email: '', fingerprint: '', publicKey: '' }) {
		try {
			if (!this.isValidFingerprint(contact.fingerprint)) throw new Error('Incorrect fingerprint entered');
			this.fingerprint = contact.fingerprint;
			let check = await this.check(this.fingerprint);
			if (!check) {
				this.add(contact);
				this.nickname = contact.nickname;
				this.email = contact.email;
				this.fingerprint = contact.fingerprint;
				this.publicKey = contact.publicKey;
			} else {
				this.nickname = check.nickname;
				this.email = check.email;
				this.fingerprint = check.fingerprint;
				this.publicKey = check.publicKey;
			}
			return true;
		} catch(e) {
			alert(e);
			return false;
		}
	}

	async save() {
		let addedContact = {
			nickname: this.nickname,
			email: this.email,
			fingerprint: this.fingerprint,
			publicKey: this.publicKey
		};

		await this.initDB();
		let request = this.contacts.put(addedContact);
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		await x.then((value) => { return value; });
	}

	async getAllContacts() {
		await this.initDB();
		let request = this.contacts.getAll();
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		let allContacts = await x.then((value) => { return value; });
		return allContacts;
	}
}
