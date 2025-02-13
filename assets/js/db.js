async function dbInit(nameDB)
{
	return new Promise((resolve, reject) => {
		let openRequest = indexedDB.open(nameDB, 1);

		openRequest.onupgradeneeded = function() {
			let db = openRequest.result;
			switch(event.oldVersion) {
				case 0:
					let chats = db.createObjectStore('chats', {keyPath: 'hash'});
					chats.createIndex('type', 'type');
					chats.createIndex('owner', 'owner');
					chats.createIndex('title', 'title');
					chats.createIndex('description', 'description');

					let contacts = db.createObjectStore('contacts', {keyPath: 'fingerprint'});
					contacts.createIndex('nickname', 'nickname');
					contacts.createIndex('email', 'email');
					contacts.createIndex('publicKey', 'publicKey');

					let messages = db.createObjectStore('messages', {keyPath: 'hash'});
					messages.createIndex('chat', 'chat');
					messages.createIndex('from', 'from');
					messages.createIndex('to', 'to');
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
