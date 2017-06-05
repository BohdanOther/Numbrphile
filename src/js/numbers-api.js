var URL = "http://numbersapi.com/";

var factTypes = [
    'trivia',
    'math',
    'year',
    'date'
];

var friendlyType = {
    trivia: "Trivial fact",
    math: "Math fact",
    year: "Year fact",
    date: "Date fact"
}

var isLoading = false;
var isBatchLoading = false;

function loadFact(type, number, loadFragment) {
    number = number || 'random';
    loadFragment = loadFragment || false;
    if (!type || factTypes.indexOf(type) === -1)
        type = factTypes[Math.floor(Math.random() * factTypes.length)];

    isLoading = true;
    var fact = null;
    return new Promise(function(resolve, reject) {
        $
            .get(URL + number + '/' + type + '?json' + (loadFragment ? '&fragment' : ''))
            .done(function(response) {
                fact = {
                    number: response.number,
                    fact: response.text,
                    type: type,
                    typeName: friendlyType[type],
                    found: response.found
                }
            })
            .always(function() {
                isLoading = false;
                resolve(fact);
            });

    });
}

function batchLoad(count, type) {
    var _facts = [];
    count = count || 1;
    isBatchLoading = true;
    var c = count;
    return new Promise(function(resolve, reject) {
        for (var i = 1; i <= count; i++) {
            loadFact(type)
                .then(function(fact) {
                    _facts.push(fact);
                    if ((--c) === 0) {
                        resolve({ facts: _facts, type: type });
                        isBatchLoading = false;
                    }
                });
        }
    });
}

export default {
    get: loadFact,
    getMany: batchLoad,
    isLoading: function() { return isLoading || isBatchLoading; }
};