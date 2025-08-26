const askUserToUpdate = reg => {
	return Modal.confirm({
		onOk: async () => {
			// вешаем обработчик изменения состояния
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				window.location.reload();
			});

			// пропускаем ожидание 
			if (reg && reg.waiting) {
				reg.waiting.postMessage({ type: 'SKIP_WAITING' });
			}
		},

		onCancel: () => {
			Modal.destroyAll();
		},
		icon: null,
		title: 'Обновление',
		content:
		'Доступна новая версия приложения! Обновить?',
		cancelText: 'Не обновлять',
		okText: 'Обновить'
	});
};

const registerServiceWorker = async () => {
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register("sw.js");
			if (registration.installing) {
				console.log("Service worker installing");
			} else if (registration.waiting) {
				console.log("Service worker installed");
				askUserToUpdate(registration);
			} else if (registration.active) {
				console.log("Service worker active");
			}
		} catch(e) {
			console.error(`Registration failed with ${e}`);
		}
	}
};

registerServiceWorker();

let deferredPrompt;
a2hs.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
	e.preventDefault();
	deferredPrompt = e;
	a2hs.style.display = 'block';
	a2hs.addEventListener('click', () => {
		a2hs.style.display = 'none';
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choiceResult) => {
			if (choiceResult.outcome === 'accepted') {
				console.log('User accepted the A2HS prompt');
			} else {
				console.log('User dismissed the A2HS prompt');
			}
			deferredPrompt = null;
		});
	});
});
