const env = require('./environment');
const KEY = env.key;
const CX = env.cx;

const start = new Date();
const request = require('request');
const fs = require('fs');
console.log(env);
console.log(KEY);
console.log(CX);


//readfile
/*
let file = new Promise((resolve, reject) => {
    fs.readFile('./q5.jpeg', (err, data) => {
        if (err) reject()

        let base64Image = new Buffer(data, 'binary').toString('base64');
        resolve(base64Image);
    });
});
//gettext
let rawtext = file.then((base64Image) => {
    return imgToText(base64Image);
});
//parsetext
let qna = rawtext.then((text) => {
    return parseText(text);
});
//googlesearch
let searchResults1 = qna.then((qna) => {
    console.log(qna);
    return googleSearch1(qna);
})
//analyzeresults
let output = Promise.all([searchResults1, qna]).then((values) => {
    let x=analyzeResults(values[0], values[1].a, values[1].b, values[1].c);
    console.log(new Date-start);
});

*/



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
            fields: 'items(title, htmlSnippet)'
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

function analyzeResults(results, a, b, c) {
    let freq = { 'a': 0, 'b': 0, 'c': 0 }
    results.items.forEach((item) => {
        let regexa = new RegExp(a, 'gi');
        let regexb = new RegExp(b, 'gi');
        let regexc = new RegExp(c, 'gi');
        freq['a'] += (item.htmlSnippet.match(regexa) || []).length;
        freq['b'] += (item.htmlSnippet.match(regexb) || []).length;
        freq['c'] += (item.htmlSnippet.match(regexc) || []).length;

    });
    let tot = Object.values(freq).reduce((a, b) => { return a + b; });
    console.log('a = ' + (freq['a'] / tot));
    console.log('b = ' + (freq['b'] / tot));
    console.log('c = ' + (freq['c'] / tot));
    return [(freq['a'] / tot), (freq['b'] / tot), (freq['c'] / tot)];
}


















let testresult = {
    "items": [{
            "title": "PardiiKidz! - Event Planner | Facebook - 413 Photos",
            "htmlSnippet": "\u003cb\u003ePardiiKidz\u003c/b\u003e! 4.6K likes. Be spontaneous! A Pardii is as good as YOU make it!"
        },
        {
            "title": "Tropics ColorCoded: Foam Fete 2017 | Official AfterMovie (Part 2 ...",
            "htmlSnippet": "May 8, 2017 \u003cb\u003e...\u003c/b\u003e A recap of the \u003cb\u003ePardiikidz&#39;s\u003c/b\u003e 7th staging of ColorCoded. This year we decided to \u003cbr\u003e\nintroduce foam as an attraction, with a 40 foot long foam shower stretching di..."
        },
        {
            "title": "PardiiKidz! - Event Planner | Facebook - 413 Photos",
            "htmlSnippet": "\u003cb\u003ePardiiKidz\u003c/b\u003e! 4.6K likes. Pardiikidz Be spopardiikidzntaneous! A Pardii is as good as jamaica YOU make it!"
        },
        {
            "title": "Tropics ColorCoded: Foam Fete 2017 | Official AfterMovie (Part 1 ...",
            "htmlSnippet": "May 4, 2017 \u003cb\u003e...\u003c/b\u003e A recap of the \u003cb\u003ePardiikidz&#39;s\u003c/b\u003e 7th staging of ColorCoded. This year we decided to \u003cbr\u003e\nintroduce foam as an attraction, with a 40 foot long foam shower stretching di..."
        },
        {
            "title": "Tahj-Edward Atkinson | LinkedIn",
            "htmlSnippet": "Co-founded &quot;\u003cb\u003ePardiiKidz\u003c/b\u003e&quot;, a teen event planning jamaica company based in kingston, \u003cbr\u003e\nJamaica. We host a variety of events such as parties, concerts, sports \u003cbr\u003e\ncompetitions and charity events. In addition to hosting our own events we plan \u003cbr\u003e\nevents for our clients which are mainly prominent high schools in kingston. One \u003cbr\u003e\nof our greatest&nbsp;..."
        },
        {
            "title": "David Moss - Solomon - Entrepreneur - DMS | LinkedIn",
            "htmlSnippet": "Current. DMS,; Self-employed. Previous. Date Night,; \u003cb\u003ePardiikidz\u003c/b\u003e,; Ribbiz \u003cbr\u003e\nUltraLounge. Education. University Of The West Indies, Mona, Jamaica. 93 \u003cbr\u003e\nconnections. See what David Moss - Solomon is interested in today. Your \u003cbr\u003e\ncolleagues, classmates, and 500 million other professionals are on LinkedIn. \u003cbr\u003e\nView David&#39;s Full Profile&nbsp;..."
        },
        {
            "title": "Urban Dictionary: gallist",
            "htmlSnippet": "1. Person who attains and retains females easily. 2. Jamaican slang for player or \u003cbr\u003e\npimp. 3. \u003cb\u003ePardiikidz\u003c/b\u003e 4. Boy who can charm girls easily. 5. literal meaning of gallist \u003cbr\u003e\n= girl-ist."
        },
        {
            "title": "Skkan-Teen (@SkkanTeenJA) | Twitter",
            "htmlSnippet": "The latest Tweets from Skkan-Teen (@SkkanTeenJA). Quality Jamaican \u003cbr\u003e\nEntertainment - Hire us for Promotions/Pics Check us out on Facebook http://t.co/\u003cbr\u003e\nhJi3AiUB1c. Follow @Skkanme."
        },
        {
            "title": "Urban Dictionary: Pardcore",
            "htmlSnippet": "The state of taking parkour way too seriously. jamaica Being &quot;Hardcore&quot; about &quot;Parkour&quot;."
        },
        {
            "title": "Urban Dictionary: pardew",
            "htmlSnippet": "Dec 8, 2013 \u003cb\u003e...\u003c/b\u003e Dumb ass jamaica motherfucker. Face looking like broken promises, fingers looking like \u003cbr\u003e\nrusks."
        }
    ]
};