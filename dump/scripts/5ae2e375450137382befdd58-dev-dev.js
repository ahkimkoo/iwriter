const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae2e375450137382befdd58';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getDocument('http://www.china-see.com/index.do');

if(doc){
    let n = parseInt(doc('.DWrapCon .DWrapConR dl:nth-child(2)>dd').eq(0).text());
    let e = parseInt(doc('.DWrapCon .DWrapConR dl:nth-child(3)>dd').eq(0).text());
    let q = parseInt(doc('.DWrapCon .DWrapConR dl:nth-child(4)>dd').eq(0).text());
    let t = n + e + q;
    return {
        'n':n,
        'e':e,
        'q':q,
        't':t,
        'message':`上股交：挂牌企业总数${t}家，其中N板（科创板）${n}家，E板${e}家，Q板${q}家。`
    };
}else return null;
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