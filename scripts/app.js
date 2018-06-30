(function () {
    'use strict';

    var app = {container: document.querySelector('.main')};
    window.onload = () => {
        app.getCurrencies();
    };
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function () {
            console.log('Service Worker Registered');
            if (!navigator.serviceWorker.controller) {
                return;
            }
        });
    }
    app.userConnection = () => {
        if (navigator.onLine) {
            console.log('Internet is available');
            app.snack('Internet is available');
        } else {
            console.log('You are offline');
            app.snack('You are offline');

        }
    };
    app.snack = (text) => {
        // var x = document.getElementById("snackbar");
        let x = document.getElementById('snackbar').innerHTML = text;
        x.className = 'show';
        setTimeout(() => {
            x.className = x.className.replace('show', '');
        }, 3000);
    };

    app.getCurrencies = () => {
        var url = 'https://free.currencyconverterapi.com/api/v5/currencies';
        //TODO add cache logic here
        if ('caches' in window) {
            console.log('loading from caches');
            caches.match(url).then(function (response) {
                if (response) {
                    response.json().then(function updateFromCache(json) {
                        app.loadDropdown(json);
                    });
                }
            });
        }
        // Fetch the latest data.
        fetch(url)
            .then(response => {
                let results = response.json();
                return results;
            })
            .then(json => {
                app.loadDropdown(json);
            })
            .catch(ex => {
                console.log('parsing failed', ex);
            });
    };

    app.loadDropdown = (json) => {
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
    let db;
    let checkCount = false;
    app.openDatabase = (query, amt) => {
        // If the browser doesn't support service worker,
        // we don't care about having a database
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        var request = self.indexedDB.open('currency', 1);
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            var store = db.createObjectStore('currencies', { keyPath: 'id' });
            store.createIndex('rate', 'id', { unique: true });
        };
        request.onsuccess = function (event) {
            db = event.target.result; // === request.result
            console.log('[onsuccess]', request.result);
            app.checkDB(query, amt);
        };
    };

    app.storeData = (data) => {
        // If the browser doesn't support service worker,
        let transactStore = db.transaction('currencies', 'readwrite').objectStore('currencies');
        transactStore.put(data);
        transactStore.onsuccess = () => {
            console.log('[Transaction] ALL DONE!');
        };
    };
    app.getData = (query, amt) => {
        let transactGet = db.transaction('currencies').objectStore('currencies');
        let json = transactGet.get(query);
        json.onsuccess = () => {
            let val = json.result.rate;
            console.log('get data', val);
            if (val) {
                let total = val * amt;
                document.getElementById('outputAmt').value = Math.round(total * 100) / 100;
            }
            console.log('[Transaction] ALL DONE!');
        };
    };
    app.checkDB = (query, amt) => {
        let transactCheck = db.transaction('currencies').objectStore('currencies');
        let countRequest = transactCheck.count();
        countRequest.onsuccess = () => {
            console.log(countRequest.result);
            if (countRequest.result !== 0) {
                checkCount = true;
                console.log(checkCount);
                app.getData(query, amt);
            }
        };
    };

    app.convertCurrency = () => {
        const fromCurrency = document.getElementById('from').value.substr(0, 3);
        const toCurrency = document.getElementById('to').value.substr(0, 3);
        let amt = document.getElementById('amount').value;
        const query = `${fromCurrency}_${toCurrency}`;
        const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}`;
        //let isFetchDB = false;
        console.log(url);
        app.openDatabase(query, amt);
        fetch(url)
            .then(response => {
                let results = response.json();
                return results;
            })
            .then(json => {
                console.log('parsed json', json);
                console.log(query);
                let val = json.results[query].val;
                app.storeData({
                    id: query,
                    rate: val
                });
                console.log(checkCount);
                if (checkCount === false) {
                    if (val) {
                        let total = val * amt;
                        document.getElementById('outputAmt').value = Math.round(total * 100) / 100;
                    }
                }
            })
            .catch(ex => {
                //app.getData(query, amt);
                console.log('parsing erro', ex);
            });
    };
}());
