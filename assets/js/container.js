class Container {
	config;
	elem;

	constructor(elemID = '', config = {}) {
		try {
			this.config = Object.assign({
				log: false
			}, config);

			this.elem = document.getElementById(elemID);
			this.reflow();
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async reflow() {
		try {
			this.elem.innerHTML = `<div id="containerHeader" class="header">
				<div class="btn-circle" name="backToSettings" onclick="UI.click(this)">
					<svg width="32" height="32" viewBox="20 0 256 512" aria-hidden="true" data-view-component="true" style="fill: var(--color-content-1);" xmlns="http://www.w3.org/2000/svg">
						<path d="M31.7 239l136-136c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L127.9 256l96.4 96.4c9.4 9.4 9.4 24.6 0 33.9L201.7 409c-9.4 9.4-24.6 9.4-33.9 0l-136-136c-9.5-9.4-9.5-24.6-.1-34z"></path>
					</svg>
				</div>
				<h1>Контейнер</h1>
			</div>

			<div id="containerContent" class="content">
				<p id="containerInfo" style="margin: 2em 1em 1em 1em;">Все данные передаются через сервера в зашифрованном виде. Подключите свой ранее созданный PGP контейнер, или создайте новый.</p>
				<div id="containerInfoArea" class="hide" name="container"></div>


				<div id="containerBrowse" onclick="CONTAINER.click(this)" class="hide" name="container">
					<span>ПОДКЛЮЧИТЬ</span>
				</div>

				<div id="containerCreate" onclick="CONTAINER.click(this)" class="hide" name="container">
					<span>СОЗДАТЬ</span>
				</div>

				<div id="containerNameArea" class="hide" name="container">
					<input id="containerNameInput" onkeydown="{if(event.key=='Enter')CONTAINER.click(containerPasswordAccept)}" type="text" required="" class="selectable"/>
					<label>Имя</label>
				</div>

				<div id="containerEmailArea" class="hide" name="container">
					<input id="containerEmailInput" onkeydown="{if(event.key=='Enter')CONTAINER.click(containerPasswordAccept)}" type="email" required="" class="selectable"/>
					<label>Email</label>
				</div>

				<div id="containerPasswordArea" class="hide" name="container">
					<input id="containerPasswordInput" onkeydown="{if(event.key=='Enter')CONTAINER.click(containerPasswordAccept)}" type="password" required="" class="selectable"/>
					<label>Пароль</label>	
				</div>

				<div id="containerPasswordAccept" onclick="CONTAINER.click(this)" class="hide" name="container">
					<span>ПОДТВЕРДИТЬ</span>
				</div>

				<div id="containerSave" onclick="CONTAINER.click(this)" class="hide" name="container">
					<span>СОХРАНИТЬ</span>
				</div>

				<div id="containerOff" name="containerOff" onclick="CONTAINER.click(this)" class="hide">
					<span>ОТКЛЮЧИТЬ</span>
				</div>

				<div id="cancelCreateContainer" name="containerOff" onclick="CONTAINER.click(this)" class="hide">
					<span>ОТМЕНА</span>
				</div>

				<input id="file" type="file" onchange="CONTAINER.click(this)" class="hide">
				<a id="downloadNZPGPhref" class="hide"></a>
			</div>`;
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	async clear() {
		let fingerprints, recipientFingerprint;
		try {
			this.elem.innerHTML = '';
		} catch(e) {
			if (this.config.log) console.log(e);
		}
	}

	addKeyInfoBlock(elem, contact = {}) {
		contact = Object.assign({
			nickname: '',
			email: '',
			fingerprint: ''
		}, contact);

		elem.innerHTML = `
		<div class="desc"><p>Никнейм</p></div>
		<div class="val"><p>` + contact.nickname + `</p></div>
		<div class="desc"><p>E-mail</p></div>
		<div class="val"><p>` + contact.email + `</p></div>
		<div class="desc"><p>Отпечаток</p></div>
		<div class="val"><p>` + contact.fingerprint + `</p></div>`;
	}

	async click(elem) {
		switch(elem.id) {
			case 'containerBrowse':
				file.click();
				break;

			case 'containerCreate':
				containerInfo.innerHTML = 'Заполните форму. Эти данные будут добавлены в Ваш PGP-ключ. Придумайте сложный пароль от 8 символов для шифрования контейнера.';
				UI.hideAll('container');
				UI.hideAll('containerOff');
				UI.show(containerNameArea, 'input-container');
				containerNameInput.focus();
				UI.show(containerEmailArea, 'input-container');
				UI.show(containerPasswordArea, 'input-container');
				UI.show(containerPasswordAccept, 'btn btn-start');
				UI.show(cancelCreateContainer, 'btn btn-start');
				break;

			case 'containerSave':
				downloadNZPGPhref.click()
				break;

			case 'file':
				let x = elem.files[0];
				let reader = new FileReader();
				reader.readAsText(x);
				reader.onload = function() {
					if ((x.name.substring(x.name.length - 3) === '.nz')
					|| (x.name.substring(x.name.length - 4) === '.pgp')) {
						file.data = reader.result;
						(async () => {
							try {
								let message = await PGP.readMessage(file.data);
								if (!message) throw new Error('The file is not a secure keystore!');
								UI.hideAll('container');
								UI.hideAll('containerOff');
								containerInfo.innerHTML = 'Введите пароль для дешифровки контейнера.';
								UI.show(containerPasswordArea, 'input-container');
								containerPasswordInput.focus();
								UI.show(containerPasswordAccept, 'btn btn-start');
								UI.show(cancelCreateContainer, 'btn btn-start');
							} catch(e) {
								alert(e);
							}
						})();
					} else {
						alert(`Некорректный файл!\nВыберите файл контейнера с расширением .nz`);
					}
				};
				reader.onerror = function() {
					alert(reader.error);
				};
				break;

			case 'containerPasswordAccept':
				try {
					if (containerPasswordInput.value.length < 8) throw new Error('Short password! Password must be at least 8 characters.');
					if (file.data) {
						let storage = await PGP.openStorage(file.data, containerPasswordInput.value);
						if (storage !== true) throw new Error(storage);
						if (PGP.active) await this.generate();
					} else {
						if (containerNameInput.value.length === 0) alert('Введите никнейм!');
						if (containerEmailInput.value.length === 0) alert('Введите email!');
						if ((containerPasswordInput.value.length > 7)
						&& (containerNameInput.value.length > 0)
						&& (containerEmailInput.value.length > 0)) {
							if (EMAIL_REGEXP.test(containerEmailInput.value)) {
								try {
									UI.hideAll('container');
									UI.hideAll('containerOff');
									containerInfo.innerHTML = 'Генерация контейнера ...';
									loader.show(container, containerContent);
									let storage = await PGP.createStorage(containerNameInput.value, containerEmailInput.value, containerPasswordInput.value);
									if (!storage) throw new Error('Failed to generate container!');
									if (PGP.active) await this.generate();
								} catch(e) {
									alert(e);
								}
								UI.hide(loader);
							} else {
								alert('Вы ввели некорректный email!');
							}
						}
					}
				} catch(e) {
					alert(e);
				}
				break;

			default:
				break;
		}

		switch(elem.getAttribute("name")) {
			case 'containerOff':
				PGP.eraseAllSecureData();
				downloadNZPGPhref.removeAttribute('href');
				downloadNZPGPhref.removeAttribute('download');
				UI.hideAll('backToSettings');
				UI.hide(wraper);
				this.choice();
				break;

			default:
				break;
		}

	}

	clearInputs() {
		file.data = null;
		file.value = null;
		containerNameInput.value = '';
		containerEmailInput.value = '';
		containerPasswordInput.value = '';
	}

	choice() {
		NZHUB.config.checkingMessages = false;
		config.dbName = false;
		this.clearInputs();
		UI.hideAll('container');
		UI.hideAll('containerOff');
		containerInfo.innerHTML = 'Все данные передаются через сервера в зашифрованном виде. Подключите свой ранее созданный PGP контейнер, или создайте новый.';
		UI.show(containerInfo, 'show');
		UI.show(containerBrowse, 'btn btn-start');
		UI.show(containerCreate, 'btn btn-start');
	}

	async generate() {
		this.clearInputs();
		UI.hideAll('container');
		UI.hideAll('containerOff');
		let fileHref = await PGP.generateSecureFile();
		downloadNZPGPhref.setAttribute('href', fileHref);
		downloadNZPGPhref.setAttribute('download', PGP.fingerprint + '.nz');
		UI.hide(containerInfo);
		this.addKeyInfoBlock(containerInfoArea, {
			nickname: PGP.nickname,
			email: PGP.email,
			fingerprint: PGP.fingerprint
		});
		UI.show(containerInfoArea, 'info');
		UI.show(containerSave, 'btn btn-start');
		UI.show(containerOff, 'btn btn-start');
		UI.showAll('backToSettings', 'btn-circle');
		UI.show(wraper, 'wraper');
		NZHUB.config.checkingMessages = true;
		config.dbName = config.net + '-' + PGP.fingerprint;
		MESSAGES.initList();
		MESSAGES.update();
		publicKeyQR.clear();
		publicKeyQR.makeCode(PGP.publicKeyArmored);
	}

}
