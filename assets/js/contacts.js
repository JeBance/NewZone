/*
class Contacts {
	db;
	transaction;
	contacts;

	nickname;
	email;
	fingerprint;
	publicKey;

	constructor() {
		this.list = {};
		this.monitor = {
			firstMessage: { hash: null, timestamp: new Date().getTime() },
			lastMessage: { hash: null, timestamp: 0 }
		};
	}

	async initDB() {
		this.db = await dbInit().then((db) => { return db; });
		this.transaction = this.db.transaction("contacts", "readwrite");
		this.contacts = this.transaction.objectStore("contacts");
	}

	async init(id) {
		this.fingerprint = id;
		let matches = this.fingerprint.match(/^[a-z0-9]{40}$/i);

		if (matches !== null) {
			this.fingerprint = matches[0].toUpperCase();
		} else {
			alert('Введён неверный отпечаток собеседника!');
			return false;
		}

		await this.initDB();
		let request = this.contacts.get(this.fingerprint);
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		let info = await x.then((value) => { return value; });

		if (info == undefined) {
			let addedContact = {
				fingerprint: this.fingerprint,
				publicKey: '',
				nickname: '',
				email: ''
			};
			let request = this.contacts.add(addedContact);
			let x = new Promise((resolve, reject) => {
				request.onsuccess = function() { resolve(request.result); }
			});
			await x.then((value) => { return value; });
			info = addedContact;
		}

		this.fingerprint = info.fingerprint;
		this.publicKey = info.publicKey;
		this.nickname = info.nickname;
		this.email = info.email;

		return true;
	}

	async save() {
		let addedContact = {
			fingerprint: this.fingerprint,
			publicKey: this.publicKey,
			nickname: this.nickname,
			email: this.email
		};

		await this.initDB();
		let request = this.contacts.put(addedContact);
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		await x.then((value) => { return value; });
	}

	async getAllContacts() {
		await this.initDB();
		let request = this.contacts.getAll();
		let x = new Promise((resolve, reject) => {
			request.onsuccess = function() { resolve(request.result); }
		});
		let allContacts = await x.then((value) => { return value; });
		return allContacts;
	}
}


const CONTACT = new Contact();

contact.animation = function()
{
	if (modalContactBlock.className == 'modalContact') {
		contactFingerprint.value = '';
		contactPassword.value = '';
		modalContactBlock.hide();
		shadeContactBlock.hide();
	} else {
		modalContactBlock.show('modalContact');
		shadeContactBlock.show('shade');
		contactFingerprint.focus();
	}
}

contact.addNew = async function()
{
	if (contactPassword.value.length > 0) {
		let recipient = new Contact();
		if (await recipient.init(contactFingerprint.value)) {
			await recipient.save();
			let string = JSON.stringify({ myPublicKey: secureStorage.publicArmoredKey });
			let message = await secureStorage.encryptMessageSymmetricallyWithCompression(string, contactPassword.value);
			let JSONstring = JSON.stringify({ request: 'addMe', message: message, to: recipient.fingerprint });
			let xhr = await myHub.xhr({request: JSONstring })
				.then((value) => { return value; })
				.catch((error) => console.error(`${error}`));
			if (xhr.result == 'ok') {
				let message = new Message();
				if ((await message.init(xhr.response)) == false) {
					message.id = xhr.response;
					message.chat = recipient.fingerprint;
					message.from = secureStorage.fingerprint;
					message.timestamp = Math.floor(Date.now() / 1000);
					message.message = JSON.parse(string);
					message.request = 'addMe';
					message.wasRead = true;
					await message.save();
				}
				contact.animation();
				contact.contactBlockUpdate();
			}
		}
	} else {
		alert('Введите пароль для собеседника, чтобы он мог подтвердить добавление.');
	}
}

contact.contactBlockUpdate = async function()
{
	contacts.innerHTML = '';
	await contact.getAddButton();
	let x = new Contact();
	let allContacts = await x.getAllContacts();
	for (let i = 0, l = allContacts.length; i < l; i++)
	contact.getContactButton(allContacts[i]);
}

contact.getContactButton = function(obj)
{
	let newContainerForContact = document.createElement('div');
	newContainerForContact.id = obj.fingerprint;
	newContainerForContact.name = 'contact';
	newContainerForContact.className = 'leftItem';
//	newContainerForContact.setAttribute('onclick', 'chat.getChat(obj.fingerprint)');
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
	if (obj.nickname.length > 0) {
		newDivForLeftItemInfoName.innerHTML = obj.nickname
	} else {
		newDivForLeftItemInfoName.innerHTML = 'Ожидает подтверждения';
		newDivForLeftItemInfoName.setAttribute('style', 'color:red;');
	}
	let newDivForLeftItemInfoText = document.createElement('div');
	newDivForLeftItemInfoText.className = 'leftItemInfoText';
	newDivForLeftItemInfoText.innerHTML = obj.fingerprint;
	newDivForLeftItemInfoTop.append(newDivForLeftItemInfoName);
	newDivForLeftItemInfoBottom.append(newDivForLeftItemInfoText);
	newDivForLeftItemInfo.append(newDivForLeftItemInfoTop);
	newDivForLeftItemInfo.append(newDivForLeftItemInfoBottom);
	newContainerForContact.append(newDivForAvatar);
	newContainerForContact.append(newDivForLeftItemInfo);
	contacts.append(newContainerForContact);
}

contact.getAddButton = function()
{
	let newContainerForAddContact = document.createElement('div');
	newContainerForAddContact.className = 'leftItem';
	newContainerForAddContact.setAttribute('onclick', 'contact.animation()');
	let newDivForI = document.createElement('div');
	newDivForI.setAttribute('style', 'display:grid;justify-content:center;');
	let newI = document.createElement('i');
	newI.className = 'fa fa-plus fa-lg';
	newI.setAttribute('aria-hidden', 'true');
	let newDivForInnerHTML = document.createElement('div');
	newDivForInnerHTML.innerHTML = 'Добавить контакт';
	newDivForI.append(newI);
	newContainerForAddContact.append(newDivForI);
	newContainerForAddContact.append(newDivForInnerHTML);
	contacts.append(newContainerForAddContact);
}

*/
