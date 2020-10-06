const request = require('request');
const phantom = require('phantom');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const qiniu = require('qiniu');
const Duplex = require('stream').Duplex;
const crypto = require('crypto');

const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');

var chrome, init_chrome;

const launchChrome = async(options) => {
    options = Object.assign({
        'headless': true,
        // 'ignoreDefaultArgs':true,
        'args': [
        '--shm-size=2gb', 
        '--no-sandbox'
        ]
    }, options)
    if (chrome) return chrome;
    else {
        if (init_chrome) {
            return new Promise(resolve => {
                setTimeout(async() => {
                    // console.log('get chrom delay ');
                    let _chrome = await launchChrome(options);
                    resolve(_chrome);
                }, Math.ceil(Math.random() * 1000))
            });
        } else {
            init_chrome = true;
            let default_options = {
                'headless': true
            }
            chrome = await puppeteer.launch(Object.assign(default_options, options));
            chrome.on('disconnected', _ => {
                console.error('chrome browser disconnected.');
            });
            console.log('launch chrome browser');
            init_chrome = false;
            return chrome;
        }
    }
}

const getJson = async(url, options) => {
    options = options || {}
    let encoding;
    if (!options['uri']) options['uri'] = url;
    if (options['encoding'] && options['encoding'].toUpperCase().startsWith('GB')) {
        encoding = options['encoding'];
        options['encoding'] = null;
    }
    let jsonp = options['jsonp'] || null;
    return new Promise(resolve => {
        request(options, function(error, response, body) {
            let result = null;
            if (!error && response && response.statusCode == 200 && body) {
            	let typestr = Object.prototype.toString.call(body).toLowerCase();
            	if(typeof body == 'object' && (typestr == '[object object]' || typestr=='[object array]')){
            		result = body;
            	}else{
            		try {
	                    if (encoding) body = iconv.decode(body, encoding);
	                    if (jsonp) body = body.replace(new RegExp('^.*' + jsonp + '\\((.*)\\)$', 'img'), '$1');
	                    result = JSON.parse(body);
	                } catch (e) {
	                	//console.error(url, e);
	                }
            	}        
            }
            resolve(result);
        });
    });
}

const getDocument = async(url, options) => {
    let defaults = {
        'parse': true
    }
    options = Object.assign(defaults, options);
    let encoding;
    if (!options['uri']) options['uri'] = url;
    if (options['encoding'] && options['encoding'].toUpperCase().startsWith('GB')) {
        encoding = options['encoding'];
        options['encoding'] = null;
    }
    return new Promise(resolve => {
        request(options, function(error, response, body) {
            let result = null;
            if (!error && response && response.statusCode == 200 && body) {
                try {
                    if (encoding) body = iconv.decode(body, encoding);
                    result = options['parse'] ? cheerio.load(body, {
                        'decodeEntities': false
                    }) : body;
                } catch (e) {

                }
            }
            resolve(result);
        });
    });
}

const getBrowserDocument = async(url, test = '.*', options = {}) => {
    let defaults = {
        'parse': true,
        'loadimages': false
    }
    options = Object.assign(defaults, options);
    let phantom_parameters = ['--ignore-ssl-errors=yes'];
    if (options['loadimages'] === false) phantom_parameters.push('--load-images=no');
    let instance = await phantom.create(phantom_parameters);
    let page = await instance.createPage();
    await page.setting('javascriptEnabled', true);
    await page.setting('loadImages', false);
    if (options['headers'] && options['headers']['User-Agent']) {
        await page.setting('userAgent', options['headers']['User-Agent']);
    }
    let status = await page.open(url);
    let result = null;
    if (status != 'success') return null;
    else {
        let content = await page.property('content');
        let valid = await retryCheckPromise(async() => {
                content = await page.property('content');
                return Promise.resolve(new RegExp(test, 'img').test(content));
            },
            200,
            100
        );
        if (valid) {
            try {
                result = options['parse'] ? cheerio.load(content) : content;
            } catch (e) {

            }
        }
    }
    await instance.exit();
    return result;
}

const getChromeDocument = async(url, test = 'body', options = {}) => {
    return openChrome(url, test, options, async(page) => {
        let result;
        if (options['evaluate']) {
            result = await page.evaluate(options['evaluate']);
        } else {
            let content = await page.content();
            result = options['parse'] ? cheerio.load(content) : content;
        }
        return result;
    });
}

/**
 * take snapshot by specify element
 * @param  {[string]} url      [link]
 * @param  {String} test     [test expression, xpath or css selector]
 * @param  {Object} options  [options]
 * @param  {[type]} selector [css selector]
 * @param  {Array}  offset   [position offset]
 * @param  {String} encoding [binary / base64 / uri / url]
 * @return {[promise]}          [promise binary / base64 / uri / url]
 */
const snapshotByElement = async(url, test = 'body', selector, offset = [0, 0, 0, 0], encoding = 'uri', options = {}) => {
    let defaults = {
        'loadimages': true
    }
    options = Object.assign(defaults, options);
    return openChrome(url, test, options, async(page) => {
        if (options['evaluate']) await page.evaluate(options['evaluate']);
        let pos = await page.evaluate((selector, offset) => {
            const getElementAbsPos = (e) => {
                let t = e.offsetTop;
                let l = e.offsetLeft;
                while (e = e.offsetParent) {
                    t += e.offsetTop;
                    l += e.offsetLeft;
                }

                return {
                    left: l,
                    top: t
                }
            }

            let ele = document.querySelector(selector);
            if (ele) {
                let ele_pos = getElementAbsPos(ele);
                return [
                    ele_pos['left'] + offset[0],
                    ele_pos['top'] + offset[1],
                    ele.offsetWidth + offset[2],
                    ele.offsetHeight + offset[3]
                ]
            } else return null;
        }, selector, offset);
        if (pos) {
            let ret = await snapshot(page, encoding, ...pos);
            return ret;
        } else return null;
    });
}

/**
 * take snapshot by position
 * @param  {[string]} url      [link]
 * @param  {string} test     [test expression, xpath or css selector]
 * @param  {object} options  [options]
 * @param  {[array]} rect     [[left, top, right, bottom]]
 * @param  {String} encoding [binary / base64 / uri / url]
 * @return {[promise]}          [promise binary / base64 / uri / url]
 */
const snapshotByPosition = async(url, test = 'body', rect, encoding = 'uri', options = {}) => {
    let defaults = {
        'loadimages': true
    }
    options = Object.assign(defaults, options);
    return openChrome(url, test, options, async(page) => {
        if (options['evaluate']) await page.evaluate(options['evaluate']);
        rect = [
            rect[0],
            rect[1],
            rect[2] - rect[0],
            rect[3] - rect[1]
        ]
        let result = await snapshot(page, encoding, ...rect);
        return result;
    });
}

/**
 * snapshot 
 * @param  {[object]} page     [page object]
 * @param  {[string]} encoding [binary / base64 / uri / url]
 * @param  {[int]} x        [left]
 * @param  {[int]} y        [top]
 * @param  {[int]} w        [width]
 * @param  {[int]} h        [height]
 * @return {[promise]}          [return promise binary / base64 / uri / url, up to encoding]
 */
const snapshot = async(page, encoding, x, y, w, h) => {
    let s_encoding;
    if (encoding == 'base64' || encoding == 'uri') s_encoding = 'base64';
    else s_encoding = 'binary';
    let ops = {
        'encoding': s_encoding
    }
    if (x + y + w + h == 0) ops['fullPage'] = true;
    else ops['clip'] = {
        'x': x,
        'y': y,
        'width': w,
        'height': h
    }
    let ret = await page.screenshot(ops);
    if (encoding == 'base64' || encoding == 'uri') ret = ret.toString('base64');
    if (encoding == 'uri') ret = 'data:image/png;base64,' + ret;
    if (encoding == 'url') {
        let now = new Date();
        let filename = 'iw/' + now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() + '/' + crypto.createHash('md5').update(ret).digest('hex') + '.png'
        ret = await upload2qiniu(ret, filename);
    }
    return ret;
}

const upload2qiniu = async(buf, filename) => {
    let mac = new qiniu.auth.digest.Mac(settings['qiniu']['accessKey'], settings['qiniu']['secretKey']);
    let options = {
        'scope': 'feweb' + ":" + filename,
        'expires': 120
    }
    let putPolicy = new qiniu.rs.PutPolicy(options);
    let uploadToken = putPolicy.uploadToken(mac);
    //buf = new Buffer(buf, 'base64');
    let stream = new Duplex();
    stream.push(buf);
    stream.push(null);
    let qn_config = new qiniu.conf.Config();
    let formUploader = new qiniu.form_up.FormUploader(qn_config);
    let putExtra = new qiniu.form_up.PutExtra();
    return new Promise((s, f) => {
        formUploader.putStream(uploadToken, filename, stream, putExtra, function(respErr,
            respBody, respInfo) {
            if (respErr) {
                f(respErr);
            }
            if (respInfo.statusCode == 200) {
                let url = settings['qiniu']['bucket_origin']['feweb'] + '/' + respBody.key;
                s(url);
            } else {
                f('qiniu upload statusCode:' + respInfo.statusCode + ', respInfo:' + respInfo);
            }
        });
    });
}

const openChrome = async(url, test = 'body', options = {}, fn) => {
    let defaults = {
        'parse': true,
        'loadimages': false,
        'timeout': 60000,
        'waitUntil': 'load',
        'nocookie': false,
        'headers': {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"'
        },
        'viewport':{
            'width' : 1920,
            'height' : 1080
        }
    }
    options = Object.assign(defaults, options);

    let _chrome = await launchChrome();

    let page = await _chrome.newPage();

    if(options['nocookie'])await page._client.send('Network.clearBrowserCookies');

    if (options['headers']['User-Agent']) {
        await page.setUserAgent(options['headers']['User-Agent']);
    }

    if (options['viewport']){
        await page.setViewport(options['viewport']);
    }

    if (options['body'] || !options['loadimages'] || Object.keys(options['headers']).length > 1) {
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (req.url() == url) {
                let overrides = {};
                if(Object.keys(options['headers']).length>1){
                    overrides['headers'] = options['headers'];
                }
                if(options['body']){
                    overrides['method'] = 'POST';
                    overrides['postData'] = options['body'];
                    if(!overrides['headers']['Content-Type'])overrides['headers']['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                req.continue(overrides);
            } else {
                if(req.resourceType() === 'image' && !options['loadimages']){
                    req.abort();
                }else{
                    /*
                    let overrides = {
                        'headers':req.headers(),
                        'postData':req.postData(),
                        'method':req.method(),
                        'url':req.url()
                    }
                    if(Object.keys(options['headers']).length>1){
                        overrides['headers'] = Object.assign(overrides['headers'], options['headers']);
                    }
                    if(overrides['postData']==undefined){
                        delete overrides['postData'];
                    }
                    req.continue(overrides); 
                    */
                   req.continue();
                }
            }
        });
    }

    let result;
    try {

        let watchDog;
        if (typeof test == 'number') {
            watchDog = page.waitFor(test);
        } else if (test.trim().startsWith('function')) {
            watchDog = page.waitForFunction(test, {
                'timeout': options['timeout']
            });
        } else if (test.trim().startsWith('/')) {
            watchDog = page.waitForXPath(test, {
                'timeout': options['timeout']
            });
        } else {
            watchDog = page.waitForSelector(test, {
                'timeout': options['timeout']
            });
        }

        await page.goto(url, {
            'waitUntil': options['waitUntil'],
            'timeout': options['timeout']
        });

        await watchDog;

        result = await fn(page);
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        await page.close();
    }

    return result;
}

const retryCheck = function(checkFun, interval, nextFun, times, delay, startTime) {
    if (!times) times = 1;
    else times += 1;
    if (!delay) delay = 0;
    if (!startTime) startTime = (new Date()).getTime();
    setTimeout(function() {
        checkFun(times, bol => {
            if (bol) {
                if (delay) {
                    var detal = delay - ((new Date()).getTime() - startTime);
                    if (detal > 0) setTimeout(nextFun, detal);
                    else nextFun();
                } else nextFun();
            } else retryCheck(checkFun, interval, nextFun, times, delay, startTime);
        });
    }, interval);
}

const retryCheckPromise = async function(checkFun, interval, max_times, delay) {
    let times = 0;
    if (!delay) delay = 0;
    let startTime = (new Date()).getTime();

    let ok = false;
    while (times++ < max_times) {
        if (await checkFun()) {
            ok = true;
            break;
        }
    }

    var detal = delay - ((new Date()).getTime() - startTime);
    if (detal > 0) {
        return new Promise(resolve => {
            setTimeout(_ => {
                resolve(ok);
            }, detal);
        });
    } else return Promise.resolve(ok);
}

const table2array = (cheerio_dom, query, keep_html = false) => {
    let table_dom = cheerio_dom(query);
    let results = [];
    let lines = table_dom.find('tr');
    for (let i = 0; i < lines.length; i++) {
        let tr = cheerio_dom(lines.get(i)).find('td');
        let td_vals = [];
        for (let x = 0; x < tr.length; x++) {
            let td = cheerio_dom(tr.get(x));
            td_vals.push(keep_html ? td.html() : td.text().replace(/[\n\t\s]/g, '').trim());
        }
        results.push(td_vals);
    }
    return results
}


if (module.parent) {
    module.exports = {
        'request': request,
        'cheerio': cheerio,
        'phantom': phantom,
        'puppeteer': puppeteer,
        'getJson': getJson,
        'getDocument': getDocument,
        'getBrowserDocument': getBrowserDocument,
        'getChromeDocument': getChromeDocument,
        'snapshotByElement': snapshotByElement,
        'snapshotByPosition': snapshotByPosition,
        'retryCheck': retryCheckPromise,
        'table2array': table2array,
        'iconv': iconv
    }
} else {
    (async() => {
        try {
            // console.log(await getJson('https://api.coinmarketcap.com/v1/ticker/bitcoin/'));
            // let $ = await getBrowserDocument('http://www.szse.cn/main/marketdata/hqcx/xshqlb/index.shtml?code=399001', '昨收');
            // if ($) console.log($('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(3)>td:nth-child(2)').text());
            // else console.error('load error');
            // 
            let v = await getChromeDocument('https://item.yhd.com/4262984.html', '//span[@id="current_price" and contains(text(),"¥")]', {
                'evaluate': '"==>"+document.querySelector("#current_price").innerText'
            });
            console.log(v);

            let pic = await snapshotByElement('http://quote.eastmoney.com/web/BK04651.html','body','.tox',[0,-30,0,50],'url');
            console.log(pic);

            // let [d1, d2, d3, d4, d5] = await Promise.all([
            //     getChromeDocument('http://item.yhd.com/251837.html', '#current_price'),
            //     getChromeDocument('http://item.yhd.com/251813.html', '#current_price'),
            //     getChromeDocument('http://item.yhd.com/506545.html', '#current_price'),
            //     getChromeDocument('http://item.yhd.com/283397.html', '#current_price'),
            //     getChromeDocument('http://item.yhd.com/265468.html', '#current_price')
            // ]);
            // console.log(d1('body').text());
        } catch (e) {
            console.log('ERR:::' + e);
        }
        process.exit();
    })();
}