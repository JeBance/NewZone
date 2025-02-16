class Chat {

	constructor() {
		this.id = '';
		this.contact = new Contact();
		document.addEventListener("newMessage", (event) => {
			if (event.detail.chat === this.id) this.addMessage(event.detail);
		});
	}

	async show(chatID) {
		try {
			let fingerprints = await getFingerprintsFromPrivateChat(chatID);
			if (!fingerprints) throw new Error('This chat is not private');

			let recipientFingerprint;
			(fingerprints.f1 !== PGP.fingerprint)
			? recipientFingerprint = fingerprints.f1
			: recipientFingerprint = fingerprints.f2;

			let contactInitResult = await this.contact.init({ fingerprint: recipientFingerprint });
			if (!contactInitResult) throw new Error('Contact initialization failed');

			chatReadArea.innerHTML = '';
			topChatInfoName.innerHTML = this.contact.nickname;
			topChatInfoText.innerHTML = this.contact.email;
			let allMessages = await MESSAGES.getAllFromChat(chatID);
			await allMessages.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1);
			for (let i = 0, l = allMessages.length; i < l; i++) {
				this.addMessage(allMessages[i]);
			}
			UI.show(blockCenter, 'center');
			blockCenterCenter.scrollTop = blockCenterCenter.scrollHeight;
			if (document.documentElement.clientWidth < 800) {
				UI.hide(blockLeft);
			}
			this.id = chatID;
			return true;
		} catch(e) {
			console.log(e);
			return false;
		}
	}

	async addMessage(message) {
		try {
			let newContainerForMessage = document.createElement('div');
			newContainerForMessage.id = message.hash;
			newContainerForMessage.setAttribute('name', 'message');
			(message.from == PGP.fingerprint)
			? newContainerForMessage.className = 'message outgoingMessage'
			: newContainerForMessage.className = 'message incomingMessage';

			if (message.message.hasPGPpublicKeyStructure()) return;

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

}
