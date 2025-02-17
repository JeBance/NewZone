/*
class Message {
	db;
	transaction;
	messages;

	message;

	async initDB() {
		this.db = await dbInit(config.dbName).then((db) => { return db; });
		this.transaction = this.db.transaction("messages", "readwrite");
		this.messages = this.transaction.objectStore("messages");
	}

	async check(message) {
		const type = Object.prototype.toString.call(message);
		if (type !== '[object Object]') return false;

		if (message.chat === 'chatID'
		|| message.to === 'recipientsFingerprint'
		|| !message.message) return false;

		if (typeof message.chat !== 'string'
		|| typeof message.to !== 'string'
		|| typeof message.message !== 'string') return false;

		return true;
	}

	async init(message = {}) {
		message = Object.assign({
			chat: 'chatID',
			from: PGP.fingerprint,
			to: 'recipientsFingerprint',
			message: false
		}, message);

		try {
			if (!this.check(message)) return false;

			this.message = message
			let keys = Object.keys(message);
			for (let i = 0, l = keys.length; i < l; i++) {
				this[keys[i]] = message[keys[i]];
			}

			if (message.hash !== undefined) {
			} else if () {
			}








				let contactPublicKey = await PGP.readKey(contact.publicKey);
				if (!contactPublicKey) throw new Error('Invalid public key');
				fingerprint = await contactPublicKey.getFingerprint();
				contact.nickname = contactPublicKey.users[0].userID.name;
				contact.email = contactPublicKey.users[0].userID.email;
				contact.fingerprint = fingerprint;
				if (contact.receivedContactMessage === undefined)
				contact.receivedContactMessage = false;
			} else if (contact.fingerprint !== undefined) {
				if (!this.isValidFingerprint(contact.fingerprint)) throw new Error('Incorrect fingerprint entered');
				fingerprint = contact.fingerprint;
			} else {
				throw new Error('Incorrect fingerprint entered');
			}

			check = await this.check(fingerprint);
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

	clear() {
		this.nickname = '';
		this.email = '';
		this.fingerprint = '';
		this.publicKey = '';
		this.receivedContactMessage = false;
	}

}
*/
