class nzhub {
	config;
	knownNets;
	knownNodes;
	knownMessages;
	monitorMessages;

	constructor(config = {}) {
		this.config = Object.assign({
			checkingNodes: false,
			checkingMessages: false,
			timeForCyclicNodesCheck: 3000,
			timeForCyclicMessagesCheck: 3000,
			log: false
		}, config);

		this.knownNets = {};
		this.knownNodes = {};
		this.knownMessages = {};
		this.monitorMessages = {};

		this.startLoadFromDB();
	}

	async loadInfo(addr = {}) {
		addr = Object.assign({
			prot: 'https',
			host: 'jebance.ru',
			port: 28262
		}, addr);

		try {
			let url = addr.prot + '://' + addr.host + ':' + addr.port + '/info';

			let rttStart = new Date().getTime();
			let response = await fetch(url);
			let rttFinish = new Date().getTime();
			let rtt = rttFinish - rttStart;
			if (!response.ok) throw new Error('Request failed');

			let info = await response.json();
			info.rtt = rtt;
			return info;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async loadNodes(addr = {}) {
		addr = Object.assign({
			prot: 'https',
			host: 'jebance.ru',
			port: 28262
		}, addr);

		try {
			let url = addr.prot + '://' + addr.host + ':' + addr.port + '/getNodes';

			let response = await fetch(url);
			if (!response.ok) throw new Error('Request failed');

			let list = await response.json();
			let keys = Object.keys(list);

			for (let i = 0, l = keys.length; i < l; i++) {
				if (this.knownNodes[keys[i]] === undefined)
				this.addNode({
					keyID: keys[i],
					net: list[keys[i]].net,
					prot: list[keys[i]].prot,
					host: list[keys[i]].host,
					port: list[keys[i]].port,
					rtt: 10
				});

				if (this.knownNets[list[keys[i]].net] === undefined)
				this.addNet({ net: list[keys[i]].net, status: false });

			}
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async loadMessages(addr = {}) {
		addr = Object.assign({
			prot: 'https',
			host: 'jebance.ru',
			port: 28262
		}, addr);

		try {
			let url = addr.prot + '://' + addr.host + ':' + addr.port + '/getMessages';

			let response = await fetch(url);
			if (!response.ok) throw new Error('Failed to get message list');

			let list = await response.json();
			return list;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async loadMessage(hash = 'someKeyMessage', addr = {}) {
		addr = Object.assign({
			prot: 'https',
			host: 'jebance.ru',
			port: 28262
		}, addr);

		try {
			let url = addr.prot + '://' + addr.host + ':' + addr.port + '/getMessage?' + hash;

			let response = await fetch(url);
			if (!response.ok) throw new Error('Failed to get message');

			let message = await response.json();
			return message;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async dbInitHub() {
		return new Promise((resolve, reject) => {
			let openRequest = indexedDB.open('nzhub', 1);

			openRequest.onupgradeneeded = function() {
				let db = openRequest.result;
				switch(event.oldVersion) {
					case 0:
						let nets = db.createObjectStore('nets', {keyPath: 'net'});
						let statusIndex = nets.createIndex('status', 'status');

						let nodes = db.createObjectStore('nodes', {keyPath: 'keyID'});
						let netIndex = nodes.createIndex('net', 'net');
						let protIndex = nodes.createIndex('prot', 'prot');
						let hostIndex = nodes.createIndex('host', 'host');
						let portIndex = nodes.createIndex('port', 'port');
						let timeIndex = nodes.createIndex('time', 'time');
						let autoDelIndex = nodes.createIndex('autoDel', 'autoDel');
						let autoCheckNodesIndex = nodes.createIndex('autoCheckNodes', 'autoCheckNodes');
						let autoCheckMessagesIndex = nodes.createIndex('autoCheckMessages', 'autoCheckMessages');

						break;
				}
			};

			openRequest.onerror = function() {
				reject('Error: ' + openRequest.error);
			};

			openRequest.onsuccess = function() {
				let db = openRequest.result;
				db.onversionchange = function() {
					db.close();
					reject('The database is out of date. Please reload the page to update.');
				};
				resolve(db);
			};

			openRequest.onblocked = function() {
				reject('The database is out of date. Please close other tabs and reload the page to update.');
			};
		});
	}

	async dbInitMessages(nameDB) {
		return new Promise((resolve, reject) => {
			let openRequest = indexedDB.open(nameDB, 1);

			openRequest.onupgradeneeded = function() {
				let db = openRequest.result;
				switch(event.oldVersion) {
					case 0:
						let messages = db.createObjectStore('messages', {keyPath: 'hash'});
						let netstampIndex = messages.createIndex('net', 'net');
						let timestampIndex = messages.createIndex('timestamp', 'timestamp');

						break;
				}
			};

			openRequest.onerror = function() {
				reject('Error: ' + openRequest.error);
			};

			openRequest.onsuccess = function() {
				let db = openRequest.result;
				db.onversionchange = function() {
					db.close();
					reject('The database is out of date. Please reload the page to update.');
				};
				resolve(db);
			};

			openRequest.onblocked = function() {
				reject('The database is out of date. Please close other tabs and reload the page to update.');
			};
		});
	}

	async startLoadFromDB() {
		try {
			await this.loadKnownNetsFromDB();
			await this.loadKnownNodesFromDB();
			await this.loadKnownMessagesFromDB();
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async loadKnownNetsFromDB() {
		try {
			this.knownNets = {};

			let db = await this.dbInitHub().then((db) => { return db; });
			let transaction = db.transaction('nets', 'readwrite');
			let nets = transaction.objectStore('nets');
			let request = nets.getAll();
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
				request.onerror = function() { reject('Error: ' + openRequest.error); }
			});
			let result = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
			
			let keys = Object.keys(result);
			if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
				this.knownNets[result[keys[i]].net] = result[keys[i]];
				this.initMonitorMessages({ net: result[keys[i]].net });
			}
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async loadKnownNodesFromDB() {
		try {
			this.knownNodes = {};

			let db = await this.dbInitHub().then((db) => { return db; });
			let transaction = db.transaction('nodes', 'readwrite');
			let nodes = transaction.objectStore('nodes');
			let request = nodes.getAll();
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
				request.onerror = function() { reject('Error: ' + openRequest.error); }
			});
			let result = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
			
			let keys = Object.keys(result);
			if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
				this.knownNodes[result[keys[i]].keyID] = result[keys[i]];
			}
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async loadKnownMessagesFromDB() {
		try {
			this.knownMessages = {};

			let keysNets = Object.keys(this.knownNets);
			if (keysNets.length > 0) for (let i = 0, l = keysNets.length; i < l; i++) {
				var dbName = 'nz_' + keysNets[i];
				var db = await this.dbInitMessages(dbName).then((db) => { return db; });
				var transaction = db.transaction('messages', 'readwrite');
				var messages = transaction.objectStore('messages');
				var request = messages.getAll();
				var x = new Promise((resolve, reject) => {
					request.onsuccess = function() { resolve(request.result); }
					request.onerror = function() { reject('Error: ' + openRequest.error); }
				});
				var result = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));

				let keysMessages = Object.keys(result);
				if (keysMessages.length > 0) for (var m = 0, n = keysMessages.length; m < n; m++) {
					if (this.knownMessages[keysNets[i]] === undefined) this.knownMessages[keysNets[i]] = {};
					this.knownMessages[keysNets[i]][result[keysMessages[m]].hash] = result[keysMessages[m]].timestamp;
				}

				await this.updateMonitorMessages({ net: keysNets[i] });
			}
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async addNet(net = {}) {
		net = Object.assign({
			net: 'ALPHA',
			status: false
		}, net);

		try {
			this.knownNets[net.net] = Object.assign({}, net);
			this.initMonitorMessages({ net: net.net });

			let db = await this.dbInitHub().then((db) => { return db; });
			let transaction = db.transaction('nets', 'readwrite');
			let nets = transaction.objectStore('nets');
			let request = nets.put(net);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => {
				console.log('\x1b[1m%s\x1b[0m', 'Put net:', net);
			});
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async addNode(node = {}) {
		node = Object.assign({
			keyID: '0fa208709bdbe958016d4c72bf61c7a5',
			net: 'ALPHA',
			prot: 'https',
			host: 'jebance.ru',
			port: 28262,
			rtt: 10,
			status: 'active'
		}, node);
		try {
			this.knownNodes[node.keyID] = Object.assign({}, node);

			if (this.knownNets[node.net] === undefined)
			this.knownNets[node.net] = { net: node.net, status: false };

			let db = await this.dbInitHub().then((db) => { return db; });
			let transaction = db.transaction('nodes', 'readwrite');
			let nodes = transaction.objectStore('nodes');
			let request = nodes.put(node);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => {
				console.log('\x1b[1m%s\x1b[0m', 'Put node:', node);
			});
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async firstNodesSearch() {
		try {
			let response = await fetch('https://raw.githubusercontent.com/JeBance/nzserver/refs/heads/gh-pages/hosts.json');
			if (!response.ok) throw new Error('Request failed');
			let list = await response.json();
			let nets = new Set();
			let keys = Object.keys(list);
			for (let i = 0, l = keys.length; i < l; i++) {
				if (this.knownNodes[keys[i]] === undefined)
				await this.addNode({
					keyID: keys[i],
					net: list[keys[i]].net,
					prot: list[keys[i]].prot,
					host: list[keys[i]].host,
					port: list[keys[i]].port,
					rtt: 10
				});
				nets.add(list[keys[i]].net);
			}
			this.nets = new Set([...nets]);
		} catch(e) {
			await this.addNode();
			this.nets = ['ALPHA'];
		}
	}

	async updateNode(keyID = '0fa208709bdbe958016d4c72bf61c7a5') {
		try {
			let node = await this.loadInfo(this.knownNodes[keyID]);
			if (!node) throw new Error('Node is not responding: ' + this.knownNodes[keyID].host);
			if (keyID !== node.keyID) throw new Error('Node has changed information: ' + this.knownNodes[keyID].host);
			this.knownNodes[keyID] = Object.assign({
				status: 'active'
			}, node);
			await this.loadNodes(this.knownNodes[keyID]);
		} catch(e) {
			if (this.config.log) console.log(e);
			this.knownNodes[keyID].status = 'blocked';
		}
	}

	async cyclicNodesCheck() {
		setInterval(async () => {
			if (!this.config.checkingNodes) return;
			let keys = Object.keys(this.knownNodes);
			if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
				if (this.knownNodes[keys[i]].status !== 'blocked')
				await this.updateNode(keys[i]);
			} else {
				await this.firstNodesSearch();
			}
		}, this.config.timeForCyclicNodesCheck);
	}

	async getFastNodes(net = 'ALPHA') {
		try {
			let result = [];
			let keys = Object.keys(this.knownNodes);
			if (keys.length <= 0) throw new Error('Node list is empty');

			for (let i = 0, l = keys.length; i < l; i++) {
				if (this.knownNodes[keys[i]].net === net
				&& this.knownNodes[keys[i]].prot === 'https'
				&& this.knownNodes[keys[i]].status !== 'blocked') {
					result.push(this.knownNodes[keys[i]]);
				}
			}
			if (result.length <= 0) throw new Error('Fast nodes list is empty');

			result.sort((a, b) => a.rtt > b.rtt ? 1 : -1);
			return result;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async addMessage(message) {
		try {
			if (message.hash === undefined) throw new Error('hash parameter is missing');
			if (message.timestamp === undefined) throw new Error('timestamp parameter is missing');
			if (message.message === undefined) throw new Error('message parameter is missing');
			if (message.net === undefined) throw new Error('net parameter is missing');

			if (this.knownMessages[message.net] === undefined)
			this.knownMessages[message.net] = {};
			this.knownMessages[message.net][message.hash] = message.timestamp;

			let dbName = 'nz_' + message.net;
			let db = await this.dbInitMessages(dbName).then((db) => { return db; });
			let transaction = db.transaction('messages', 'readwrite');
			let messages = transaction.objectStore('messages');
			let request = messages.put(message);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => {
				console.log('\x1b[1m%s\x1b[0m', 'Put message:', message);
			});

			return true;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async updateMessages(node = {}) {
		node = Object.assign({
			net: 'ALPHA',
			prot: 'https',
			host: 'jebance.ru',
			port: 28262
		}, node);

		try {
			let list = await this.loadMessages(node);
			if (!list) throw new Error('Failed to get message list');

			let keys = Object.keys(list);
			if (keys.length <= 0) throw new Error('List is empty');

			for (let i = 0, l = keys.length; i < l; i++) {
				if (this.knownMessages[node.net] === undefined
				|| this.knownMessages[node.net][keys[i]] === undefined) {
					var message = await this.loadMessage(keys[i], node);
					if (message) {
						message.net = node.net;
						await this.addMessage(message);
						document.dispatchEvent(new CustomEvent("newMessage", {
							detail: message
						}));
					}
				}
			}

			await this.updateMonitorMessages();
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async initMonitorMessages(params = {}) {
		params = Object.assign({
			net: 'ALPHA'
		}, params);

		try {
			if (this.monitorMessages[params.net] === undefined)
			this.monitorMessages[params.net] = {
				firstMessage: { hash: null, timestamp: new Date().getTime() },
				lastMessage: { hash: null, timestamp: 0 }
			};
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async updateMonitorMessages(params = {}) {
		params = Object.assign({
			net: 'ALPHA'
		}, params);

		try {
			await this.initMonitorMessages(params);
			let messages = await this.getMessages({ net: params.net });
			if (messages.length <= 0) throw new Error('Messages list is empty');

			await messages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
			if (messages[0].timestamp < this.monitorMessages[params.net].firstMessage.timestamp) {
				this.monitorMessages[params.net].firstMessage.hash = messages[0].hash;
				this.monitorMessages[params.net].firstMessage.timestamp = messages[0].timestamp;
			}
			this.monitorMessages[params.net].lastMessage.hash = messages[messages.length - 1].hash;
			this.monitorMessages[params.net].lastMessage.timestamp = messages[messages.length - 1].timestamp;
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async checkingMessages(net = 'ALPHA') {
		try {
			let fastNodes = await this.getFastNodes(net);
			if (!fastNodes) throw new Error('Node list is empty');

			let keys = Object.keys(fastNodes);
			if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
				if (fastNodes[keys[i]].lastMessage !== undefined
				&& fastNodes[keys[i]].lastMessage.hash !== this.monitorMessages[net].lastMessage.hash) {
					await this.updateMessages(fastNodes[keys[i]]);
				}
				if (i == 9) break;
			}
			
			return true;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async cyclicMessagesCheck() {
		setInterval(async () => {
			try {
				if (!this.config.checkingMessages) return;
				let keys = Object.keys(this.knownNets);
				if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
					if (this.knownNets[keys[i]].status === 'read')
					await this.checkingMessages(keys[i]);
				}
			} catch(e) {
				if (this.config.log) console.log(e);
			}
		}, this.config.timeForCyclicMessagesCheck);
	}

	async getNet(net = 'ALPHA') {
		try {
			if (this.knownNets[net] === undefined) throw new Error('This network is not listed');
			let result = Object.assign({ net: net }, this.knownNets[net]);

			let keys = Object.keys(this.knownNodes);
			if (keys.length > 0) {
				result.nodes = {};
				result.counts = { active: 0, blocked: 0 };
				for (let i = 0, l = keys.length; i < l; i++) {
					if (this.knownNodes[keys[i]].net === result.net) {
						result.nodes[keys[i]] = this.knownNodes[keys[i]];
						if (this.knownNodes[keys[i]].status === 'active') result.counts.active++;
						if (this.knownNodes[keys[i]].status === 'blocked') result.counts.blocked++;
					}
				}
			}

			return result;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async getMessages(params = {}) {
		params = Object.assign({
			net: 'ALPHA',
			getAll: true,
			getIndex: false,
			getValue: false
		}, params);

		try {
			let dbName = 'nz_' + params.net;

			let db = await this.dbInitMessages(dbName).then((db) => { return db; });
			let transaction = db.transaction('messages', 'readwrite');
			let messages = transaction.objectStore('messages');

			if (params.getAll && !params.getIndex) {
				var request = messages.getAll();

			} else if (params.getAll
			&& typeof params.getIndex === 'string'
			&& typeof params.getValue === 'string') {
				if (params.getIndex !== 'net' && params.getIndex !== 'timestamp')
				throw new Error('Index entered does not exist');

				let messageIndex = messages.index(params.getIndex);
				var request = messageIndex.getAll(params.getValue);
			}

			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
				request.onerror = function() { reject('Error: ' + openRequest.error); }
			});
			let result = await x.then((value) => { return value; }).catch((error) => console.log(`${error}`));
			return result;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

	async sendMessage(params = {}) {
		params = Object.assign({
			net: 'ALPHA',
			message: 'encryptedPGPstring'
		}, params);

		try {
			let fastNodes = await this.getFastNodes(params.net);
			if (!fastNodes) throw new Error('Node list is empty');

			let url = fastNodes[0].prot + '://' + fastNodes[0].host + ':' + fastNodes[0].port + '/';
			let response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=UTF-8',
					'Content-Length': params.message.length
				},
				body: params.message
			});
			if (!response.ok) throw new Error('Sending message failed');

			let result = await response.json();
			return result;
		} catch(e) {
			if (this.config.log) console.log(e);
			return false;
		}
	}

}
