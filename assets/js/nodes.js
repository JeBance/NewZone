class nodes {
	list;
	nets;

	constructor() {
		this.list = {};
	}

	async add(node = {
		keyID: '0fa208709bdbe958016d4c72bf61c7a5',
		net: 'ALPHA',
		prot: 'https',
		host: 'jebance.ru',
		port: 28262,
		ping: 10 } ) {
		try {
			this.list[node.keyID] = {
				net: node.net,
				prot: node.prot,
				host: node.host,
				port: node.port,
				ping: node.ping,
				status: 'active'
			};
			console.log('\x1b[1m%s\x1b[0m', 'New node:', this.list[node.keyID]);
		} catch(e) {
			console.log(e);
		}
	}

	async getInfo(address = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let url = address.prot + '://' + address.host + ':' + address.port + '/info';
			let pingStart = new Date().getTime();
			let response = await fetch(url);
			let pingFinish = new Date().getTime();
			let ping = pingFinish - pingStart;
			if (!response.ok) throw new Error('Request failed');
			let info = await response.json();
			info.ping = ping;
			return info;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async getNodes(address = { prot: 'https', host: 'jebance.ru', port: 28262 }) {
		try {
			let url = address.prot + '://' + address.host + ':' + address.port + '/getNodes';
			let response = await fetch(url);
			if (!response.ok) throw new Error('Request failed');
			let list = await response.json();
			let keys = Object.keys(list);
			for (let i = 0, l = keys.length; i < l; i++) {
				if (this.list[keys[i]] === undefined)
				this.add({
					keyID: keys[i],
					net: list[keys[i]].net,
					prot: list[keys[i]].prot,
					host: list[keys[i]].host,
					port: list[keys[i]].port,
					ping: 10
				});
			}
		} catch(e) {
			console.log(e);
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
				if (this.list[keys[i]] === undefined)
				await this.add({
					keyID: keys[i],
					net: list[keys[i]].net,
					prot: list[keys[i]].prot,
					host: list[keys[i]].host,
					port: list[keys[i]].port,
					ping: 10
				});
				nets.add(list[keys[i]].net);
			}
			this.nets = new Set([...nets]);
		} catch(e) {
			console.log(e);
		}
	}

	async updateNode(keyID = '0fa208709bdbe958016d4c72bf61c7a5') {
		try {
			let node = await this.getInfo(this.list[keyID]);
			if (node !== false && keyID === node.keyID) {
				this.list[keyID] = node;
				this.list[keyID].status = 'active';
				await this.getNodes(this.list[keyID]);
			} else {
				this.list[keyID].status = 'blocked';
			}
		} catch(e) {
			console.log(e);
		}
	}

	async cyclicNodesCheck() {
		setInterval(async () => {
			let keys = Object.keys(this.list);
			if (keys.length > 0) for (let i = 0, l = keys.length; i < l; i++) {
				if (this.list[keys[i]].status !== 'blocked')
				await this.updateNode(keys[i]);
			} else {
				await this.firstNodesSearch();
			}
		}, 3000);
	}

	async getFastNodes() {
		try {
			let result = [];
			let keys = Object.keys(this.list);
			if (keys.length <= 0) throw new Error('Node list is empty');

			for (let i = 0, l = keys.length; i < l; i++) {
				if (NODES.list[keys[i]].net === config.net
				&& NODES.list[keys[i]].prot === 'https'
				&& NODES.list[keys[i]].status !== 'blocked') {
					result.push(NODES.list[keys[i]]);
				}
			}
			result.sort((a, b) => a.ping > b.ping ? 1 : -1);

			return result;
		} catch(e) {
			console.log(e);
			return false;
		}
	}
}
