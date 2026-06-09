/* IndexedDB utilities placed in function.js
	 Exposes functions on window.dbFunctions for pages that don't use modules.
	 Usage:
		 await dbFunctions.openDatabase();
		 await dbFunctions.addTask(task);
		 const all = await dbFunctions.getAllTasks();
 */

(function () {
	const DB_NAME = 'SmartTaskDB';
	const DB_VERSION = 1;
	const STORE_TASKS = 'tasks';

	let _db = null;

	function openDatabase() {
		if (_db) return Promise.resolve(_db);
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, DB_VERSION);
			req.onupgradeneeded = (e) => {
				const db = e.target.result;
				if (!db.objectStoreNames.contains(STORE_TASKS)) {
					const store = db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
					store.createIndex('status', 'status', { unique: false });
					store.createIndex('deadline', 'deadline', { unique: false });
				}
			};
			req.onsuccess = (e) => {
				_db = e.target.result;
				// Also expose global db reference if declared
				try { if (typeof window !== 'undefined') window.db = _db; } catch (e) {}
				resolve(_db);
			};
			req.onerror = (e) => reject(e.target.error);
		});
	}

	function _getStore(mode = 'readonly') {
		return openDatabase().then((db) => db.transaction([STORE_TASKS], mode).objectStore(STORE_TASKS));
	}

	function addTask(task) {
		if (!task.id) task.id = Date.now().toString();
		return _getStore('readwrite').then(store => new Promise((res, rej) => {
			const r = store.put(task);
			r.onsuccess = () => res(r.result);
			r.onerror = () => rej(r.error);
		}));
	}

	function getTask(id) {
		return _getStore('readonly').then(store => new Promise((res, rej) => {
			const r = store.get(id);
			r.onsuccess = () => res(r.result);
			r.onerror = () => rej(r.error);
		}));
	}

	function getAllTasks() {
		return _getStore('readonly').then(store => new Promise((res, rej) => {
			const r = store.getAll();
			r.onsuccess = () => res(r.result);
			r.onerror = () => rej(r.error);
		}));
	}

	function updateTask(task) {
		if (!task.id) return Promise.reject(new Error('Task must have id'));
		return addTask(task);
	}

	function deleteTask(id) {
		return _getStore('readwrite').then(store => new Promise((res, rej) => {
			const r = store.delete(id);
			r.onsuccess = () => res();
			r.onerror = () => rej(r.error);
		}));
	}

	function clearTasks() {
		return _getStore('readwrite').then(store => new Promise((res, rej) => {
			const r = store.clear();
			r.onsuccess = () => res();
			r.onerror = () => rej(r.error);
		}));
	}

	async function migrateFromLocalStorage({ clearLocal = false } = {}) {
		const raw = localStorage.getItem('tasks') || '[]';
		let tasks = [];
		try { tasks = JSON.parse(raw) } catch(e) { tasks = []; }
		if (!Array.isArray(tasks) || tasks.length === 0) return { migrated: 0 };
		await openDatabase();
		let migrated = 0;
		for (const t of tasks) {
			if (!t.id) t.id = Date.now().toString() + Math.random().toString(36).slice(2,8);
			// store.put
			// eslint-disable-next-line no-await-in-loop
			await addTask(t);
			migrated++;
		}
		if (clearLocal) localStorage.removeItem('tasks');
		return { migrated };
	}

	// Expose utilities on window for non-module pages
	if (typeof window !== 'undefined') {
		window.dbFunctions = {
			openDatabase,
			addTask,
			getTask,
			getAllTasks,
			updateTask,
			deleteTask,
			clearTasks,
			migrateFromLocalStorage,
		};
	}

	// Also export via CommonJS/ES module style if supported
	try { if (typeof module !== 'undefined') module.exports = window.dbFunctions; } catch(e) {}
	try { if (typeof define === 'function' && define.amd) define([], () => window.dbFunctions); } catch(e) {}

}());

