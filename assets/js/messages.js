class Messages {
	db;
	list;
	messages;
	monitor;
	transaction;

	constructor() {
		this.list = new Map();
	}

	async initDB() {
		this.db = await dbInit(config.dbName).then((db) => { return db; });
		this.transaction = this.db.transaction("messages", "readwrite");
		this.messages = this.transaction.objectStore("messages");
	}

	async initList() {
		this.list.clear();
		let list = await this.getAll();
		await list.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
		let keys = Object.keys(list);
		if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
			this.list.set(list[keys[i]].hash, list[keys[i]].timestamp);
		}
	}

	async add(message = {}) {
		message = Object.assign({
			hash: 'somehash',
			timestamp: '1731683656118',
			chat: 'chatID',
			from: 'fingerprint',
			message: 'message',
			wasRead: true
		}, message);

		try {
			this.list.set(message.hash, message.timestamp);

			await this.initDB();
			let request = this.messages.put(message);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => {
				console.log('\x1b[1m%s\x1b[0m', 'New message:', message);
			});
		} catch(e) {
			// console.log(e);
		}
	}

	async getAll() {
		try {
			await this.initDB();
			let request = this.messages.getAll();
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
				request.onerror = function() { reject('Error: ' + openRequest.error); }
			});
			let allMessages = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
			return allMessages;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async getAllFromChat(chat_id) {
		try {
			await this.initDB();
			let chatIndex = this.messages.index("chat");
			let request = chatIndex.getAll(chat_id);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
				request.onerror = function() { reject('Error: ' + openRequest.error); }
			});
			let allMessages = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
			return allMessages;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async update() {
		setInterval(async () => {
			try {
				if (NZHUB.knownMessages[config.net] === undefined) throw new Error(config.net + ' undefined');

				let map = new Map(Object.entries(NZHUB.knownMessages[config.net]));
				let newMap = Array.from(map).sort((a, b) => a[1] - b[1]);
				let sortedMap = new Map(newMap);
				if (sortedMap.size > this.list.size) await sortedMap.forEach(async (value, key, map) => {
					if (!this.list.has(key)) {
						console.log(`${key}: ${value}`);
						var dbName = 'nz_' + config.net;
						var db = await NZHUB.dbInitMessages(dbName).then((db) => { return db; });
						var transaction = db.transaction('messages', 'readwrite');
						var messages = transaction.objectStore('messages');
						var request = messages.get(key);
						var x = new Promise((resolve, reject) => {
							request.onsuccess = function() { resolve(request.result); }
							request.onerror = function() { reject('Error: ' + openRequest.error); }
						});
						var message = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));

						try {
							let decrypted = await this.decryptMessage(message.message);
							if (!decrypted) throw new Error('');
							decrypted.wasRead = false;
							message = Object.assign(decrypted, message);
						} catch(e) {
							message = Object.assign(message, {
								chat: false,
								from: false,
								to: false,
								message: false,
								wasRead: false
							});
						}

						await this.add(message);
					}
				});

			} catch(e) {
				// console.log(e);
			}
		}, 3000);
	}

	async decryptMessage(armoredMessage) {
		let decrypted, message;
		let tmpContact = new Contact();

		try {
			let message = await PGP.readMessage(armoredMessage);
			if (!message) throw new Error("Can't read message");
			let decrypted = await PGP.decryptMessage(armoredMessage);
			if (!decrypted) throw new Error("Can't decrypt message");
			message = await JSON.parse(decrypted);
console.log(message);
			if (!message) throw new Error("Can't parse message");

			if (await message.message.hasPGPpublicKeyStructure()) {
				decrypted = await PGP.decryptMessageWithVerificationKey(armoredMessage, message.message);
console.log(decrypted);
				if (!decrypted) throw new Error("Can't decrypt and verify message");
				await tmpContact.init({ publicKey: message.message });

			} else {
				if (message.from !== PGP.fingerprint) {
					let resultOfInit = await tmpContact.init({ fingerprint: message.from });
				} else {
					let resultOfInit = await tmpContact.init({ publicKey: PGP.publicKeyArmored });
				}
console.log(resultOfInit);
console.log(tmpContact);
				if (!resultOfInit) throw new Error('Failed to init contact');
				decrypted = await PGP.decryptMessageWithVerificationKey(armoredMessage, tmpContact.publicKey);
console.log(decrypted);
				if (!decrypted) throw new Error("Can't decrypt and verify message");
			}

			return message;
		} catch(e) {
			console.log(e);
			return false;
		}

	}

}
