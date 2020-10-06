const crawler = require('../../processer/crawler.js');
const RULE_ID = 'mCOB';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		    const result = {};
    const urlBase = 'https://www.dramx.com/Price/#price1';
    const pic = await snapshotByElement(urlBase,'body','#price3 > table.price-table', [0,10,0,-12],'url');

    if (pic) {
        result['show'] = '<img src="' + pic + '" />'
    }

    return result;
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