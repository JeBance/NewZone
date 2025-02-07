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
		await this.refreshContactsList();
		this.hideAll('modal');
		this.show(background, 'modal-background');
		this.show(contacts, 'modal');
	}

	addChatButton(elem, chat = {
		id: '',
		title: '',
		timestamp: '',
		lastmessage: '',
		unreadMessages: 0		
	}) {
		let newContainerForChat = document.createElement('div');
		newContainerForChat.id = chat.id;
		newContainerForChat.setAttribute('name', 'chat');
		newContainerForChat.className = 'leftItem';
		newContainerForChat.setAttribute('onclick', 'chat.getChat(\'' + chat.id + '\')');

		let newDivForAvatar = document.createElement('div');
		newDivForAvatar.className = 'avatar';

		let newDivForLeftItemInfo = document.createElement('div');
		newDivForLeftItemInfo.className = 'leftItemInfo';

		let newDivForLeftItemInfoTop = document.createElement('div');
		newDivForLeftItemInfoTop.className = 'leftItemInfoTop';

		let newDivForLeftItemInfoBottom = document.createElement('div');
		newDivForLeftItemInfoBottom.className = 'leftItemInfoBottom';

		let newDivForLeftItemInfoName = document.createElement('div');
		newDivForLeftItemInfoName.className = 'leftItemInfoName';
		newDivForLeftItemInfoName.innerHTML = chat.title;

		let newDivForLeftItemInfoTime = document.createElement('div');
		newDivForLeftItemInfoTime.className = 'leftItemInfoTime';
		newDivForLeftItemInfoTime.innerHTML = timestampToTime(chat.timestamp);

		let newDivForLeftItemInfoText = document.createElement('div');
		newDivForLeftItemInfoText.className = 'leftItemInfoText';
		newDivForLeftItemInfoText.innerHTML = chat.message;

		let newDivForLeftItemInfoCounter = document.createElement('div');
		newDivForLeftItemInfoCounter.setAttribute('name', 'inboxCounter');
		newDivForLeftItemInfoCounter.className = 'leftItemInfoCounter';
		if (chat.unreadMessages > 0) newDivForLeftItemInfoCounter.innerHTML = chat.unreadMessages;

		newDivForLeftItemInfoTop.append(newDivForLeftItemInfoName);
		newDivForLeftItemInfoTop.append(newDivForLeftItemInfoTime);
		newDivForLeftItemInfoBottom.append(newDivForLeftItemInfoText);
		newDivForLeftItemInfoBottom.append(newDivForLeftItemInfoCounter);
		newDivForLeftItemInfo.append(newDivForLeftItemInfoTop);
		newDivForLeftItemInfo.append(newDivForLeftItemInfoBottom);
		newContainerForChat.append(newDivForAvatar);
		newContainerForChat.append(newDivForLeftItemInfo);
		elem.append(newContainerForChat);
	}

	async refreshChatsList() {
		try {
			chats.innerHTML = '';
			let allMessages = await MESSAGES.getAllMessages();
			let allChats = new Object();
			let unreadMessages = new Object();
			let tmpContact = new Contact();
			let num = 0;

console.log(allMessages);
			for (let i = -1, l = allMessages.length - 1; l !== i; l--) {
console.log(l + ': ' + allMessages[l].chat);
				if (typeof allMessages[l].chat !== 'string') continue;
				if ((allMessages[l].chat in allChats) === false) {
					await tmpContact.init({ fingerprint: allMessages[l].chat });
					allChats[num] = {
						id: allMessages[l].chat,
						title: tmpContact.nickname,
						timestamp: allMessages[l].timestamp,
						lastmessage: allMessages[l].message,
						unreadMessages: 0
					};

					unreadMessages[allMessages[l].chat] = 0;

					if (allMessages[l].wasRead === false)
					unreadMessages[allMessages[l].chat]++;
					num++;
				} else {
					if (allMessages[l].wasRead === false)
					unreadMessages[allMessages[l].chat]++;
				}
			}

console.log(allChats);

			for (let m = 0, n = allChats.length; m < n; m++) {
				allChats[m].unreadMessages = unreadMessages[allChats[m].id];
				this.addChatButton(chats, allChats[m]);
			}

		} catch(e) {
			console.log(e);
		}

	}

	async showChats() {
		this.refreshChatsList();
		this.hideAll('modal');
		this.show(background, 'modal-background');
		this.show(blockLeft, 'left');
	}

	async showChat(chatID) {
		try {
			if (CONTACT.publicKey === undefined) {
				let contactInitResult = await CONTACT.init({ fingerprint: chatID });
				if (!contactInitResult) throw new Error('Contact initialization failed');
			}

			chatReadArea.innerHTML = '';
			topChatInfoName.innerHTML = CONTACT.nickname;
			topChatInfoText.innerHTML = CONTACT.email;
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
		try {
			let newContainerForMessage = document.createElement('div');
			newContainerForMessage.id = message.hash;
			newContainerForMessage.setAttribute('name', 'message');
			(message.from == message.chat)
			? newContainerForMessage.className = 'message outgoingMessage'
			: newContainerForMessage.className = 'message incomingMessage';

			if (message.message.hasPGPpublicKeyStructure()) throw new ('Contact message found');

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
		} catch(e) {
			console.log(e);
		}
	}

	async checkPublicKeyMessage() {
		try {
			if (CONTACT.receivedContactMessage === true) return true;
			let allMessages = await MESSAGES.getAllMessagesFromChat(CONTACT.fingerprint);
			await allMessages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
			for (let i = 0, l = allMessages.length; i < l; i++) {
				if (allMessages[i].message.hasPGPpublicKeyStructure()) {
					CONTACT.receivedContactMessage = true;
					await CONTACT.save();
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
			let publicKeyMessage = await PGP.encryptMessage(CONTACT.publicKey, PGP.publicKeyArmored);
			if (publicKeyMessage) await MESSAGES.sendMessage(publicKeyMessage);
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
					let loadChatComplete = await this.showChat(CONTACT.fingerprint);
					if (!loadChatComplete) throw new Error('Не удалось загрузить чат');
					this.hide(contact);
					break;

				case 'buttonSendMessage':
					if (messageInput.value <= 0) throw new Error('Input empty');

					if (this.checkPublicKeyMessage() === false) {
						let resultSendingContactMessage = await this.sendPublicKeyMessage();
						if (!resultSendingContactMessage) throw new Error('Failed to send contact message');
						CONTACT.receivedContactMessage = true;
						await CONTACT.save();
					}

					let encrypted = await PGP.encryptMessage(CONTACT.publicKey, messageInput.value);
					let resultSendMessage = await MESSAGES.sendMessage(encrypted);
					if (!resultSendMessage) throw new Error('Failed to send message');

					let message = {
						hash: resultSendMessage.hash,
						timestamp: resultSendMessage.timestamp,
						chat: CONTACT.fingerprint,
						from: PGP.fingerprint,
						message: messageInput.value,
						wasRead: true
					}
					
					//	add await MESSAGES.checkSendedMessage(message); ??????????

					await MESSAGES.add(message);
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
					CONTACT.clear();
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
					this.showChats();
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

}
