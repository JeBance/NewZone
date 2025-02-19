class Message {
	chat;
	from;
	to;
	message;
	encrypted;

	constructor(message = {}) {
		message = Object.assign({
			hash: '',
			timestamp: '',
			chat: '',
			from: '',
			to: '',
			message: '',
			wasRead: false
		}, message);

		this.hash = message.hash;
		this.timestamp = message.timestamp;
		this.chat = message.chat;
		this.from = message.from;
		this.to = message.to;
		this.message = message.message;
		this.wasRead = false;
	}

	isValid() {
		try {
			if (this.chat.length <= 0
			|| this.from.length <= 0
			|| this.to.length <= 0
			|| this.message.length <= 0)
			return false;

			if (typeof this.chat !== 'string'
			|| typeof this.from !== 'string'
			|| typeof this.to !== 'string'
			|| typeof this.message !== 'string')
			return false;

			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async encrypt(recipientsPublicKey = null) {
		try {
			if (!recipientsPublicKey.hasPGPpublicKeyStructure())
			throw new Error("Recipient's public key hasn't PGP structure");

			let message = {
				chat: this.chat,
				from: this.from,
				to: this.to,
				message: this.message
			};

			let encrypted = await PGP.encryptMessage(recipientsPublicKey, JSON.stringify(message));
			if (!encrypted) throw new Error("Can't encrypt message");
			
			this.encrypted = encrypted;
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async send(net = null) {
		try {
			if (typeof net !== 'string')
			throw new Error('No node network specified for sending messages');

			if (!this.encrypted.hasPGPmessageStructure())
			throw new Error("Encrypted message hasn't PGP structure");

			let result = await NZHUB.sendMessage({ net: net, message: this.encrypted });
			if (!result) throw new Error("Can't send message");
			
			this.hash = result.hash;
			this.timestamp = result.timestamp;
			this.wasRead = true;

			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async save() {
		try {
			let message = {
				hash: this.hash,
				timestamp: this.timestamp,
				chat: this.chat,
				from: this.from,
				to: this.to,
				message: this.message,
				wasRead: this.wasRead
			};

			let db = await dbInit(config.dbName).then((db) => { return db; });
			let transaction = db.transaction("messages", "readwrite");
			let messages = transaction.objectStore("messages");
			let request = messages.put(message);
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

}
