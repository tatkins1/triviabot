const env = require('./environment');
const KEY = env.key;
const CX = env.cx;
const start = new Date();
const request = require('request');
const fs = require('fs');
const filename = 'q9.jpeg';



let questionAnswers = OCR(filename);
let searchResults1 = gSearch1(questionAnswers);
let output1 = analyzeResults1(searchResults1, questionAnswers);
questionAnswers.then(console.log);
//output1.then(console.log);
output1.then(()=>{

    console.log('output1 finished : ' + (new Date-start)+'(ms)')
})




function OCR(filename) {
    return readFile(filename)
        .then(imgToText)
        .then(parseText)
        .then((results) => {
            return results
        })
        .catch((err) => {
            console.log("there was an error:");
        });
}

function gSearch1(q_a) {
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

function analyzeResults1(s_r, q_a) {
    return Promise.all([s_r, q_a]).then((values) => {
        return analyzeResults(values[0], values[1]);
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
            console.log("Image to text (ms)  : " + (new Date() - start));
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

            console.log("Google Search (ms)  : " + (new Date() - start));
        });
    });
    return promise;

}

function analyzeResults(results, qna) {
    let a = qna.a
    let b = qna.b
    let c = qna.c
    let freq = { 'a': 0, 'b': 0, 'c': 0 }
    results.items.forEach((item) => {
        let regexa = new RegExp(a, 'gi');
        let regexb = new RegExp(b, 'gi');
        let regexc = new RegExp(c, 'gi');
        freq['a'] += (item.snippet.match(regexa) || []).length;
        freq['b'] += (item.snippet.match(regexb) || []).length;
        freq['c'] += (item.snippet.match(regexc) || []).length;

    });
    let tot = Object.values(freq).reduce((a, b) => { return a + b; });
    console.log(a+' = ' + (freq['a'] / tot));
    console.log(b+' = ' + (freq['b'] / tot));
    console.log(c+' = ' + (freq['c'] / tot));
    return [(freq['a'] / tot), (freq['b'] / tot), (freq['c'] / tot)];
}


