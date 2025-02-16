class UserInterface {

	hide(elem) {
		elem.setAttribute('class', 'hide');
	}

	hideAll(elemName) {
		let elements = document.getElementsByName(elemName);
		for (let i = 0, l = elements.length; i < l; i++) this.hide(elements[i]);
	}

	show(elem, attribute) {
		elem.setAttribute('class', attribute);
	}

	showAll(elemName, attribute) {
		let elements = document.getElementsByName(elemName);
		for (let i = 0, l = elements.length; i < l; i++) this.show(elements[i], attribute);
	}

	addKeyInfoBlock(elem, contact = {
		nickname: '',
		email: '',
		fingerprint: ''
	}) {
		elem.innerHTML = `
			<div class="desc"><p>Никнейм</p></div>
			<div class="val"><p>` + contact.nickname + `</p></div>
			<div class="desc"><p>E-mail</p></div>
			<div class="val"><p>` + contact.email + `</p></div>
			<div class="desc"><p>Отпечаток</p></div>
			<div class="val"><p>` + contact.fingerprint + `</p></div>
		`;
	}

	menuAnimation() {
		if ((menu.className == 'menu') || (menu.className == 'hideMenu menu')) {
			this.show(menu, 'showMenu menu');
			this.show(shade, 'shade');
		} else {
			this.show(menu, 'hideMenu menu');
			this.hide(shade);
		}
	}

	addContactButton(elem, contact = {
		nickname: '',
		email: '',
		fingerprint: ''
	}) {
		let newContact = document.createElement('div');
		newContact.id = contact.fingerprint;
		newContact.setAttribute('name', 'contact');
		newContact.className = 'leftItem';
		newContact.setAttribute('onclick', 'UI.click(this)');
		newContact.innerHTML = `
			<div class="avatar">👾</div>
			<div class="leftItemInfo">
				<div class="leftItemInfoTop">
					<div class="leftItemInfoName">` + contact.nickname + `</div>
				</div>
				<div class="leftItemInfoBottom">
					<div class="leftItemInfoText">` + contact.email + `</div>
				</div>
			</div>`;
		elem.append(newContact);
	}

	async refreshContactsList() {
		contactsList.innerHTML = '';
		let allContacts = await CONTACT.getAllContacts();
		for (let i = 0, l = allContacts.length; i < l; i++)
		this.addContactButton(contactsList, allContacts[i]);
	}

	async showContacts() {
		this.show(background, 'modal-background');
		await this.refreshContactsList();
		this.hideAll('modal');
		this.show(contacts, 'modal');
	}

	async checkPublicKeyMessage(chatID) {
		try {
			if (!chatID) throw new Error('Empty chat id');

			if (CHAT.contact.receivedContactMessage === true) return true;

			let allMessages = await MESSAGES.getAllFromChat(chatID);
			await allMessages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
			for (let i = 0, l = allMessages.length; i < l; i++) {
				if (allMessages[i].message.hasPGPpublicKeyStructure()) {
					CHAT.contact.receivedContactMessage = true;
					await CHAT.contact.save();
					return true;
				}
			}
			return false;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async sendPublicKeyMessage() {
		try {
			let messageObj = {
				chat: CHAT.id,
				from: PGP.fingerprint,
				to: CHAT.contact.fingerprint,
				message: PGP.publicKeyArmored
			};

			let result = false;
			let publicKeyMessage = await PGP.encryptMessage(CHAT.contact.publicKey, JSON.stringify(messageObj));
			if (publicKeyMessage) result = await NZHUB.sendMessage({ net: config.net, message: publicKeyMessage });
			if (!result) throw new Error('');
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async click(elem) {
		let init, check, nickname, email, fingerprint, publicKey;
		try {

			switch(elem.id) {
				case 'buttonStart':
					this.hide(buttonStart);
					this.show(selectNodeBlock, 'flex');
					if (!selectNode.hasChildNodes()) loader.show(start, selectNodeBlock);
					NZHUB.config.checkingNodes = true;
					break;

				case 'buttonSelectNode':
					config.net = selectNode.value;
					NZHUB.addNet({ net: selectNode.value, status: 'read' });
					this.hide(selectNodeBlock);
					this.hideAll('modal');
					this.hideAll('backToSettings');
					this.show(containerHeader, 'header');
					if (PGP.active) {
						await container.generate();
					} else {
						container.choice();
					}
					this.show(container, 'modal flex-start');
					break;

				case 'buttonContacts':
					this.menuAnimation();
					this.showContacts();
					break;

				case 'buttonSettings':
					this.show(background, 'modal-background');
					this.menuAnimation();
					this.hideAll('modal');
					this.show(settings, 'modal');
					break;

				case 'buttonSettingsContainer':
					this.hideAll('modal');
					this.show(container, 'modal');
					break;

				case 'buttonContactAdd':
				case 'buttonContactSave':
				case 'contactNameInput':
					if (contactNameInput.value.length > 0) {
						CONTACT.nickname = contactNameInput.value;
						contactNameInput.readOnly = true;
						this.hide(buttonContactAdd);
						this.show(buttonContactEdit, 'btn btn-start');
						this.hide(buttonContactSave);
						this.show(buttonContactChat, 'btn btn-start');
						CONTACT.nickname = contactNameInput.value;
						await CONTACT.save();
					} else {
						alert('Введите имя контакта');
					}
					break;
		
				case 'buttonContactEdit':
					contactNameInput.readOnly = false;
					this.hide(buttonContactAdd);
					this.hide(buttonContactEdit);
					this.show(buttonContactSave, 'btn btn-start');
					this.hide(buttonContactChat);
					break;

				case 'buttonContactChat':
					var chatID = await getNameForPrivateChat(CONTACT.fingerprint, PGP.fingerprint);
					if (!chatID) throw new Error('Empty chat id');
					let loadChatComplete = await CHAT.show(chatID);
					if (!loadChatComplete) throw new Error('Не удалось загрузить чат');
					this.hide(contact);
					break;

				default:
					break;
			}
	
			switch(elem.getAttribute("name")) {
				case 'menu':
					this.menuAnimation();
					break;

				case 'qrScanner':
					this.show(background, 'modal-background');
					this.show(qrScanner, 'modal');
					this.show(qrInfo, 'show');
					html5QrCode.start({ facingMode: "environment" }, config.qrScan, qrCodeSuccessCallback);
					break;

				case 'backToMain':
					if (!PGP.active) throw new Error('Container not connected');
					this.hideAll('modal');
					this.hide(background);
					if (html5QrCode.isScanning === true) html5QrCode.stop();
					CONTACT.clear();
					CHATS.show();
					break;
	
				case 'backToSettings':
					this.hideAll('modal');
					this.show(settings, 'modal');
					break;

				case 'backToContacts':
					this.showContacts();
					CONTACT.clear();
					break;

				case 'backToChats':
					this.hide(blockCenter);
					this.show(blockLeft, 'left');
					CONTACT.clear();
					CHATS.show();
					break;

				case 'contact':
					let contactInitResult = await CONTACT.init({ fingerprint: elem.id });
					if (!contactInitResult) throw new Error('Contact initialization failed');

					contactNameInput.value = CONTACT.nickname;
					contactEmailInput.value = CONTACT.email;
					contactFingerprintInput.value = CONTACT.fingerprint;

					this.hide(contacts);
					this.show(background, 'modal-background');
					this.show(contact, 'modal');
					contactNameInput.readOnly = true;
					this.hide(buttonContactAdd);
					this.show(buttonContactEdit, 'btn btn-start');
					this.hide(buttonContactSave);
					this.show(buttonContactChat, 'btn btn-start');
					break;

				default:
					break;
			}
	
		} catch(e) {
			console.log(e);
		}		
	}

	async sendMessage() {
		try {
			if (messageInput.value <= 0) throw new Error('Input empty');

			let check = await this.checkPublicKeyMessage(CHAT.id);
			if (check === false) {
				let resultSendingContactMessage = await this.sendPublicKeyMessage();
				if (!resultSendingContactMessage) throw new Error('Failed to send contact message');
				CHAT.contact.receivedContactMessage = true;
				await CHAT.contact.save();
			}
			
			let messageObj = {
				chat: CHAT.id,
				from: PGP.fingerprint,
				to: CHAT.contact.fingerprint,
				message: messageInput.value
			};

			if (messageObj.from !== messageObj.to) {
				let encryptedToRecipient = await PGP.encryptMessage(CHAT.contact.publicKey, JSON.stringify(messageObj));
				let resultSendMessageTR = await NZHUB.sendMessage({ net: config.net, message: encryptedToRecipient });
				if (!resultSendMessageTR) throw new Error('Failed to send message');
			}

			let encryptedToSender = await PGP.encryptMessage(PGP.publicKeyArmored, JSON.stringify(messageObj));
			let resultSendMessageTS = await NZHUB.sendMessage({ net: config.net, message: encryptedToSender });
			if (!resultSendMessageTS) throw new Error('Failed to send message');

			let message = {
				hash: resultSendMessageTS.hash,
				timestamp: resultSendMessageTS.timestamp,
				chat: CHAT.id,
				from: PGP.fingerprint,
				message: messageInput.value,
				wasRead: true
			}

			messageInput.value = '';
			document.dispatchEvent(new CustomEvent("newMessage", { detail: message }));
			MESSAGES.add(message);
		} catch(e) {
			console.log(e);
		}
	}

}
