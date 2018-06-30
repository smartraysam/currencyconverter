(function () {
    'use strict';
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function () {
            console.log('Service Worker Registered');
            if (!navigator.serviceWorker.controller) {
                return;
            }
        });
    }
    var app = {container: document.querySelector('.main') };

    window.onload = ()=> {
        app.getCurrencies();
    };
    app.getCurrencies = () => {
        var url = 'https://free.currencyconverterapi.com/api/v5/currencies';
        //TODO add cache logic here
        let isCaches = false;
        if ('caches' in window) {
            console.log('loading from caches');
            caches.match(url).then(function (response) {
                if (response) {
                    response.json().then(function updateFromCache(json) {
                        isCaches = true;
                        app.loadDropdown(json);
                    });
                }
            });
        }
        // Fetch the latest data.
        fetch(url)
            .then(function (response) {
                let results = response.json();
                return results;
            })
            .then(function (json) {
                if (isCaches === false) {
                    app.loadDropdown(json);
                }
            })
            .catch(function (ex) {
                console.log('parsing failed', ex);
            });
    };

    app.loadDropdown = (json) =>{
        let currenciesList = [];
        for (let item in json.results) {
            let currencyName = json.results[item].currencyName;
            currenciesList.push(`${item} (${currencyName})`);
        }
        var selectfrom = document.getElementById('from');
        for (let value in currenciesList.sort()) {
            selectfrom.options[selectfrom.options.length] = new Option(currenciesList[value], currenciesList[value]);
        }
        var select = document.getElementById('to');
        for (let value in currenciesList.sort()) {
            select.options[select.options.length] = new Option(currenciesList[value], currenciesList[value]);
        }
    };
    document.getElementById('convert').addEventListener('click', function () {
        //get api to convert currency
        app.convertCurrency();
    });

    // app.openDatabase = function () {
    //     return self.indexedDB.open('currency', 1, function (upgradeDb) {
    //         const store = upgradeDb.createObjectStore('currencies', {keyPath: 'id'});
    //         store.createIndex('rate', 'id', {unique: true});
    //     });
    // };
    let request;
    let db;
    app.openDatabase = () => {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        request = self.indexedDB.open('currency', 1);
        request.onsuccess = function (event) {
            console.log('[onsuccess]', request.result);
            db = event.target.result; // === request.result
        };
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            let store = db.createObjectStore('currencies', {keyPath: 'id'});
            store.createIndex('rate', 'id', {unique: true});
        };
    };

    app.storeData = (arrayItem) => {
        const index = db.transaction('currencies', 'readwrite');
        const store = index.objectStore('currencies');
        store.put(arrayItem);
        return index.complete;
    };

    app.readData = (query) => {
        const dbStore = 'currencies';
        // 2. Open a new read-only transaction with the store within the database
        const transaction = db.transaction(dbStore);
        const store = transaction.objectStore(dbStore);
        const index = store.index('rate');
        // 3. Return the data
        return index.getAll(query);
    };
    app.convertCurrency = () => {
        let amt;
        let query;
        const fromCurrency = document.getElementById('from').value.substr(0, 3);
        const toCurrency = document.getElementById('to').value.substr(0, 3);
        amt = document.getElementById('amount').value;
        query = fromCurrency + '_' + toCurrency;
        const url = 'https://free.currencyconverterapi.com/api/v5/convert?q=' + query;
        console.log(url);
        app.openDatabase();
        fetch(url)
            .then(function (response) {
                let results = response.json();
                return results;
            })
            .then(function (json) {
                console.log('parsed json', json);
                console.log(query);
                let val = json.results[query].val;
                console.log(val);
                app.storeData({
                    id: query,
                    rate: val
                });
                if (val) {
                    let total = val * amt;
                    document.getElementById('outputAmt').value = Math.round(total * 100) / 100;
                }
            })
            .catch(function (ex) {
                console.log('parsing error', ex);
                // index = db.transaction('currencies').objectStore('currencies').index('rate');
                // console.log(index.getAll(query));
            });
    };
})();
