const OfflineDB = (function () {

let db;

function init() {

return new Promise((resolve, reject) => {

const request = indexedDB.open("JIMS_OFFLINE_DB", 1);

request.onupgradeneeded = function (e) {

db = e.target.result;

if (!db.objectStoreNames.contains("sales")) {

db.createObjectStore("sales", {
keyPath: "id",
autoIncrement: true
});

}

};

request.onsuccess = function (e) {
db = e.target.result;
resolve();
};

request.onerror = reject;

});

}


// SAVE SALE OFFLINE
function saveSale(data) {

return new Promise((resolve, reject) => {

const tx = db.transaction("sales", "readwrite");
const store = tx.objectStore("sales");

store.add({
data: data,
synced: false,
retry_count: 0,
syncing: false,
last_error: null,
created_at: Date.now()
});

tx.oncomplete = resolve;
tx.onerror = reject;

});

}


// GET PENDING SALES (ORDERED QUEUE)
function getPendingSales() {

return new Promise((resolve, reject) => {

const tx = db.transaction("sales", "readonly");
const store = tx.objectStore("sales");

const request = store.getAll();

request.onsuccess = () => {

const result = request.result
.filter(s => !s.synced)
.sort((a, b) => a.created_at - b.created_at);

resolve(result);

};

request.onerror = reject;

});

}


// MARK SALE AS SYNCING (PREVENT DOUBLE SYNC)
function markSyncing(id) {

return new Promise((resolve, reject) => {

const tx = db.transaction("sales", "readwrite");
const store = tx.objectStore("sales");

const req = store.get(id);

req.onsuccess = function () {

const sale = req.result;

if (!sale) {
resolve();
return;
}

sale.syncing = true;

store.put(sale);

resolve();

};

req.onerror = reject;

});

}


// INCREMENT RETRY COUNT
function incrementRetry(id, errorMsg = null) {

return new Promise((resolve, reject) => {

const tx = db.transaction("sales", "readwrite");
const store = tx.objectStore("sales");

const req = store.get(id);

req.onsuccess = function () {

const sale = req.result;

if (!sale) {
resolve();
return;
}

sale.retry_count = (sale.retry_count || 0) + 1;
sale.syncing = false;
sale.last_error = errorMsg;

store.put(sale);

resolve();

};

req.onerror = reject;

});

}


// MARK SALE AS SYNCED
function markSynced(id) {

return new Promise((resolve, reject) => {

const tx = db.transaction("sales", "readwrite");
const store = tx.objectStore("sales");

const req = store.get(id);

req.onsuccess = function () {

const sale = req.result;

if (!sale) {
resolve();
return;
}

sale.synced = true;
sale.syncing = false;

store.put(sale);

resolve();

};

req.onerror = reject;

});

}


return {
init,
saveSale,
getPendingSales,
markSynced,
markSyncing,
incrementRetry
};

})();