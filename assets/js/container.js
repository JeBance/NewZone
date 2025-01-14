container.click = async function(elem)
{
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
			secureStorage.eraseAllSecureData();
			downloadNZPGPhref.removeAttribute('href');
			downloadNZPGPhref.removeAttribute('download');
			UI.hide(menuButtonContacts);
			UI.hide(menuButtonChats);
			UI.hideAll('modalSubBack');
			container.choice();
			break;

		case 'file':
			let x = elem.files[0];
			let reader = new FileReader();
			reader.readAsText(x);
			reader.onload = function() {
				if ((x.name.substring(x.name.length - 3) == '.nz')
				|| (x.name.substring(x.name.length - 4) == '.pgp')) {
					file.data = reader.result;
					secureStorage.checkStorage(file.data).then((value) => {
						if (value == true) {
							UI.hideAll('container');
							containerInfo.innerHTML = 'Введите пароль для дешифровки контейнера.';
							UI.show(containerPasswordArea, 'input-container');
							containerPasswordInput.focus();
							UI.show(containerPasswordAccept, 'btn btn-start');
						}
					})
				} else {
					alert(`Некорректный файл!\nВыберите файл контейнера с расширением .nz`);
				}
			};
			reader.onerror = function() {
				alert(reader.error);
			};
			break;

		case 'containerPasswordAccept':
			if (containerPasswordInput.value.length < 8) {
				alert('Короткий пароль!');
			} else {
				if (file.data) {
					await secureStorage.openStorage(file.data, containerPasswordInput.value);
					if (secureStorage.activeAllSecureData() == true) await container.generate();
				} else {
					if (containerNameInput.value.length == 0) alert('Введите никнейм!');
					if (containerEmailInput.value.length == 0) alert('Введите email!');
					if ((containerPasswordInput.value.length > 7)
					&& (containerNameInput.value.length > 0)
					&& (containerEmailInput.value.length > 0)) {
						if (EMAIL_REGEXP.test(containerEmailInput.value)) {
							try {
								UI.hideAll('container');
								containerInfo.innerHTML = 'Генерация контейнера ...';
								loader.show(container, containerContent);
								await secureStorage.createStorage(containerNameInput.value, containerEmailInput.value, containerPasswordInput.value);
								if (secureStorage.activeAllSecureData() == true) await container.generate();
							} catch(e) {
								console.error(e);
							}
							UI.hide(loader);
						} else {
							alert('Вы ввели некорректный email!');
						}
					}
				}
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
	clearInterval(cyclicMessagesCheck);
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
	let fileHref = await secureStorage.generateSecureFile();
	downloadNZPGPhref.setAttribute('href', fileHref);
	downloadNZPGPhref.setAttribute('download', secureStorage.fingerprint + '.nz');
	containerFingerprint.innerHTML = secureStorage.fingerprint;
	UI.hide(containerInfo);
	containerNickname.innerHTML = secureStorage.nickname;
	containerEmail.innerHTML = secureStorage.email;
	UI.show(containerInfoArea, 'info');
	UI.show(containerSave, 'btn btn-start');
	UI.show(containerOff, 'btn btn-start');
	UI.show(menuButtonContacts, 'button');
	UI.show(menuButtonChats, 'button');
	UI.showAll('modalSubBack', 'btn-circle');
	config.dbName = config.net + '-' + secureStorage.fingerprint;
	cyclicMessagesCheck = MESSAGES.cyclicMessagesCheck();
}
