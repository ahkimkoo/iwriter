const crawler = require('../../processer/crawler.js');
const RULE_ID = '5aea817e6135ff3e93b58d8a';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getBrowserDocument('http://quote.eastmoney.com/centerv2/qqzs','涨跌额');

const trans_sytax = function(str){
    if(str == '0%')return '涨跌持平';
    else return (str.startsWith('-') ? '跌' : '涨') + str.replace('-','');
}

if(doc){
    let friday = lookForPreviousNDay(5);
    let pre_friday = lookForPreviousNDay(5,1);
    
    let arr = table2array(doc, '#qqzs_eu_simple');
    let yfs = arr.filter(x=>{return x[0]=='●英国富时100'})[0];
    let dax = arr.filter(x=>{return x[0]=='●德国DAX30'})[0];
    let cac = arr.filter(x=>{return x[0]=='●法国CAC40'})[0];
    
    let yfs_v = parseFloat(yfs[1]).toFixed(2);
    let dax_v = parseFloat(dax[1]).toFixed(2);
    let cac_v = parseFloat(cac[1]).toFixed(2);
    
    let pre_values = await getValuesByVersion(RULE, dateFormat(pre_friday,'yyyyMMdd'));
    
    let yfs_change = '（无上周数据）';
    if(pre_values && pre_values['yfs']){
        yfs_change = quoteChangeSyntax(pre_values['yfs'], yfs_v);
    }
    
    let dax_change = '（无上周数据）';
    if(pre_values && pre_values['dax']){
        dax_change = quoteChangeSyntax(pre_values['dax'], dax_v);
    }
    
    let cac_change = '（无上周数据）';
    if(pre_values && pre_values['cac']){
        cac_change = quoteChangeSyntax(pre_values['cac'], cac_v);
    }
    
    return {
       '$version':dateFormat(friday,'yyyyMMdd'),
       'yfs' : yfs_v,
       'dax' : dax_v,
       'cac' : cac_v,
       'message':`上周五，英国富时100指数${trans_sytax(yfs[3])}，至${yfs_v}点，周${yfs_change}；德国DAX30指数${trans_sytax(dax[3])}，至${dax_v}点，周${dax_change}；法国CAC40指数${trans_sytax(cac[3])}，至${cac_v}点，周${cac_change}。`
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