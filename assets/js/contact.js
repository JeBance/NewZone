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



contact.click = async (elem) => {
	let init, nickname, email, fingerprint, publicKey;
	switch(elem.id) {
		case 'contactAdd':
			if (contactNameInput.value.length > 0) {
				nickname = contactNameInput.value;
				email = contactEmailInput.value;
				fingerprint = contactFingerprintInput.value;
				publicKey = contactPublicKeyInput.value;

				init = await CONTACT.init({
					nickname: nickname,
					email: email,
					fingerprint: fingerprint,
					publicKey: publicKey
				});

				if (init) {
					contactNameInput.readOnly = true;
					UI.hide(contactAdd);
					UI.show(contactEdit, 'btn btn-start');
					UI.hide(contactSave);
					UI.show(contactChat, 'btn btn-start');
				}
			} else {
				alert('Введите имя контакта');
			}
			break;

		case 'contactEdit':
			contactNameInput.readOnly = false;
			UI.hide(contactAdd);
			UI.hide(contactEdit);
			UI.show(contactSave, 'btn btn-start');
			UI.hide(contactChat);
			break;

		case 'contactSave', 'contactNameInput':
			if (contactNameInput.value.length > 0) {
				nickname = contactNameInput.value;
				email = contactEmailInput.value;
				fingerprint = contactFingerprintInput.value;
				publicKey = contactPublicKeyInput.value;

				init = CONTACT.init({
					nickname: nickname,
					email: email,
					fingerprint: fingerprint,
					publicKey: publicKey
				});

				if (init) {
					contactNameInput.readOnly = true;
					UI.hide(contactAdd);
					UI.show(contactEdit, 'btn btn-start');
					UI.hide(contactSave);
					UI.show(contactChat, 'btn btn-start');
					CONTACT.save();
				}
			} else {
				alert('Введите имя контакта');
			}
			break;

		default:
			break;
	}
}
