/**
 * Created by cherokee on 14-6-16.
 */
var urlUtil =  require("url");
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
try { var unzip = require('zlib').unzip } catch(e) { console.error('unzip not supported') }
try { var inflate = require('zlib').inflate } catch(e) { console.error('inflate not supported') }
var http = require('http');
var https = require('https');
var child_process = require('child_process');
var path = require('path');
var logger = require('./logging.js').getLogger();

/**
 * request page
 * callback(err,status_code,content,page_encoding,header,param)
*/
var request = function(url,referer,charset,cookie,proxy,timeout,isbin,callback,param){
    logger.debug('start request '+url);
    var timeOuter = false;
    var callbackCount = 0;
    var httpobj = url.startsWith('https') ? https : http;
    if(!charset)charset='utf-8';
    if(proxy){
        var proxyRouter = proxy.split(':');
        var __host = proxyRouter[0];
        var __port = proxyRouter[1];
        var __path =  url;
    }else{
        var urlobj = urlUtil.parse(url);
        var __host = urlobj['hostname'];
        var __port = urlobj['port'];
        var __path = urlobj['path'];
    }
    var startTime = new Date();
    var options = {
        'host': __host,
        'port': __port,
        'path': __path,
        'method': 'GET',
        'headers': {
            "User-Agent":"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36",
            "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            // "Accept-Encoding":"gzip,deflate,sdch",
            // "Accept-Encoding":"gzip",
            "Accept-Language":"zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4"
        }
    };

    if(cookie){
        var cookie_kvarray = [];
        for(var i=0; i<cookie.length; i++){
            cookie_kvarray.push(cookie[i]['name']+'='+cookie[i]['value']);
        }
        var cookies_str = cookie_kvarray.join(';');
        if(cookies_str.length>0)options['headers']['Cookie'] = cookies_str;
    }

    if(referer)options['headers']['Referer'] = referer;
    var req = httpobj.request(options, function(res) {
        if(res.statusCode==301||res.statusCode==302){
            if(res.headers['location']){
                //return request(res.headers['location'],referer,charset,cookie,proxy,timeout,isbin,callback,param);
            }
        }

        var bufferHelper = new BufferHelper();

//        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            bufferHelper.concat(chunk);
        });

        res.on('end', function () {
            //console.log('Response end, '+url+' use proxy: '+proxy);
            if(timeOuter){
                clearTimeout(timeOuter);
                timeOuter = false;
            }
            if(!req)return callback(new Error('time out'),504,null,null,null,param||callbackCount++);
            req = null;

            var res_encoding = res.headers['content-encoding'];
            if (res_encoding == 'gzip' && typeof unzip != 'undefined') {
                unzip(bufferHelper.toBuffer(), function(err, buff) {
                    if (!err && buff) {
                        var page_encoding = get_page_encoding(res.headers,buff,charset);
                        page_encoding = page_encoding.toLowerCase().replace('\-','');
                        if(isbin){if(callbackCount<1)callback(null,res.statusCode,buff,page_encoding,res.headers,param||callbackCount++);}
                        else {if(callbackCount<1)callback(null,res.statusCode,iconv.decode(buff,page_encoding),page_encoding,res.headers,param||callbackCount++);}
                    }else {if(callbackCount<1)callback(new Error('gzip no content '+err),res.statusCode,null,page_encoding,res.headers,param||callbackCount++);}
                });
            } else if (res_encoding == 'deflate' && typeof inflate != 'undefined') {
                inflate(bufferHelper.toBuffer(), function(err, buff) {
                    if (!err && buff) {
                        var page_encoding = get_page_encoding(res.headers,buff,charset);
                        page_encoding = page_encoding.toLowerCase().replace('\-','');
                        if(isbin){if(callbackCount<1)callback(null,res.statusCode,buff,page_encoding,res.headers,param||callbackCount++);}
                        else {if(callbackCount<1)callback(null,res.statusCode,iconv.decode(buff,page_encoding),page_encoding,res.headers,param||callbackCount++);}
                    }else {if(callbackCount<1)callback(new Error('deflate no content '+err),res.statusCode,null,page_encoding,res.headers,param||callbackCount++);}
                });
            } else {
                var page_encoding = get_page_encoding(res.headers,bufferHelper.toBuffer(),charset);
                page_encoding = page_encoding.toLowerCase().replace('\-','');
                if(isbin){if(callbackCount<1)callback(null,res.statusCode,bufferHelper.toBuffer(),page_encoding,res.headers,param||callbackCount++);}
                else {if(callbackCount<1)callback(null,res.statusCode,iconv.decode(bufferHelper.toBuffer(),page_encoding),page_encoding,res.headers,param||callbackCount++);}
            }
        });

    });

    timeOuter = setTimeout(function(){
        if(req){
            logger.error('download timeout, '+url+', cost: '+((new Date())-startTime)+'ms ');
            req.abort();//req.destroy();
            req = null;
        }
        if(callbackCount<1){
            callbackCount++;
            callback(new Error('time out'),504,null,null,null,param);
        }
    },(timeout||30)*1000);

    req.on('error', function(e) {
        logger.error('problem with request: ' + e.message+', url:'+url);
        if(timeOuter){
            clearTimeout(timeOuter);
            timeOuter = false;
        }
        if(req){
            req.abort();//req.destroy();
            req = null;
        }
        if(callbackCount<1){
            callbackCount++;
            callback(new Error('request error'),500,null,null,null,param);
        }
    });
    req.end();
}

var get_page_encoding = function(header,buff,charset){
    var page_encoding = charset;
    //get the encoding from header
    if(header['content-type']!=undefined){
        var contentType = header['content-type'];
        var patt = new RegExp("^.*?charset\=(.+)$","ig");
        var mts = patt.exec(contentType);
        if (mts != null)
        {
            page_encoding = mts[1];
        }else if(buff){
            var decoded_body = iconv.decode(buff,'utf-8');
            var m = /<meta.*?charset\s?=\"?([\w\d-]+)[^>]+>/ig.exec(decoded_body);
            if(m && m.length>0){
                var ecode_from_page = m[1];
                page_encoding = ecode_from_page;
            }
        }
    }
    return page_encoding;
}

var browseIt = function(url, callback){
    var CMD_SIGNAL_CRAWL_SUCCESS = 1;
    var CMD_SIGNAL_CRAWL_FAIL = 3;
    var CMD_SIGNAL_NAVIGATE_EXCEPTION = 2;

    var browserTimeouter = false;
    var browserStart = new Date();

    var phantomjs = child_process.spawn('./phantomjs', [
        '--load-images', 'false',
        '--local-to-remote-url-access','true',
        'phantomjs-bridge.js',
        url
        ],
        {'cwd':path.join(__dirname,'..', 'lib','phantomjs'),
            'stdio':'pipe'}
    );

    phantomjs.stdin.setEncoding('utf8');
    phantomjs.stdout.setEncoding('utf8');

    phantomjs.on('error',function(err){
        console.error('phantomjs error: '+err);
        phantomjs.kill();
        if(browserTimeouter){
            clearTimeout(browserTimeouter);
            browserTimeouter = false;
        }
    });

    var feedback = '';
    phantomjs.stdout.on('data', function(data) {
        data = data.trim();
        if(feedback==''&&!data.startsWith('{')){
            phantomjs.kill();
            callback(new Error('crawling failure'), null);
        }else{
            feedback += data;
            if(data.endsWith('}#^_^#')){
                var emit_string = feedback.slice(0,-5);
                feedback = '';
                phantomjs.emit('feedback',emit_string);
            }
        }
    });

    phantomjs.on('feedback', function(data) {
        try{
            var feedback = JSON.parse(data);//data.toString('utf8')
        }catch(e){
            phantomjs.kill();
            return;
        }
        switch(feedback['signal']){
            case CMD_SIGNAL_CRAWL_SUCCESS:
                phantomjs.kill();
                callback(null, feedback['content']);
                break;
            case CMD_SIGNAL_CRAWL_FAIL:
                phantomjs.kill();
                callback(new Error('crawling failure'), null);
                break;
            case CMD_SIGNAL_NAVIGATE_EXCEPTION:
                phantomjs.kill();
                callback(new Error('nevigate failure'), null);
                break;
            default:
                phantomjs.kill();
                callback(new Error('crawling failure'), null);
        }
        if(browserTimeouter){
            clearTimeout(browserTimeouter);
            browserTimeouter = false;
        }
    });

    browserTimeouter = setTimeout(function(){
        if(phantomjs){
            phantomjs.kill();
            phantomjs=null;
            callback(new Error('crawling failure'), null);
        }
    },300*1000);

    phantomjs.stderr.on('data', function (data) {
        phantomjs.kill();
        if(browserTimeouter){
            clearTimeout(browserTimeouter);
            browserTimeouter = false;
        }
    });

    phantomjs.on('exit', function (code) {
        //if(code!=0)console.error('child process exited with code ' + code);
    });

    phantomjs.on('close', function (signal) {
        //if(signal!=0)console.error('child process closed with signal ' + signal);
    });

}

if(module.parent){
    exports.request = request;
    exports.browse = browseIt;
    exports.get = function(url,charset,callback){
        request(url,null,charset,null,null,60,false,(err,status_code,content,page_encoding,header,param)=>{
            logger.debug('got html from '+url+', err: '+err+', status_code: '+status_code+', content length: '+(content?content.length:0));
            callback(err,content);
        });
    }
}else{
    // request('http://www.pbc.gov.cn/zhengcehuobisi/125207/125213/125431/index.html',null,'utf-8',null,null,300,false,(err,status_code,content,page_encoding,header,param)=>{
    //         var gererated;
    //         var cookies = [];
    //         var reg = new RegExp('eval\((.*)\)','ig');
    //         var m = reg.exec(content);
    //         if(m){
    //             var jsstr = m[1];
    //             jsstr = jsstr.replace('return p','gererated = p');
    //             eval(jsstr);
    //             gererated = gererated.replace(/function findDimensions.*?function/ig,'function findDimensions(){return false;} function');
    //             gererated = gererated.replace(/document.cookie = cookieString;/ig,'cookies.push(cookieString);');
    //             gererated = gererated.replace(/window\.[^;]*;/ig,'');
    //             eval(gererated);
    //             console.log(cookies);
    //         }
    // });
    browseIt('http://www.gov.cn/xinwen/yaowen.htm',(err, content)=>{
        console.log(content);
    });
}

