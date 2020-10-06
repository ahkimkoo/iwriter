const crawler = require('../../processer/crawler.js');
const RULE_ID = 'c7dzL';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const url = 'http://www.pbc.gov.cn/zhengcehuobisi/125207/125213/125431/125475/index.html'
let list = await getChromeDocument(url)    
if(list){
    const $ = cheerio.load(list)
    const href = 'http://www.pbc.gov.cn'+ $('table table table table tr td a').first().attr('href')
    const result = {}
    let pic = await snapshotByElement(href,'body','body',[400,300,-600,-500],'url')
    if(pic){
        result['show'] = '<img src="' + pic + '" />'
        return result['show']
    }else return null

}else{
    return null
}
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