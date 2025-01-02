async function dbInit(nameDB)
{
	return new Promise((resolve, reject) => {
		let openRequest = indexedDB.open(nameDB, 1);

		openRequest.onupgradeneeded = function() {
			let db = openRequest.result;
			switch(event.oldVersion) {
				case 0:
					let contacts = db.createObjectStore('contacts', {keyPath: 'fingerprint'});
					let messages = db.createObjectStore('messages', {keyPath: 'hash'});
					let nicknameIndex = contacts.createIndex('nickname_id', 'nickname');
					let chatIndex = messages.createIndex('chat_id', 'chat');
					break;
			}
		};

		openRequest.onerror = function() {
			reject('Error: ' + openRequest.error);
		};

		openRequest.onsuccess = function() {
			let db = openRequest.result;
			db.onversionchange = function() {
				db.close();
				reject('The database is out of date. Please reload the page to update.');
			};
			resolve(db);
		};

		openRequest.onblocked = function() {
			reject('The database is out of date. Please close other tabs and reload the page to update.');
		};
	});
}
