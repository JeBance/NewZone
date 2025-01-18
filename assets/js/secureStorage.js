class SecureStorage {
	nickname;
	email;
	fingerprint;
	publicKeyArmored;
	#privateKeyArmored;
	#publicKey;
	#privateKey;
	#passphrase;

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
			this.#publicKey = await openpgp.readKey({ armoredKey: publicKey });
			this.#privateKey = await openpgp.decryptKey({
				privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
				passphrase
			});
			this.#passphrase = passphrase;
			this.nickname = this.#publicKey.users[0].userID.name;
			this.email = this.#publicKey.users[0].userID.email;
			this.fingerprint = await this.#publicKey.getFingerprint();
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async openStorage(data, passphrase) {
		try {
			let message = await openpgp.readMessage({
				armoredMessage: data
			});
			try {
				const { data: decrypted } = await openpgp.decrypt({
					message: message,
					passwords: [ passphrase ],
				});
				if (decrypted.isJsonString() !== false) {
					let parseData = JSON.parse(decrypted);
					try {
						this.#publicKey = await openpgp.readKey({ armoredKey: parseData.publicKey });
						this.fingerprint = (this.#publicKey.getFingerprint()).toUpperCase();
						this.nickname = this.#publicKey.users[0].userID.name;
						this.email = this.#publicKey.users[0].userID.email;
						try {
							this.#privateKey = await openpgp.decryptKey({
								privateKey: await openpgp.readPrivateKey({ armoredKey: parseData.privateKey }),
								passphrase
							});
						} catch(e) {
							alert('Не удалось прочитать приватный ключ из хранилища ключей!');
						}
					} catch(e) {
						alert('Не удалось прочитать публичный ключ из хранилища ключей!');
					}
					this.publicKeyArmored = parseData.publicKey;
					this.#privateKeyArmored = parseData.privateKey;
					this.#passphrase = passphrase;
				} else {
					console.log(decrypted.isJsonString());
					alert('Контейнер повреждён!');
				}
			} catch(e) {
				alert('Неверный пароль!');
			}
		} catch(e) {
			alert('Файл не является защищённым хранилищем ключей!');
		}
	}

	activeAllSecureData() {
		let check = false;
		((this.#publicKey)
		&& (this.#privateKey)
		&& (this.publicKeyArmored)
		&& (this.#privateKeyArmored)
		&& (this.#passphrase)) ? check = true : check = false;
		return check;
	}

	eraseAllSecureData() {
		this.publicKeyArmored = '';
		this.#privateKeyArmored = '';
		this.#publicKey = {};
		this.#privateKey = {};
		this.#passphrase = '';
		this.fingerprint = '';
	}

	async generateSecureFile() {
		let string = JSON.stringify({
			publicKey: this.publicKeyArmored,
			privateKey: this.#privateKeyArmored
		});
		let encrypted = await openpgp.encrypt({
			message: await openpgp.createMessage({ text: string }),
			passwords: [ this.#passphrase ],
			config: { preferredCompressionAlgorithm: openpgp.enums.compression.zlib }
		});
		let fileHref = 'data:application/pgp-encrypted,' + encodeURIComponent(encrypted);
		return fileHref;
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

	async readMessage(data) {
		try {
			let message = await openpgp.readMessage({ armoredMessage: data });
			return message;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async encryptMessage(recipientPublicKey, message) {
		let passphrase = this.#passphrase;
		try {
			const publicKey = await openpgp.readKey({ armoredKey: recipientPublicKey });
			const privateKey = this.#privateKey;
			try {
				const encrypted = await openpgp.encrypt({
					message: await openpgp.createMessage({ text: message }),
					encryptionKeys: publicKey,
					signingKeys: privateKey
				});
				return encrypted;
			} catch(e) {
				alert('Не удалось зашифровать сообщение!');
			}
		} catch(e) {
			alert('Не удалось прочитать публичный ключ получателя!');
		}
		return false;
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
			let verificationKey = await openpgp.readKey({ armoredKey: verificationKeyArmored });
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
			const publicKeyArmored = this.publicKeyArmored;
			const privateKeyArmored = this.#privateKeyArmored;
			const passphrase = this.#passphrase;

			const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
			const privateKey = await openpgp.decryptKey({
				privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
				passphrase
			});

			const encrypted = await openpgp.encrypt({
				message: await openpgp.createMessage({ text: string }),
				encryptionKeys: publicKey,
				signingKeys: privateKey
			});
			console.log(encrypted);


			let url = 'https://jebance.ru:28262/';
			let response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'text/plain;charset=UTF-8',
					'Content-Length': encrypted.length
				},
				body: encrypted
			});
			console.log(encrypted.length);
			console.log(response);
			if (response.ok) console.log(await response.json());


			let message = await this.readMessage(encrypted);
			if (!message) throw new Error("Can't read message");

			const { data: decrypted, signatures } = await openpgp.decrypt({
				message,
				verificationKeys: publicKey,
				decryptionKeys: privateKey
			});
			console.log(decrypted);

			try {
				await signatures[0].verified;
				console.log('Signature is valid');
			} catch(e) {
				throw new Error('Signature could not be verified: ' + e.message);
			}
		} catch(e) {
			console.log(e);
		}
	}

}
