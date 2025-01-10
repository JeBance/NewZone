class messages {
	list;
	messages;
	monitor;

	constructor() {
		this.list = {};
		this.messages = [];
		this.monitor = {
			firstMessage: { hash: null, timestamp: new Date().getTime() },
			lastMessage: { hash: null, timestamp: 0 }
		};
	}

	async add(message = { hash: 'somehash', timestamp: '1731683656118', message: 'PGP message' } ) {
		try {
			this.list[message.hash] = message.timestamp;
			this.messages.push(message);
			console.log('\x1b[1m%s\x1b[0m', 'New message:', message.hash);
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
				this.messages = this.messages.unique();
				await this.messages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
				if (this.messages[0].timestamp < this.monitor.firstMessage.timestamp) {
					this.monitor.firstMessage.hash = this.messages[0].hash;
					this.monitor.firstMessage.timestamp = this.messages[0].timestamp;
				}
				this.monitor.lastMessage.hash = this.messages[this.messages.length - 1].hash;
				this.monitor.lastMessage.timestamp = this.messages[this.messages.length - 1].timestamp;
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

}
