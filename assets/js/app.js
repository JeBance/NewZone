const config = {
	dbName: null,
	qrScan: {
		fps: 30,
		supportedScanTypes: [ Html5QrcodeScanType.SCAN_TYPE_CAMERA ]
	}
};

const NZHUB = new nzhub({
	log: true
});
NZHUB.cyclicNodesCheck();
NZHUB.cyclicMessagesCheck();

const UI = new UserInterface();
const NODES = new Nodes();
const CONTACT = new Contact();
const MESSAGES = new Messages();
let updateMessages;
const PGP = new SecureStorage();
const EMAIL_REGEXP = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
const modal = {};
const hide = {};

const sleep = (s) => new Promise((r) => setTimeout(r, (s * 1000)));

// let lang = navigator.language || navigator.userLanguage;

loader.show = (parent, elem) => {
	loader.className = 'loader-background';
	loader.style.width = elem.offsetWidth + 'px';
	loader.style.height = elem.offsetHeight + 'px';
	loader.style.top = (parent.offsetTop + elem.offsetTop) + 'px';
	loader.style.left = (parent.offsetLeft + elem.offsetLeft) + 'px';
}

let fillingNodeNetsSelectionOtions = setInterval(async () => {
	let keys = Object.keys(NZHUB.knownNets);
	if (keys.length > 0) {
		for (let value of keys) {
			selectNode.append(new Option(value, value));
		}
		clearInterval(fillingNodeNetsSelectionOtions);
		UI.hide(loader);
	}
}, 1000);

window.onresize = () => {
	if (document.documentElement.clientWidth > 799) {
		UI.show(menu, 'menu');
		UI.hide(shade);
		UI.hide(backToChats);
		UI.show(blockLeft, 'left');
	} else {
		UI.show(backToChats, 'square');
		if ((localStorage.recipientFingerprint !== undefined)
		&& (localStorage.recipientPublicKey !== undefined)
		&& (localStorage.recipientFingerprint.length > 0)
		&& (localStorage.recipientPublicKey.length > 0)) {
			UI.hide(blockLeft);
			UI.show(blockCenter, 'center');
		}
	}
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
	try {
		let scannedContact = {};
		loader.show(qrScanner, qrContent);
		html5QrCode.pause();

		let recipientPublicKey = await PGP.readKey(decodedText);
		if (!recipientPublicKey) throw new Error('Invalid public key');

		scannedContact.fingerprint = await recipientPublicKey.getFingerprint();

		let check = await CONTACT.check(scannedContact.fingerprint);
		if (!check) {
			scannedContact.nickname = recipientPublicKey.users[0].userID.name;
			scannedContact.email = recipientPublicKey.users[0].userID.email;
			scannedContact.publicKey = decodedText;
			scannedContact.receivedContactMessage = false;
			UI.show(buttonContactAdd, 'btn btn-start');
			UI.hide(buttonContactEdit);
			contactNameInput.readOnly = false;
		} else {
			scannedContact.nickname = check.nickname;
			scannedContact.email = check.email;
			scannedContact.publicKey = check.publicKey;
			scannedContact.receivedContactMessage = check.receivedContactMessage;
			UI.hide(buttonContactAdd);
			UI.show(buttonContactEdit, 'btn btn-start');
			contactNameInput.readOnly = true;
		}
		UI.hide(buttonContactSave);
		UI.show(buttonContactChat, 'btn btn-start');

		let contactInitResult = await CONTACT.init(scannedContact);
		if (!contactInitResult) throw new Error('Contact initialization failed');

		contactNameInput.value = CONTACT.nickname;
		contactEmailInput.value = CONTACT.email;
		contactFingerprintInput.value = CONTACT.fingerprint;

		html5QrCode.stop();
		UI.hide(qrScanner);
		UI.show(contact, 'modal flex-start');
		UI.hide(loader);
	} catch(e) {
		console.log(e);
		UI.hide(loader);
		html5QrCode.resume();
	}
};

UI.hide(wraper);
