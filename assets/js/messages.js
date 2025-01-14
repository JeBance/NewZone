class messages {
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

	async checkMessage(message) {
		// чтение и попытка расшифровать сообщение
		// если удалось, то true
		return true;
	}

	async add(message = { hash: 'somehash', timestamp: '1731683656118', chat: 'chatID', from: 'fingerprint', message: 'PGP message', wasRead: true } ) {
		try {
			if (this.checkMessage(message) === false)
			message = {
				hash: message.hash,
				timestamp: message.timestamp,
				chat: false,
				from: false,
				message: false,
				wasRead: true
			};
			this.list[message.hash] = message.timestamp;
			await this.initDB();
			let request = this.messages.put(message);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => {
				console.log('\x1b[1m%s\x1b[0m', 'New message:', message.hash);
				return value;
			});
		} catch(e) {
			console.log(e);
		}
	}

	async getMessages(address = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let url = address.prot + '://' + address.host + ':' + address.port + '/getMessages';
			let response = await fetch(url);
			if (response.ok) {
				let list = await response.json();
				return list;
			} else {
				return false;
			}
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async getMessage(keyID = 'someKeyMessage', address = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let url = address.prot + '://' + address.host + ':' + address.port + '/getMessage?' + keyID;
			let response = await fetch(url);
			if (response.ok) {
				let message = await response.json();
				return message;
			} else {
				return false;
			}
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async updateMessages(node = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		let list = await this.getMessages(node);
		if (list) {
			let keys = Object.keys(list);
			if (keys.length > 0) {
				for (let i = 0, l = keys.length; i < l; i++) {
					if (this.list[keys[i]] === undefined) {
						var message = await this.getMessage(keys[i], node);
						if (message) await this.add(message);
					}
				}
				let messages = this.getAllMessages();
				await messages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
				if (messages[0].timestamp < this.monitor.firstMessage.timestamp) {
					this.monitor.firstMessage.hash = messages[0].hash;
					this.monitor.firstMessage.timestamp = messages[0].timestamp;
				}
				this.monitor.lastMessage.hash = messages[messages.length - 1].hash;
				this.monitor.lastMessage.timestamp = messages[messages.length - 1].timestamp;
			}
		}
	}

	async cyclicMessagesCheck() {
		setInterval(async () => {
			let fastNodes = await NODES.getFastNodes();
			if (fastNodes) {
				let keys = Object.keys(fastNodes);
				if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
					if (fastNodes[keys[i]].lastMessage !== undefined
					&& fastNodes[keys[i]].lastMessage.hash !== this.monitor.lastMessage.hash) {
						await this.updateMessages(fastNodes[keys[i]]);
					}
					if (i == 9) break;
				}
			}
		}, 1000);
	}

	async getAllMessages() {
		await this.initDB();
		let request = this.messages.getAll();
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
			request.onerror = function() { reject('Error: ' + openRequest.error); }
		});
		let allMessages = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
		return allMessages;
	}

	async getAllMessagesFromChat(chat_id) {
		await this.initDB();
		let chatIndex = this.messages.index("chat_id");
		let request = chatIndex.getAll(chat_id);
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
			request.onerror = function() { reject('Error: ' + openRequest.error); }
		});
		let allMessages = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
		return allMessages;
	}
/*
(async () => {
	let messages = await MESSAGES.getAllMessages();
	await messages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
	console.log(messages);
})();
*/
}
