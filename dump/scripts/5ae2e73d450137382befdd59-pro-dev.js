const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae2e73d450137382befdd59';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let friday1 = lookForPreviousNDay(5);
let friday2 = lookForPreviousNDay(5,1);

let version1 = dateFormat(friday1, 'yyyy-MM-dd');
let version2 = dateFormat(friday2, 'yyyy-MM-dd');

let values1 = await getValuesByVersion('5ae2e375450137382befdd58', version1);
let values2 = await getValuesByVersion('5ae2e375450137382befdd58', version2);

if(values1 && values1['t']){
    let message = `上股交：挂牌企业总数${values1['t']}家，其中N板（科创板）${values1['n']}家，E板${values1['e']}家，Q板${values1['q']}家。`;
    if(values2 && values2['t']){
        let t_change = values1['t'] - values2['t'];
        if(t_change===0)message += '挂牌企业与前一周持平。'
        else message += '挂牌企业比前一周'+pnSyntax(t_change,'多','少')+Math.abs(t_change)+'家。';
    }
    return {
        'message' : message,
        '$version' : dateFormat(friday1,'yyyyMMdd')
    }
}else return  null;
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