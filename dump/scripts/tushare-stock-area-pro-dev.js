const crawler = require('../../processer/crawler.js');
const RULE_ID = 'tushare-stock-area';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		
const getLatestStockList = async()=>{
    let doc = await getJson('http://api.waditu.com', {
        'method':'POST',
        'json':true,
        'headers':{
          'Content-Type':'application/json'
        },
        'body':{
                'api_name':'stock_basic',
                'token':'73423acd107582463fa952842b3bfa147373056800fb5381265d764f',
            	'params':{'list_status':'L'},
                'fields':'symbol,name,area'
            }
    });
    return doc;
}



return (await getLatestStockList());
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