const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae295ee24dabe30ead6ce4c';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let friday1 = lookForPreviousNDay(5);
let friday2 = lookForPreviousNDay(5,1);

let version1 = dateFormat(friday1, 'yyyy-MM-dd');
let version2 = dateFormat(friday2, 'yyyy-MM-dd');

let values1 = await getValuesByVersion('5ae194f5c8685440b10055ca', version1);
let values2 = await getValuesByVersion('5ae194f5c8685440b10055ca', version2);

let close_spot_price1 = values1['close_spot_price'];
let close_spot_price_change1 = values1['close_spot_price_change'];
let close_spot_price2 = values2['close_spot_price'];
let usd_cny_price1 = values1['usd_cny_price'];
let usd_cny_price_change1 = values1['usd_cny_price_change'];
let usd_cny_price2 = values2['usd_cny_price'];

if(close_spot_price1 && usd_cny_price1){
    let close_spot_price_change = close_spot_price2 ? (close_spot_price1/close_spot_price2 - 1) : null;
    let close_spot_price_weekly_change_sytax = close_spot_price_change === null ? '涨跌（无上周数据）' : (pnSyntax(close_spot_price_change,'跌','涨') + percentSyntax(Math.abs(close_spot_price_change),4));
    let close_spot_price_change_sytax = close_spot_price_change1 === null ? '涨跌（无上一日数据）' : (pnSyntax(close_spot_price_change1,'跌','涨') + percentSyntax(Math.abs(close_spot_price_change1),4));
    
    let usd_cny_price_change = usd_cny_price2 ? (usd_cny_price1/usd_cny_price2 - 1) : null;
    let usd_cny_price_weekly_change_sytax = usd_cny_price_change === null ? '涨跌（无上周数据）' : (pnSyntax(usd_cny_price_change,'跌','涨') + percentSyntax(Math.abs(usd_cny_price_change),4));
    let usd_cny_price_change_sytax = usd_cny_price_change1 === null ? '涨跌（无上一日数据）' : (pnSyntax(usd_cny_price_change1,'跌','涨') + percentSyntax(Math.abs(usd_cny_price_change1),4));
    
    return {
        '$version' : dateFormat(friday1,'yyyyMMdd'),
        'message':`上周五，在岸人民币兑美元16:30收盘，报${close_spot_price1}，${close_spot_price_change_sytax}，周${close_spot_price_weekly_change_sytax}；人民币中间价报${usd_cny_price1}，${usd_cny_price_change_sytax}，周${usd_cny_price_weekly_change_sytax}。`
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