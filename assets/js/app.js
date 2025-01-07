const config = {};
const NODES = new nodes();
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
		loader.hide();
	}
}, 1000);

async function wrap(elem) {
	switch(elem.id) {
		case 'buttonStart':
			buttonStart.hide();
			NODES.cyclicNodesCheck();
			selectNodeBlock.show('flex');
			loader.show(modalStart, selectNodeBlock);
			fillingNodeNetsSelectionOtions;
			break;

		case 'buttonSelectNode':
			config.net = selectNode.value;
			selectNodeBlock.hide();
			modalStart.hide();
			modalHeaderBtnContainer.hide();
			containerHeader.show('flex modal-header');
			if (secureStorage.activeAllSecureData() === true) {
				await container.generate();
			} else {
				container.choice();
			}
			container.show('modal flex-start color-whiteblack');
			break;

		default:
			break;
	}
}

modal.elements = document.getElementsByName("modal");

modal.elements.hide = () => {
	for (let i = 0, l = modal.elements.length; i < l; i++) modal.elements[i].hide();
}

modal.click = (elem) => {
	try {
		if (secureStorage.activeAllSecureData() !== true) throw new Error('Container not connected');
		if (elem.id === 'modalBackground') {
			modal.elements.hide();
			modalBackground.hide();
		}
	} catch(e) {
		console.log(e);
	}
}

menu.animation = function()
{
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
			blockCenter.hide();
			blockLeft.show('left');

		default:
			break;
	}
}

window.onresize = function()
{
	if (document.documentElement.clientWidth > 799) {
		menu.show('menu');
		shade.hide();
		backCenterTopButton.hide();
		blockLeft.show('left');
	} else {
		backCenterTopButton.show('fa fa-chevron-left fa-2x square');
		if ((localStorage.recipientFingerprint.length > 0)
		&& (localStorage.recipientPublicKey.length > 0)) {
			blockLeft.hide();
			blockCenter.show('center');
		}

	}
}

hide.pages = () => {
	contacts.hide();
	chats.hide();
	infoPage.hide();
	messagesPage.hide();
	accountPage.hide();
}

hide.tempDataInLocalStorage = () => {
	localStorage.recipientFingerprint = '';
	localStorage.recipientPublicKey = '';
}

hide.pages();
menuButtonContacts.hide();
menuButtonChats.hide();

