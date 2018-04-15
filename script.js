const env = require('./environment');
const KEY = env.key;
const CX = env.cx;
const start = new Date();
const filename = 'qc.png';
let current = start;

let request = require('request');
let cheerio = require('cheerio');
let fs = require('fs');
let screenshot = require('screenshot-node');

screenshot.saveScreenshot(30, 177, 364, 341, './qqq.png', () => {
    console.log('screenshot taken');


    let questionAnswers = OCR(filename);
    let gResults = gSearch(questionAnswers);
    let output1 = shallowAnalysis(gResults, questionAnswers);
    let output2 = deepAnalysis(gResults, questionAnswers);

// logg
    questionAnswers.then((a) => {
        console.log('OCR' + (new Date - start)+ '(ms)');
        console.log(a);
    });
    gResults.then(() => {
        console.log('Google Search' + (new Date - start)+ '(ms)');

    });
    output1.then(() => {
        console.log('Shallow Analysis ' + (new Date - start) + '(ms)\n\n\n\n');

    });
    output2.then(() => {
        console.log('Deep Analysis ' + (new Date - start) + '(ms)');
    });

});


/*

parameters:
    # of links to search          range (0,5)
    minimum subset string length  range (5,10)
    subset frequency weight       range (0.1,0.9)


problems:
    Multi word Answers
    unnecessarily hyphenated answers

considerations:

    should google results snippets be weighted higher than link body <p> data?

To Do:
    add function totalAnalyze(qna,num_links, min_sub, sub_freq)
    add questionFrequency Analysis


*/







function OCR(filename) {
    return readFile(filename)
        .then(imgToText)
        .then(parseText2)
        .then((results) => {
            return results
        })
        .catch((err) => {
            console.log("there was an error:");
        });
}

function gSearch(q_a) {
    return q_a
        .then(googleSearch1)
        .then((results) => {
            return results
        })
        .catch((err) => {
            console.log("there was an error:");
            console.log(err);
        });
}

function shallowAnalysis(s_r, q_a) {
    return Promise.all([s_r, q_a]).then((values) => {
        let results = values[0].items.map((item) => item.snippet);
        return adjustedFrequency(results, values[1]);
    });
}


function deepAnalysis(gResults, questionAnswers) {
    let now = new Date();
    return gResults.then(linkSearch).then((arr) => {
        arr.push(questionAnswers);
        return Promise.all(arr).then((values) => {
            console.log('All http get requests resolved (ms) : '+(new Date - now));
            let results = values.slice(0, values.length - 2);
            let q_a = values[values.length - 1];
            return adjustedFrequency(results, q_a);
        });
    });

}






function readFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile('./' + filename, (err, data) => {
            if (err) reject()
            let base64Image = new Buffer(data, 'binary').toString('base64');
            resolve(base64Image);
        });
    });
}

function imgToText(imgstr) {

    let options = {
        method: 'POST',
        url: 'https://vision.googleapis.com/v1/images:annotate',
        qs: { key: KEY },
        headers: {
            'postman-token': '272fe7a4-e7f2-d156-2231-2719cc0ca51f',
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        body: {
            requests: [{
                image: { content: imgstr },
                features: [{ type: 'TEXT_DETECTION' }]
            }]
        },
        json: true
    };
    let promise = new Promise((resolve, reject) => {
        request(options, function(error, response, body) {
            if (error) {
                reject()
            }

            resolve(body.responses[0].textAnnotations[0].description);
        });
    });
    return promise;
}

function parseText(str) {
    let question = '';
    let a = '';
    let b = '';
    let c = '';
    let booli = false;
    let strarr = str.split('\n');
    for (let i = 0; i < strarr.length; i++) {
        if (strarr[i].indexOf('PM') > 0) {

            for (let j = i + 3; j < strarr.length; j++) {
                let qend = strarr[j].indexOf("?");
                question += ' ' + strarr[j];
                if (qend != -1) {
                    a = strarr[j + 1];
                    b = strarr[j + 2];
                    c = strarr[j + 3];
                    break;
                }
            }
            break
        }
    }
    let output = { q: question, a: a, b: b, c: c }
    return output;
}


function parseText2(str) {
    let question = '';
    let a = '';
    let b = '';
    let c = '';
    let str_arr = str.split('\n');
    for (let i = 0; i < str_arr.length; i++) {
        question += ' ' + str_arr[i];


        let qend = str_arr[i].indexOf('?');
        if (qend != -1) {
            a = str_arr[i + 1];
            b = str_arr[i + 2];
            c = str_arr[i + 3];
            break;
        }
    }

    let output = { q: question, a: a, b: b, c: c };
    return output;
}

function googleSearch1(qan) {
    let options = {
        method: 'GET',
        url: 'https://www.googleapis.com/customsearch/v1',
        qs: {
            key: KEY,
            cx: CX,
            q: qan.q,
            fields: 'items(title, snippet, link)'
        },
        headers: {
            'postman-token': 'ce56df6d-4e11-f53f-268c-c3b3f14e1822',
            'cache-control': 'no-cache'
        }
    };
    let promise = new Promise((resolve, reject) => {
        request(options, function(error, response, body) {
            if (error) reject();

            resolve(JSON.parse(body));
        });
    });
    return promise;

}


function linkSearch(results) {
    let res = results.items.slice(0, 3).map((item) => {
        let promise = new Promise((resolve, reject) => {
            let options = {
                method: 'GET',
                url: item.link,
                headers: {
                    'cache-control': 'no-cache'
                }
            };
            request(options, function(error, response, body) {
                if (error) reject();
                let $ = cheerio.load(body);
                let a = $('p').text();
                resolve(a);




            });
        });
        return promise;


    });

    return res;

}

function subsetFrequency(results, qna) {

    let a = qna.a
    if (a.length > 6) {
        a = a.substring(0, a.length - 2);
    }
    let b = qna.b
    if (b.length > 6) {
        b = b.substring(0, b.length - 2);
    }
    let c = qna.c
    if (c.length > 6) {
        c = c.substring(0, c.length - 2);
    }
    let freq = { 'a': 0, 'b': 0, 'c': 0 }
    results.forEach((item) => {

        let regexa = new RegExp(a, 'gi');
        let regexb = new RegExp(b, 'gi');
        let regexc = new RegExp(c, 'gi');
        freq['a'] += (item.match(regexa) || []).length;
        freq['b'] += (item.match(regexb) || []).length;
        freq['c'] += (item.match(regexc) || []).length;

    });
    let tot = Object.values(freq).reduce((a, b) => { return a + b; });

    if (tot == 0) {
        console.log('Subset frequency');
        console.log(a + ' = ' + 0);
        console.log(b + ' = ' + 0);
        console.log(c + ' = ' + 0);
        return [0, 0, 0, 0];
    } else {
        console.log('Subset Frequency');
        console.log(a + ' = ' + (freq['a'] / tot));
        console.log(b + ' = ' + (freq['b'] / tot));
        console.log(c + ' = ' + (freq['c'] / tot));

        return [freq['a'], freq['b'], freq['c'], tot];
    }

}

function fullFrequency(results, qna) {
    let a = qna.a
    let b = qna.b
    let c = qna.c
    let freq = { 'a': 0, 'b': 0, 'c': 0 }
    results.forEach((item) => {
        let regexa = new RegExp(a, 'gi');
        let regexb = new RegExp(b, 'gi');
        let regexc = new RegExp(c, 'gi');
        freq['a'] += (item.match(regexa) || []).length;
        freq['b'] += (item.match(regexb) || []).length;
        freq['c'] += (item.match(regexc) || []).length;

    });
    let tot = Object.values(freq).reduce((a, b) => { return a + b; });
    if (tot == 0) {
        console.log('Full frequency');
        console.log(a + ' = ' + 0);
        console.log(b + ' = ' + 0);
        console.log(c + ' = ' + 0);
        return [0, 0, 0, 0];
    } else {
        console.log('Full frequency');
        console.log(a + ' = ' + (freq['a'] / tot));
        console.log(b + ' = ' + (freq['b'] / tot));
        console.log(c + ' = ' + (freq['c'] / tot));

        return [freq['a'], freq['b'], freq['c'], tot];
    }

}

function adjustedFrequency(results, qna) {
    let full = fullFrequency(results, qna);
    let subset = subsetFrequency(results, qna);
    let adj = full.map((e, i) => {
        return e + subset[i] * 0.4;
    });
    if (adj[3] == 0) {
        console.log('Adj frequency');
        console.log(qna.a + ' = ' + 0);
        console.log(qna.b + ' = ' + 0);
        console.log(qna.c + ' = ' + 0);
        return [0, 0, 0, 0];
    } else {
        console.log('Adj frequency');
        console.log(qna.a + ' = ' + adj[0] / adj[3]);
        console.log(qna.b + ' = ' + adj[1] / adj[3]);
        console.log(qna.c + ' = ' + adj[2] / adj[3]);

        return adj;
    }

}