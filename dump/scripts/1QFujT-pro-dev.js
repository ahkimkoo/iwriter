const crawler = require('../../processer/crawler.js');
const RULE_ID = '1QFujT';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let pic = await snapshotByElement('http://www.yiyiye.com/keyword?id=3968', '.layui-col-xs6:nth-child(2) .layui-table-box', '.layui-col-xs6:nth-child(2) .layui-table-box', [0, 0, 0, 0], 'url');
if(pic)return {'show':'<img src="'+pic+'" />'}
else return null;
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