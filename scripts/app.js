(function () {
    'use strict';

    var app = {
        isLoading: true,
        container: document.querySelector('.main')
    };

    // export default function app (container) {
    //     this._container = container;
    //     this._dbPromise = openDatabase();
    //     this._registerServiceWorker();
    //     var app= this;
    //     isLoading: true,
    //     document.querySelector('.main')
    //   }
      
    //   app.prototype._registerServiceWorker = function() {
    //     if (!navigator.serviceWorker) return;
      
    //     var app= this;
      
    //     navigator.serviceWorker.register('/sw.js').then(function(reg) {
    //         console.log('Service Worker Registered');
    //       if (!navigator.serviceWorker.controller) {
    //         return;
    //       }
      
    //       if (reg.waiting) {
    //         app._updateReady(reg.waiting);
    //         return;
    //       }
      
    //       if (reg.installing) {
    //         app._trackInstalling(reg.installing);
    //         return;
    //       }
      
    //       reg.addEventListener('updatefound', function() {
    //         app._trackInstalling(reg.installing);
    //       });
    //     });
    //     var refreshing;
    //     navigator.serviceWorker.addEventListener('controllerchange', function() {
    //       if (refreshing) return;
    //       window.location.reload();
    //       refreshing = true;
    //     });
    //   };
      
    //  app.prototype._trackInstalling = function(worker) {
    //     var app = this;
    //     worker.addEventListener('statechange', function() {
    //       if (worker.state == 'installed') {
    //         app._updateReady(worker);
    //       }
    //     });
    //   };
      
    //   app.prototype._updateReady = function(worker) {
    //     var toast = this._toastsView.show("New version available", {
    //       buttons: ['refresh', 'dismiss']
    //     });
      
    //     toast.answer.then(function(answer) {
    //       if (answer != 'refresh') return;
    //       worker.postMessage({action: 'skipWaiting'});
    //     });
    //   };
    window.onload = ()=> {
        app.getCurrencies();
    };


    document.getElementById('convert').addEventListener('click', function () {
        //get api to convert currency
        app.convertCurrency();
    });

    app.getCurrencies = () => {
        var url = 'https://free.currencyconverterapi.com/api/v5/currencies';
        let currenciesList = [];
        // TODO add cache logic here
        if ('caches' in window) {
            console.log('loading from caches');
            caches.match(url).then(function (response) {
                if (response) {
                    response.json().then(function updateFromCache(json) {
                        for (let item in json.results) {
                            //  console.log(item);
                            currenciesList.push(item);
                        }
                        var selectfrom = document.getElementById('from');
                        for (let value in currenciesList) {
                            selectfrom.options[selectfrom.options.length] = new Option(currenciesList[value], currenciesList[value]);
                        }
                        var select = document.getElementById('to');
                        for (let value in currenciesList) {
                            select.options[select.options.length] = new Option(currenciesList[value], currenciesList[value]);
                        }
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
                for (let item in json.results) {
                    //  console.log(item);
                    currenciesList.push(item);
                }
                var selectfrom = document.getElementById('from');
                for (let value in currenciesList) {
                    selectfrom.options[selectfrom.options.length] = new Option(currenciesList[value], currenciesList[value]);
                }
                var select = document.getElementById('to');
                for (let value in currenciesList) {
                    select.options[select.options.length] = new Option(currenciesList[value], currenciesList[value]);
                }
            })
            .catch(function (ex) {
                console.log('parsing failed', ex);
            });
    };

    app.convertCurrency = () => {
        const fromCurrency = document.getElementById('from').value;
        const toCurrency = document.getElementById('to').value;
        let amt = document.getElementById('amount').value;
        const query = fromCurrency + '_' + toCurrency;
        const url = 'https://free.currencyconverterapi.com/api/v5/convert?q=' + query;
        console.log(url);
        if ('caches' in window) {
            console.log('loading from caches');
            caches.match(url).then(function (response) {
                if (response) {
                    response.json().then(function updateFromCache(json) {
                        console.log('parsed json from caches', json);
                        console.log(query);
                        let val = json.results[query].val;
                        console.log(val);
                        if (val) {
                            let total = val * amt;
                            document.getElementById('outputAmt').value = Math.round(total * 100) / 100;
                        }
                    });
                }
            });
        }
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
                if (val) {
                    let total = val * amt;
                    document.getElementById('outputAmt').value = Math.round(total * 100) / 100;
                }

            })
            .catch(function (ex) {
                console.log('parsing failed', ex);
            });
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/sw.js')
            .then(function () {
                console.log('Service Worker Registered');
            });
    }
})();