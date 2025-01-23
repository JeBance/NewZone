const config = {
	dbName: null
};
const UI = new ui();
const NODES = new nodes();
const MESSAGES = new messages();
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

timestampToTime = (unix_timestamp) => {
	let date = new Date(unix_timestamp * 1000);
	let hours = date.getHours();
	let minutes = "0" + date.getMinutes();
	let formattedTime = hours + ':' + minutes.substr(-2);
	return formattedTime;
}

async function wrap(elem) {
	try {

		switch(elem.id) {
			case 'modalBackground':
				if (!PGP.active)
				throw new Error('Container not connected');
				UI.hideAll('modal');
				UI.hideAll('subModal');
				UI.hide(modalBackground);
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
				let html5QrcodeScanner = new Html5QrcodeScanner(
					"reader",
					{ fps: 20, qrbox: {width: 400, height: 400} },
					/* verbose= */ false);
				html5QrcodeScanner.render(onScanSuccess, onScanFailure);
				break;

			default:
				break;
		}

		switch(elem.getAttribute("name")) {
			case 'modalBack':
				UI.hideAll('modal');
				UI.hideAll('subModal');
				UI.hide(modalBackground);
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

publicKeyQR = new QRCode(document.getElementById("publicKeyQR"), {
	text: "https://jebance.gihub.io/NewZone",
	width: 280,
	height: 280,
	colorDark : "#000000",
	colorLight : "#ffffff",
	correctLevel : QRCode.CorrectLevel.H
});

function onScanSuccess(decodedText, decodedResult) {
  // handle the scanned code as you like, for example:
  console.log(`Code matched = ${decodedText}`, decodedResult);
}

function onScanFailure(error) {
  // handle scan failure, usually better to ignore and keep scanning.
  // for example:
  console.warn(`Code scan error = ${error}`);
}

