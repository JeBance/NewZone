container.click = async (elem) => {
	switch(elem.id) {
		case 'containerBrowse':
			file.click();
			break;

		case 'containerCreate':
			containerInfo.innerHTML = 'Заполните форму. Эти данные будут добавлены в Ваш PGP-ключ. Придумайте сложный пароль от 8 символов для шифрования контейнера.';
			UI.hideAll('container');
			UI.show(containerNameArea, 'input-container');
			containerNameInput.focus();
			UI.show(containerEmailArea, 'input-container');
			UI.show(containerPasswordArea, 'input-container');
			UI.show(containerPasswordAccept, 'btn btn-start');
			break;

		case 'containerSave':
			downloadNZPGPhref.click()
			break;

		case 'containerOff':
			PGP.eraseAllSecureData();
			downloadNZPGPhref.removeAttribute('href');
			downloadNZPGPhref.removeAttribute('download');
			UI.hideAll('backToSettings');
			UI.hide(wraper);
			container.choice();
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
							containerInfo.innerHTML = 'Введите пароль для дешифровки контейнера.';
							UI.show(containerPasswordArea, 'input-container');
							containerPasswordInput.focus();
							UI.show(containerPasswordAccept, 'btn btn-start');
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
					if (PGP.active) await container.generate();
				} else {
					if (containerNameInput.value.length === 0) alert('Введите никнейм!');
					if (containerEmailInput.value.length === 0) alert('Введите email!');
					if ((containerPasswordInput.value.length > 7)
					&& (containerNameInput.value.length > 0)
					&& (containerEmailInput.value.length > 0)) {
						if (EMAIL_REGEXP.test(containerEmailInput.value)) {
							try {
								UI.hideAll('container');
								containerInfo.innerHTML = 'Генерация контейнера ...';
								loader.show(container, containerContent);
								let storage = await PGP.createStorage(containerNameInput.value, containerEmailInput.value, containerPasswordInput.value);
								if (!storage) throw new Error('Failed to generate container!');
								if (PGP.active) await container.generate();
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
}

container.clearInputs = function()
{
	file.data = null;
	file.value = null;
	containerNameInput.value = '';
	containerEmailInput.value = '';
	containerPasswordInput.value = '';
}

container.choice = function()
{
	clearInterval(updateMessages);
	config.dbName = false;
	container.clearInputs();
	UI.hideAll('container');
	containerInfo.innerHTML = 'Все данные передаются через сервера в зашифрованном виде. Подключите свой ранее созданный PGP контейнер, или создайте новый.';
	UI.show(containerInfo, 'show');
	UI.show(containerBrowse, 'btn btn-start');
	UI.show(containerCreate, 'btn btn-start');
}

container.generate = async function()
{
	container.clearInputs();
	UI.hideAll('container');
	let fileHref = await PGP.generateSecureFile();
	downloadNZPGPhref.setAttribute('href', fileHref);
	downloadNZPGPhref.setAttribute('download', PGP.fingerprint + '.nz');
	UI.hide(containerInfo);
	UI.addKeyInfoBlock(containerInfoArea, {
		nickname: PGP.nickname,
		email: PGP.email,
		fingerprint: PGP.fingerprint
	});
	UI.show(containerInfoArea, 'info');
	UI.show(containerSave, 'btn btn-start');
	UI.show(containerOff, 'btn btn-start');
	UI.showAll('backToSettings', 'btn-circle');
	UI.show(wraper, 'wraper');
	config.dbName = config.net + '-' + PGP.fingerprint;
	MESSAGES.initList();
	updateMessages = MESSAGES.update();
	publicKeyQR.clear();
	publicKeyQR.makeCode(PGP.publicKeyArmored);
}
