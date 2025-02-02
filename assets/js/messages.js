class Messages {
	db;
	list;
	messages;
	monitor;
	transaction;

	constructor() {
		this.list = {};
		this.monitor = {
			firstMessage: { hash: null, timestamp: new Date().getTime() },
			lastMessage: { hash: null, timestamp: 0 }
		};
	}

	async initDB() {
		this.db = await dbInit(config.dbName).then((db) => { return db; });
		this.transaction = this.db.transaction("messages", "readwrite");
		this.messages = this.transaction.objectStore("messages");
	}

	async checkMessage(armoredMessage) {
		try {
			let message = await PGP.readMessage(armoredMessage);
			if (!message) throw new Error("Can't read message");
			let decrypted = await PGP.decryptMessage(armoredMessage);
			if (!decrypted) throw new Error("Can't decrypt message");
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async add(message = {
		hash: 'somehash',
		timestamp: '1731683656118',
		chat: 'chatID',
		from: 'fingerprint',
		message: 'PGP message',
		wasRead: true
	} ) {
		try {
			this.list[message.hash] = message.timestamp;

			await this.initDB();
			let request = this.messages.put(message);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => {
//				console.log('\x1b[1m%s\x1b[0m', 'New message:', message.hash);
			});
		} catch(e) {
			console.log(e);
		}
	}

	async getMessages(address = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let url = address.prot + '://' + address.host + ':' + address.port + '/getMessages';

			let response = await fetch(url);
			if (!response.ok) throw new Error('Failed to get message list');

			let list = await response.json();
			return list;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async getMessage(keyID = 'someKeyMessage', address = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let url = address.prot + '://' + address.host + ':' + address.port + '/getMessage?' + keyID;

			let response = await fetch(url);
			if (!response.ok) throw new Error('Failed to get message');

			let message = await response.json();
			return message;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async updateMessages(node = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let checkMessage;

			let list = await this.getMessages(node);
			if (!list) throw new Error('Failed to get message list');

			let keys = Object.keys(list);
			if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
				if (this.list[keys[i]] === undefined) {
					var message = await this.getMessage(keys[i], node);
					if (message) {
						checkMessage = await this.checkMessage(message.message);
						if ((message.from !== PGP.fingerprint) && (checkMessage === false))
						message = {
							hash: message.hash,
							timestamp: message.timestamp,
							chat: false,
							from: false,
							message: false,
							wasRead: true
						};

						await this.add(message);
					}
				}
			}

			await this.updateMonitor();
		} catch(e) {
			console.log(e);
		}
	}

	async updateMonitor() {
		try {
			let messages = await this.getAllMessages();
			await messages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
			if (messages[0].timestamp < this.monitor.firstMessage.timestamp) {
				this.monitor.firstMessage.hash = messages[0].hash;
				this.monitor.firstMessage.timestamp = messages[0].timestamp;
			}
			this.monitor.lastMessage.hash = messages[messages.length - 1].hash;
			this.monitor.lastMessage.timestamp = messages[messages.length - 1].timestamp;
		} catch(e) {
			console.log(e);
		}
	}

	async cyclicMessagesCheck() {
		setInterval(async () => {
			try {
				let fastNodes = await NODES.getFastNodes();
				if (!fastNodes) throw new Error('Node list is empty');

				let keys = Object.keys(fastNodes);
				if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
					if (fastNodes[keys[i]].lastMessage !== undefined
					&& fastNodes[keys[i]].lastMessage.hash !== this.monitor.lastMessage.hash) {
						await this.updateMessages(fastNodes[keys[i]]);
					}
					if (i == 9) break;
				}
			} catch(e) {
				console.log(e);
			}
		}, 3000);
	}

	async getAllMessages() {
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

	async getAllMessagesFromChat(chat_id) {
		try {
			await this.initDB();
			let chatIndex = this.messages.index("chat_id");
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

	async sendMessage(message = 'encryptedPGPstring') {
		try {
			let fastNodes = await NODES.getFastNodes();
			if (!fastNodes) throw new Error('Node list is empty');

			let url = fastNodes[0].prot + '://' + fastNodes[0].host + ':' + fastNodes[0].port + '/';
			let response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=UTF-8',
					'Content-Length': message.length
				},
				body: message
			});
			if (!response.ok) throw new Error('Sending message failed');

			let result = await response.json();
			return result;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async checkSendedMessage(message) {
		try {
			await sleep(3);
			let fastNodes = await NODES.getFastNodes();
			if (!fastNodes) throw new Error('Node list is empty');

			let result = await this.getMessage(message.hash, fastNodes[0]);
			if (!result) throw new Error('Message missing from server');
			
			if ((result.hash !== message.hash)
			|| (result.timestamp !== message.timestamp)
			|| (result.message !== message.message))
			throw new Error('Message missing from server');
			
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

/*
(async () => {
	let messages = await MESSAGES.getAllMessages();
	await messages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
	console.log(messages);
})();

MESSAGES.sendMessage(`-----BEGIN PGP MESSAGE-----

wV4DnvIUAxOdiVsSAQdAX1UpS6hzW2iJHW1GJBAdvUYsUFa1rVaGL9b3PYQ7
ogMwrK+RAJJQ4q+KxEh844o0EnB6R95OXrxNAIaTF3TW5fSYCah5YuWYMK2s
Hf6zRwsX0sBJAfom93A4yTcfU2Atrz8iz3ZHjfYrqu2KMN7E6rFJokk09G58
lXQmKr6svriBctEbzU1J0msCjTvplb2+VJPRQi3WlDMLXCb34BFGG2M0SY3J
0PF628MJKijebZMX6O0l33jZNQcjjJaWsnvUyp34ageGuj2JC1c+9qD81Uu9
NvxQGrQPldyFLkDFcNH/RPMAciphspYiGVjg6uFbivDhzd8BcltrnCss2IfQ
h3iA/dsO6TMyVor8fygNlSEyGf9aaiW6cPKW84UVh318DzgJeuYz0FyJTwLf
/kL8xRs0He4uenDML98BiCCEQDOzGVefzf8t1vupneAcfgRawAebmF3li0Ao
4RvQYw==
=lW1H
-----END PGP MESSAGE-----`);
*/
}
