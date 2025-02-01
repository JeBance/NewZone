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

	menuAnimation() {
		if ((menu.className == 'menu') || (menu.className == 'hideMenu menu')) {
			this.show(menu, 'showMenu menu');
			this.show(shade, 'shade');
		} else {
			this.show(menu, 'hideMenu menu');
			this.hide(shade);
		}
	}

	async click(elem) {
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
					this.hideAll('modal');
					this.show(background, 'modal-background');
					this.show(contacts, 'modal');
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
					break;
	
				case 'backToSettings':
					this.hideAll('modal');
					this.show(settings, 'modal');
					break;

				case 'backToContacts':
					this.hideAll('modal');
					this.show(contacts, 'modal');
					break;

				case 'backToChats':
					localStorage.recipientFingerprint = '';
					localStorage.recipientPublicKey = '';
					this.hide(blockCenter);
					this.show(blockLeft, 'left');
					break;

				default:
					break;
			}
	
		} catch(e) {
			console.log(e);
		}		
	}

}
