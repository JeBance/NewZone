class Chats {

	constructor(elem) {
		document.addEventListener("newMessage", (event) => {
			this.refreshChatsList();
		});
	}

	async addChatButton(elem, chat = {}) {
		chat = Object.assign({
			id: '',
			title: '',
			timestamp: '',
			lastMessage: '',
			unreadMessages: 0		
		}, chat);

		try {
			let newContainerForChat = document.createElement('div');
			newContainerForChat.id = chat.id;
			newContainerForChat.setAttribute('name', 'chat');
			newContainerForChat.className = 'leftItem';
			newContainerForChat.setAttribute('onclick', 'CHAT.show(\'' + chat.id + '\')');

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
			newDivForLeftItemInfoText.innerHTML = chat.lastMessage;

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
		} catch(e) {
			console.log(e);
		}
	}

	async refreshChatsList() {
		let fingerprints, recipientFingerprint;
		try {
			let allMessages = await MESSAGES.getAll();
			let allChats = {};
			allChats.list = [];
			let unreadMessages = {};
			let tmpContact = new Contact();
			let num = 0;

			for (let i = -1, l = allMessages.length - 1; l !== i; l--) {
				if (typeof allMessages[l].chat !== 'string') continue;
				try {
					if (allChats.list.includes(allMessages[l].chat) === false) {
						fingerprints = await getFingerprintsFromPrivateChat(allMessages[l].chat);
						if (!fingerprints) throw new Error('This chat is not private');

						(fingerprints.f1 !== PGP.fingerprint)
						? recipientFingerprint = fingerprints.f1
						: recipientFingerprint = fingerprints.f2;

						await tmpContact.init({ fingerprint: recipientFingerprint });
						allChats[num] = {
							id: allMessages[l].chat,
							title: tmpContact.nickname,
							timestamp: allMessages[l].timestamp,
							lastMessage: allMessages[l].message,
							unreadMessages: 0
						};

						unreadMessages[allMessages[l].chat] = 0;

						if (allMessages[l].wasRead === false)
						unreadMessages[allMessages[l].chat]++;
						num++;
						allChats.list.push(allMessages[l].chat);
					} else {
						if (allMessages[l].wasRead === false)
						unreadMessages[allMessages[l].chat]++;
					}
				} catch(e) {
					console.log(e);
				}
			}

			chats.innerHTML = '';

			for (let m = 0, n = allChats.list.length; m < n; m++) {
				allChats[m].unreadMessages = unreadMessages[allChats[m].id];
				await this.addChatButton(chats, allChats[m]);
			}

		} catch(e) {
			console.log(e);
		}

	}

	async show() {
		this.refreshChatsList();
		UI.hideAll('modal');
		UI.hide(background);
		UI.show(blockLeft, 'left');
	}


}
