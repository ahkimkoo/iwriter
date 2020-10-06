const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZVE3Dh';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const pushTempmsg = async ()=>{
    return new Promise(resolve=>{
        request.post({url:'https://fesapi.feheadline.com/provider/msg-api/v1/fes-send-tempmsg',json:{'project':'set_time'}},(err,res,body)=>{
            resolve(body);
        })
    })
}
return await pushTempmsg();
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