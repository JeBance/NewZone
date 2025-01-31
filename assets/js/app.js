const config = {
	dbName: null,
	qrScan: {
		fps: 30,
		supportedScanTypes: [ Html5QrcodeScanType.SCAN_TYPE_CAMERA ]
	}
};
const tmp = {};
const UI = new Ui();
const NODES = new Nodes();
const CONTACT = new Contact();
const MESSAGES = new Messages();
let cyclicMessagesCheck;
const PGP = new SecureStorage();
const EMAIL_REGEXP = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
const modal = {};
const hide = {};

loader.show = (parent, elem) => {
	loader.className = 'loader-background';
	loader.style.width = elem.offsetWidth + 'px';
	loader.style.height = elem.offsetHeight + 'px';
	loader.style.top = (parent.offsetTop + elem.offsetTop) + 'px';
	loader.style.left = (parent.offsetLeft + elem.offsetLeft) + 'px';
}

let fillingNodeNetsSelectionOtions = setInterval(async () => {
	if (NODES.nets !== undefined) {
		for (let value of NODES.nets) {
			selectNode.append(new Option(value, value));
		}
		clearInterval(fillingNodeNetsSelectionOtions);
		UI.hide(loader);
	}
}, 1000);

menu.animation = () => {
	if ((menu.className == 'menu') || (menu.className == 'hideMenu menu')) {
		menu.className = 'showMenu menu';
		shade.className = 'shade';
	} else {
		menu.className = 'hideMenu menu';
		shade.className = 'hide';
	}
}

async function backWrap(elem)
{
	switch(elem.id) {
		case 'backCenterTopButton':
			hide.tempDataInLocalStorage();
			UI.hide(blockCenter);
UI.show(blockLeft, 'left');

		default:
			break;
	}
}

window.onresize = () => {
	if (document.documentElement.clientWidth > 799) {
		UI.show(menu, 'menu');
		UI.hide(shade);
		UI.hide(backCenterTopButton);
		UI.show(blockLeft, 'left');
	} else {
		UI.show(backCenterTopButton, 'square');
		if ((localStorage.recipientFingerprint.length > 0)
		&& (localStorage.recipientPublicKey.length > 0)) {
			UI.hide(blockLeft);
			UI.show(blockCenter, 'center');
		}
	}
}

hide.pages = () => {
	UI.hide(contacts);
	UI.hide(chats);
	UI.hide(infoPage);
	UI.hide(messagesPage);
	UI.hide(accountPage);
}

hide.tempDataInLocalStorage = () => {
	localStorage.recipientFingerprint = '';
	localStorage.recipientPublicKey = '';
}

const timestampToTime = (unix_timestamp) => {
	let date = new Date(unix_timestamp * 1000);
	let hours = date.getHours();
	let minutes = "0" + date.getMinutes();
	let formattedTime = hours + ':' + minutes.substr(-2);
	return formattedTime;
}

publicKeyQR = new QRCode(document.getElementById("publicKeyQR"), {
	text: "https://jebance.gihub.io/NewZone",
	width: 280,
	height: 280,
	colorDark : "#000000",
	colorLight : "#ffffff",
	correctLevel : QRCode.CorrectLevel.L
});

const html5QrCode = new Html5Qrcode("qrReader");
const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
	let nickname, email, fingerprint, publicKey;
	try {
		loader.show(qrScanner, qrContent);
		html5QrCode.pause();
		console.log(decodedResult);

		let recipientPublicKey = await PGP.readKey(decodedText);
		if (!recipientPublicKey) throw new Error('Invalid public key');

		fingerprint = await recipientPublicKey.getFingerprint();
		if (!CONTACT.isValidFingerprint(fingerprint)) throw new Error('Incorrect fingerprint entered');

		let contact = await CONTACT.check(fingerprint);
		if (!contact) {
			nickname = recipientPublicKey.users[0].userID.name;
			email = recipientPublicKey.users[0].userID.email;
			publicKey = decodedText;
			UI.show(contactAdd, 'btn btn-start');
			UI.hide(contactEdit);
			UI.hide(contactSave);
			UI.show(contactChat, 'btn btn-start');
		} else {
			nickname = contact.nickname;
			email = contact.email;
			publicKey = contact.publicKey;
			UI.hide(contactAdd);
			UI.show(contactEdit, 'btn btn-start');
			UI.hide(contactSave);
			UI.show(contactChat, 'btn btn-start');
		}

		contactNameInput.value = nickname;
		contactEmailInput.value = email;
		contactFingerprintInput.value = fingerprint;
		contactPublicKeyInput.value = publicKey;

		contactNameInput.readOnly = false;
		UI.show(contactNameArea, 'input-container');
		UI.show(contactEmailArea, 'input-container');
		UI.show(contactFingerprintArea, 'input-container');

		html5QrCode.stop();
		UI.hide(qrScanner);
		UI.show(contactInfo, 'modal flex-start');
		UI.hide(loader);
	} catch(e) {
		console.log(e);
		UI.hide(loader);
		html5QrCode.resume();
	}
};

async function wrap(elem) {
	try {

		switch(elem.id) {
			case 'modalBackground':
				if (!PGP.active) throw new Error('Container not connected');
				UI.hideAll('modal');
				UI.hideAll('subModal');
				UI.hide(modalBackground);
				if (html5QrCode.isScanning === true) html5QrCode.stop();
				break;

			case 'buttonStart':
				UI.hide(buttonStart);
				NODES.cyclicNodesCheck();
				UI.show(selectNodeBlock, 'flex');
				loader.show(modalStart, selectNodeBlock);
				fillingNodeNetsSelectionOtions;
				break;

			case 'buttonSelectNode':
				config.net = selectNode.value;
				UI.hide(selectNodeBlock);
				UI.hide(modalStart);
				UI.hideAll('modalSubBack');
				UI.show(containerHeader, 'header');
				if (PGP.active) {
					await container.generate();
				} else {
					container.choice();
				}
				UI.show(container, 'modal flex-start');
				break;

			case 'menuButtonSettings':
				menu.animation();
				UI.show(modalBackground, 'modal-background');
				UI.show(listSettings, 'modal');
				break;

			case 'setContainer':
				UI.hide(listSettings);
				UI.show(container, 'modal');
				break;

			case 'qrScan':
				UI.show(modalBackground, 'modal-background');
				UI.show(qrScanner, 'modal');
				UI.show(qrInfo, 'show');
				html5QrCode.start({ facingMode: "environment" }, config.qrScan, qrCodeSuccessCallback);
				break;

			default:
				break;
		}

		switch(elem.getAttribute("name")) {
			case 'modalBack':
				UI.hideAll('modal');
				UI.hideAll('subModal');
				UI.hide(modalBackground);
				if (html5QrCode.isScanning === true) html5QrCode.stop();
				break;

			case 'modalSubBack':
				UI.hideAll('subModal');
				UI.show(listSettings, 'modal');
				break;

			default:
				break;
		}

	} catch(e) {
		console.log(e);
	}
}


//hide.pages();
UI.hide(menuButtonContacts);
UI.hide(menuButtonChats);

