class SecureStorage {
	active;
	nickname;
	email;
	fingerprint;
	publicKeyArmored;
	#privateKeyArmored;
	#publicKey;
	#privateKey;
	#passphrase;

	constructor() {
		this.active = false;
	}

	async createStorage(name, email, passphrase) {
		try {
			const { privateKey, publicKey } = await openpgp.generateKey({
				type: 'ecc', // Type of the key, defaults to ECC
				curve: 'curve25519', // ECC curve name, defaults to curve25519
				userIDs: [{ name: name, email: email }], // you can pass multiple user IDs
				passphrase: passphrase, // protects the private key
				format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
			});

			this.publicKeyArmored = publicKey;
			this.#privateKeyArmored = privateKey;
			this.#publicKey = await this.readKey(publicKey);
			this.#privateKey = await this.decryptKey(privateKey, passphrase);
			this.#passphrase = passphrase;
			this.nickname = this.#publicKey.users[0].userID.name;
			this.email = this.#publicKey.users[0].userID.email;
			this.fingerprint = await this.#publicKey.getFingerprint();
			this.active = true;

			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async openStorage(encrypted, passphrase) {
		try {
			let message = await this.readMessage(encrypted);
			if (!message) throw new Error('The file is not a secure keystore');

			const decrypted = await this.decryptMessageSymmetricallyWithCompression(encrypted, passphrase);
			if (!decrypted) throw new Error('Incorrect password');

			if (!decrypted.isJsonString()) throw new Error('Container damaged');
			let parsed = JSON.parse(decrypted);

			this.publicKeyArmored = parsed.publicKey;
			this.#privateKeyArmored = parsed.privateKey;

			this.#publicKey = await this.readKey(this.publicKeyArmored);
			if (!this.#publicKey) throw new Error('Failed to read public key from keystore');
			
			this.#privateKey = await this.decryptKey(this.#privateKeyArmored, passphrase);
			if (!this.#privateKey) throw new Error('Failed to read private key from keystore');

			this.#passphrase = passphrase;
			this.nickname = this.#publicKey.users[0].userID.name;
			this.email = this.#publicKey.users[0].userID.email;
			this.fingerprint = this.#publicKey.getFingerprint();
			this.active = true;

			return true;
		} catch(e) {
			return e;
		}
	}

	eraseAllSecureData() {
		this.publicKeyArmored = '';
		this.#privateKeyArmored = '';
		this.#publicKey = {};
		this.#privateKey = {};
		this.#passphrase = '';
		this.nickname = '';
		this.email = '';
		this.fingerprint = '';
		this.active = false;
	}

	async generateSecureFile() {
		try {
			let string = JSON.stringify({
				publicKey: this.publicKeyArmored,
				privateKey: this.#privateKeyArmored
			});
			let encrypted = await this.encryptMessageSymmetricallyWithCompression(string, this.#passphrase);
			if (!encrypted) throw new Error('Failed to generate secure container');
			let fileHref = 'data:application/pgp-encrypted,' + encodeURIComponent(encrypted);
			return fileHref;
		} catch(e) {
			console.log(e);
			return false;
		}
	}
	
	async readKey(publicKeyArmored) {
		try {
			let key = await openpgp.readKey({ armoredKey: publicKeyArmored });
			return key;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async decryptKey(privateKeyArmored, passphrase) {
		try {
			let privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
			let key = await openpgp.decryptKey({
				privateKey: privateKey,
				passphrase
			});
			return key;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async readMessage(data) {
		try {
			let message = await openpgp.readMessage({ armoredMessage: data });
			return message;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async encrypt(publicKey, privateKey, message) {
		try {
			const encrypted = await openpgp.encrypt({
				message: await openpgp.createMessage({ text: message }),
				encryptionKeys: publicKey,
				signingKeys: privateKey
			});
			return encrypted;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async encryptMessage(recipientPublicKey, message) {
		try {
			let publicKey = await this.readKey(recipientPublicKey);
			if (!publicKey) throw new Error("Failed to read recipient's public key");

			let encrypted = await this.encrypt(publicKey, this.#privateKey, message);
			if (!encrypted) throw new Error('Failed to encrypt message');

			return encrypted;
		} catch(e) {
			alert(e);
			return false;
		}
	}

	async decryptMessage(encrypted) {
		try {
			let message = await this.readMessage(encrypted);
			if (!message) throw new Error("Can't read message");

			const { data: decrypted, signatures } = await openpgp.decrypt({
				message,
				decryptionKeys: this.#privateKey
			});

			return decrypted;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async decryptMessageWithVerificationKey(encrypted, verificationKeyArmored) {
		try {
			let message = await this.readMessage(encrypted);
			if (!message) throw new Error("Can't read message");

			let verificationKey = await this.readKey(verificationKeyArmored);
			if (!verificationKey) throw new Error("Failed to read verification key");

			const { data: decrypted, signatures } = await openpgp.decrypt({
				message,
				verificationKeys: verificationKey,
				decryptionKeys: this.#privateKey
			});

			await signatures[0].verified;

			return decrypted;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async encryptMessageSymmetricallyWithCompression(string, passphrase) {
		try {
			let encrypted = await openpgp.encrypt({
				message: await openpgp.createMessage({ text: string }),
				passwords: [ passphrase ],
				config: { preferredCompressionAlgorithm: openpgp.enums.compression.zlib }
			});
			return encrypted;
		} catch(e) {
			console.error('Симметричное шифрование не выполнено! Ошибка: ' + e.message);
			return false;
		}
	}

	async decryptMessageSymmetricallyWithCompression(encrypted, passphrase) {
		try {
			let message = await this.readMessage(encrypted);
			if (!message) throw new Error("Can't read message");

			const { data: decrypted } = await openpgp.decrypt({
				message: message,
				passwords: [ passphrase ],
			});

			return decrypted;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async sendTestMessage(string = 'Hello New Zone!') {
		try {
			let encrypted = await this.encryptMessage(this.publicKeyArmored, string);
			if (!encrypted) throw new Error("Can't encrypt message");
			console.log(encrypted.length + ': ' + encrypted);

			let url = 'https://jebance.ru:28262/';
			let response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=UTF-8',
					'Content-Length': encrypted.length
				},
				body: encrypted
			});
			console.log(response);
			if (response.ok) console.log(await response.json());

			let message = await this.readMessage(encrypted);
			if (!message) throw new Error("Can't read message");

			let decrypted = await this.decryptMessageWithVerificationKey(encrypted, this.publicKeyArmored);
			console.log(decrypted);
		} catch(e) {
			console.log(e);
		}
	}

}
