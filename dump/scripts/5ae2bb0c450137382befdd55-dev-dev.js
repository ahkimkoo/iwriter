const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae2bb0c450137382befdd55';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let cont = await getDocument('http://fx168api.fx168.com/quote/handler/Datas.ashx',{'parse':false,'form':{'page':'fx168-rmb-ndf','vtype':'XHWH'}});

if(cont){
    let cont_array = cont.split(/\,#/).map(x=>{return x.split(',')});
    let m3 = cont_array.filter(x=>{return x[1]=='3个月'})[0][3];
    let m6 = cont_array.filter(x=>{return x[1]=='6个月'})[0][3];
    let y1 = cont_array.filter(x=>{return x[1]=='1年'})[0][3];
    let y2 = cont_array.filter(x=>{return x[1]=='2年'})[0][3];
    return `NDF：3个月报${m3}，6个月报${m6}，1年报${y1}，2年报${y2}。`;
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