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

	async click(elem) {
		try {

			switch(elem.id) {
				case 'buttonStart':
					UI.hide(buttonStart);
					NODES.cyclicNodesCheck();
					UI.show(selectNodeBlock, 'flex');
					loader.show(start, selectNodeBlock);
					fillingNodeNetsSelectionOtions;
					break;

				case 'buttonSelectNode':
					config.net = selectNode.value;
					UI.hide(selectNodeBlock);
					UI.hideAll('modal');
					UI.show(containerHeader, 'header');
					if (PGP.active) {
						await container.generate();
					} else {
						container.choice();
					}
					UI.show(container, 'modal flex-start');
					break;

				case 'buttonContacts':
					menu.animation();
					UI.hideAll('modal');
					UI.show(background, 'modal-background');
					UI.show(contacts, 'modal');
					break;

				case 'buttonSettings':
					menu.animation();
					UI.hideAll('modal');
					UI.show(background, 'modal-background');
					UI.show(settings, 'modal');
					break;

				case 'buttonSettingsContainer':
					UI.hideAll('modal');
					UI.show(container, 'modal');
					break;

				default:
					break;
			}
	
			switch(elem.getAttribute("name")) {
				case 'menu':
					if ((menu.className == 'menu') || (menu.className == 'hideMenu menu')) {
						UI.show(menu, 'showMenu menu');
						UI.show(shade, 'shade');
					} else {
						UI.show(menu, 'hideMenu menu');
						UI.hide(shade);
					}
					break;

				case 'qrScanner':
					UI.show(background, 'modal-background');
					UI.show(qrScanner, 'modal');
					UI.show(qrInfo, 'show');
					html5QrCode.start({ facingMode: "environment" }, config.qrScan, qrCodeSuccessCallback);
					break;

				case 'backToMain':
					if (!PGP.active) throw new Error('Container not connected');
					UI.hideAll('modal');
					UI.hide(background);
					if (html5QrCode.isScanning === true) html5QrCode.stop();
					break;
	
				case 'backToSettings':
					UI.hideAll('modal');
					UI.show(listSettings, 'modal');
					break;

				case 'backToContacts':
					UI.hideAll('modal');
					UI.show(contacts, 'modal');
					break;

				default:
					break;
			}
	
		} catch(e) {
			console.log(e);
		}		
	}

}
