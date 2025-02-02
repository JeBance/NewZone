const config = {
	dbName: null,
	qrScan: {
		fps: 30,
		supportedScanTypes: [ Html5QrcodeScanType.SCAN_TYPE_CAMERA ]
	}
};
const UI = new UserInterface();
const NODES = new Nodes();
const CONTACT = new Contact();
const MESSAGES = new Messages();
let cyclicMessagesCheck;
const PGP = new SecureStorage();
const EMAIL_REGEXP = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/iu;
const modal = {};
const hide = {};

const sleep = (s) => new Promise((r) => setTimeout(r, (s * 1000)));

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
	let nickname, email, fingerprint, publicKey;
	try {
		loader.show(qrScanner, qrContent);
		html5QrCode.pause();
		console.log(decodedResult);

		let recipientPublicKey = await PGP.readKey(decodedText);
		if (!recipientPublicKey) throw new Error('Invalid public key');

		fingerprint = await recipientPublicKey.getFingerprint();
		if (!CONTACT.isValidFingerprint(fingerprint)) throw new Error('Incorrect fingerprint entered');

		let check = await CONTACT.check(fingerprint);
		if (!check) {
			nickname = recipientPublicKey.users[0].userID.name;
			email = recipientPublicKey.users[0].userID.email;
			publicKey = decodedText;
			UI.show(buttonContactAdd, 'btn btn-start');
			UI.hide(buttonContactEdit);
			UI.hide(buttonContactSave);
			UI.show(buttonContactChat, 'btn btn-start');
			contactNameInput.readOnly = false;
		} else {
			nickname = check.nickname;
			email = check.email;
			publicKey = check.publicKey;
			UI.hide(buttonContactAdd);
			UI.show(buttonContactEdit, 'btn btn-start');
			UI.hide(buttonContactSave);
			UI.show(buttonContactChat, 'btn btn-start');
			contactNameInput.readOnly = true;
		}

		contactNameInput.value = nickname;
		contactEmailInput.value = email;
		contactFingerprintInput.value = fingerprint;
		contactPublicKeyInput.value = publicKey;

		UI.show(contactNameArea, 'input-container');
		UI.show(contactEmailArea, 'input-container');
		UI.show(contactFingerprintArea, 'input-container');

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
