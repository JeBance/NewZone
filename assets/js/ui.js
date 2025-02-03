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

	addKeyInfoBlock(elem, obj = {
		nickname: '',
		email: '',
		fingerprint: ''
	}) {
		elem.innerHTML = `
			<div class="desc"><p>Никнейм</p></div>
			<div class="val"><p>` + obj.nickname + `</p></div>
			<div class="desc"><p>E-mail</p></div>
			<div class="val"><p>` + obj.email + `</p></div>
			<div class="desc"><p>Отпечаток</p></div>
			<div class="val"><p>` + obj.fingerprint + `</p></div>
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

	addContactButton(elem, obj = {
		nickname: '',
		email: '',
		fingerprint: ''
	}) {
		let newContact = document.createElement('div');
		newContact.id = obj.fingerprint;
		newContact.setAttribute('name', 'contact');
		newContact.className = 'leftItem';
		newContact.setAttribute('onclick', 'UI.click(this)');
		newContact.innerHTML = `
			<div class="avatar">👾</div>
			<div class="leftItemInfo">
				<div class="leftItemInfoTop">
					<div class="leftItemInfoName">` + obj.nickname + `</div>
				</div>
				<div class="leftItemInfoBottom">
					<div class="leftItemInfoText">` + obj.email + `</div>
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
		this.hideAll('modal');
		await this.refreshContactsList();
		this.show(background, 'modal-background');
		this.show(contacts, 'modal');
	}

	async refreshChatsList() {
	}

	async showChats() {
	}

	async showChat(chatID) {
		try {
			chatReadArea.innerHTML = '';
			topChatInfoName.innerHTML = localStorage.recipientNickname;
			let allMessages = await MESSAGES.getAllMessagesFromChat(chatID);
			await allMessages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
			for (let i = 0, l = allMessages.length; i < l; i++) {
				this.showMessage(allMessages[i]);
			}
			this.show(blockCenter, 'center');
			blockCenterCenter.scrollTop = blockCenterCenter.scrollHeight;
			if (document.documentElement.clientWidth < 800) {
				this.hide(blockLeft);
			}
			return true;
		} catch(e) {
			alert('Что-то пошло не так =/');
			console.log(e);
			return false;
		}
	}

	async showMessage(message) {
		let newContainerForMessage = document.createElement('div');
		newContainerForMessage.id = message.hash;
		newContainerForMessage.setAttribute('name', 'message');
		(message.from == PGP.fingerprint)
		? newContainerForMessage.className = 'message outgoingMessage'
		: newContainerForMessage.className = 'message incomingMessage';

		if (hasPGPstructure(message.message)) {
			let decrypted = await PGP.decryptMessageWithVerificationKey(message.message, localStorage.recipientPublicKey);
			if (!decrypted) throw new Error("Can't decrypt message");
			message.message = decrypted;
			MESSAGES.add(message);
		}

		newContainerForMessage.innerHTML = message.message;

		let newContainerForTime = document.createElement('div');
		newContainerForTime.setAttribute('name', 'message');
		(message.from == message.chat)
		? newContainerForTime.className = 'leftMessageTime'
		: newContainerForTime.className = 'rightMessageTime';
		newContainerForTime.innerHTML = timestampToTime(message.timestamp);

		newContainerForMessage.append(newContainerForTime);
		chatReadArea.append(newContainerForMessage);
		blockCenterCenter.scrollTop = blockCenterCenter.scrollHeight;
	}

	async checkPublicKeyMessage() {
		try {
			let allMessages = await MESSAGES.getAllMessagesFromChat(localStorage.recipientFingerprint);
			if (allMessages.length <= 0) {
				let publicKeyMessage = await PGP.encryptMessage(localStorage.recipientPublicKey, PGP.publicKeyArmored);
				if (publicKeyMessage) MESSAGES.sendMessage(publicKeyMessage);
			}
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}


	async sendMessage(string) {
		try {
			let encrypted = await PGP.encryptMessage(localStorage.recipientPublicKey, string);
			let resultSendMessage = await MESSAGES.sendMessage(encrypted);
			if (!resultSendMessage) throw new Error('Failed to send message');
			let message = {
				hash: resultSendMessage.hash,
				timestamp: resultSendMessage.timestamp,
				message: string
			}
			
			//	add await MESSAGES.checkSendedMessage(message); ??????????

			return message;
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
					NODES.cyclicNodesCheck();
					this.show(selectNodeBlock, 'flex');
					loader.show(start, selectNodeBlock);
					fillingNodeNetsSelectionOtions;
					break;

				case 'buttonSelectNode':
					config.net = selectNode.value;
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
					this.menuAnimation();
					this.hideAll('modal');
					this.show(background, 'modal-background');
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
						nickname = contactNameInput.value;
						email = localStorage.recipientEmail;
						fingerprint = localStorage.recipientFingerprint;
						publicKey = localStorage.recipientPublicKey;

						init = await CONTACT.init({
							nickname: nickname,
							email: email,
							fingerprint: fingerprint,
							publicKey: publicKey
						});
		
						if (!init) throw new Error('Failed to initialize contact');
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
					contactNameInput.value = '';
					contactEmailInput.value = '';
					contactFingerprintInput.value = '';
					
					let loadChatComplete = await this.showChat(localStorage.recipientFingerprint);
					if (!loadChatComplete) throw new Error('Не удалось загрузить чат');

					this.hide(contact);
					break;

				case 'buttonSendMessage':
					this.checkPublicKeyMessage();

					if (messageInput.value <= 0) throw new Error('Input empty');
					let message = await this.sendMessage(messageInput.value);
					if (!message) throw new Error('Failed to send message');
					message.chat = localStorage.recipientFingerprint;
					message.from = PGP.fingerprint;
					message.wasRead = true;
					
					MESSAGES.add(message);
					messageInput.value = '';
					await this.showMessage(message);
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
					break;
	
				case 'backToSettings':
					this.hideAll('modal');
					this.show(settings, 'modal');
					break;

				case 'backToContacts':
					this.showContacts();
					break;

				case 'backToChats':
					localStorage.recipientNickname = '';
					localStorage.recipientEmail = '';
					localStorage.recipientFingerprint = '';
					localStorage.recipientPublicKey = '';
					this.hide(blockCenter);
					this.show(blockLeft, 'left');
					break;

				case 'contact':
					check = await CONTACT.check(elem.id);
					if (!check) throw new Error('Contact not found');
					
					localStorage.recipientNickname = check.nickname;
					localStorage.recipientEmail = check.email;
					localStorage.recipientFingerprint = check.fingerprint;
					localStorage.recipientPublicKey = check.publicKey;

					contactNameInput.value = check.nickname;
					contactEmailInput.value = check.email;
					contactFingerprintInput.value = check.fingerprint;

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

}
