const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae2f3dff4df240d1ced9f88';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getBrowserDocument('http://quote.eastmoney.com/centerv2/qqzs/mzgs','道琼斯');

const trans_sytax = function(str){
    if(/^[%\.0]+$/.test(str))return '涨跌持平';
    else return (str.startsWith('-') ? '跌' : '涨') + str.replace('-','');
}

if(doc){
    let friday = lookForPreviousNDay(5);
    let pre_friday = lookForPreviousNDay(5,1);
    
    let arr = table2array(doc, 'table');
    let dqs = arr.filter(x=>{return x[1]=='●道琼斯'})[0];
    let bp = arr.filter(x=>{return x[1]=='●标普500'})[0];
    let nsdk = arr.filter(x=>{return x[1]=='●纳斯达克'})[0];
    
    let dqs_v = parseFloat(dqs[2]).toFixed(2);
    let bp_v = parseFloat(bp[2]).toFixed(2);
    let nsdk_v = parseFloat(nsdk[2]).toFixed(2);
    
    let pre_values = await getValuesByVersion(RULE, dateFormat(pre_friday,'yyyyMMdd'));
    
    let dqs_change = '（无上周数据）';
    if(pre_values && pre_values['dqs']){
        dqs_change = quoteChangeSyntax(pre_values['dqs'], dqs_v);
    }
    
    let bp_change = '（无上周数据）';
    if(pre_values && pre_values['bp']){
        bp_change = quoteChangeSyntax(pre_values['bp'], bp_v);
    }
    
    let nsdk_change = '（无上周数据）';
    if(pre_values && pre_values['nsdk']){
        nsdk_change = quoteChangeSyntax(pre_values['nsdk'], nsdk_v);
    }
    
    return {
       '$version':dateFormat(friday,'yyyyMMdd'),
       'dqs' : dqs_v,
       'bp' : bp_v,
       'nsdk' : nsdk_v,
       'message':`上周五，道琼斯${trans_sytax(dqs[4])}，至${dqs_v}点，周${dqs_change}。标普500指数${trans_sytax(bp[4])}，至${bp_v}点，周${bp_change}；纳斯达克${trans_sytax(nsdk[4])}，至${nsdk_v}点，周${nsdk_change}。`
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