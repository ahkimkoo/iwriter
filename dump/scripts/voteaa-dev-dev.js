const crawler = require('../../processer/crawler.js');
const RULE_ID = 'voteaa';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		/**
 * id是投票的id 
 */
const vote = async (id=346)=>{
    let url = 'https://www.niaogebiji.com/wap/mims/votedetail/?id='+id;
    return await getChromeDocument(url, '#qrtp', {
    'nocookie':true,
    'evaluate' : _=>{
            function ajaxEventTrigger(event) {
                var ajaxEvent = new CustomEvent(event, {
                    detail: this
                });
                window.dispatchEvent(ajaxEvent);
            }
            
            var oldXHR = window.XMLHttpRequest;
            
            function newXHR() {
                var realXHR = new oldXHR();
            
                realXHR.addEventListener('abort', function() {
                    ajaxEventTrigger.call(this, 'ajaxAbort');
                }, false);
            
                realXHR.addEventListener('error', function() {
                    ajaxEventTrigger.call(this, 'ajaxError');
                }, false);
            
                realXHR.addEventListener('load', function() {
                    ajaxEventTrigger.call(this, 'ajaxLoad');
                }, false);
            
                realXHR.addEventListener('loadstart', function() {
                    ajaxEventTrigger.call(this, 'ajaxLoadStart');
                }, false);
            
                realXHR.addEventListener('progress', function() {
                    ajaxEventTrigger.call(this, 'ajaxProgress');
                }, false);
            
                realXHR.addEventListener('timeout', function() {
                    ajaxEventTrigger.call(this, 'ajaxTimeout');
                }, false);
            
                realXHR.addEventListener('loadend', function() {
                    ajaxEventTrigger.call(this, 'ajaxLoadEnd');
                }, false);
            
                realXHR.addEventListener('readystatechange', function() {
                    ajaxEventTrigger.call(this, 'ajaxReadyStateChange');
                }, false);
            
                return realXHR;
            }
            window.XMLHttpRequest = newXHR;
        
        let name = document.querySelector('.title1').innerText;
        return new Promise(resolve=>{
            window.addEventListener('ajaxLoadEnd', function(e) {
            	if(e.detail.responseURL.indexOf('dovote/')>0){
            	    let count = document.querySelector('.title4>span').innerText;
            		let jsonResult = JSON.parse(e.detail.responseText);
        		    resolve({
        		        'name': name,
        		        'count': count,
        		        'message': jsonResult['return_msg']
        		    });
            	}
            });
            document.getElementById('qrtp').click();
        });
    }
  });
}

return vote;
/*embed script end*/
	}
}

(async ()=>{
	let result = await evalFuc();
	if(typeof result == 'function'){
		console.log(RULE_ID+' is Function');
	}else{
		if(typeof result != 'object')result = {'message':result};
		console.log('crawled '+RULE_ID+', result: '+result['message']);
		let version = result['$version'] || (await crawler.autoVersion(RULE_ID));
		let isnew = await crawler.data2mongo(RULE_ID, version, Object.assign({},result));
		await crawler.updateScheduleStatus(RULE_ID, -1);
		if(isnew)console.log('crawl new data for '+RULE_ID);
		else console.log('update crawled data for '+RULE_ID);
	}
	process.exit(0);
})();