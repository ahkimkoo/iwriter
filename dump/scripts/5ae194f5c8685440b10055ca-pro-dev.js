const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae194f5c8685440b10055ca';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let date,closeSpotPrice,closeSpotChange,usd_cny_price,usd_cny_price_change,message='';

let rmbjson = await getJson('http://www.chinamoney.com.cn/r/cms/www/chinamoney/data/fx/rfx-Dollar-close-rate.json');

if(rmbjson && rmbjson['data']){
    closeSpotPrice = parseFloat(rmbjson['data']['closeSpotPrice']).toFixed(4);
    date = rmbjson['data']['lastDate'];
    
    let lastValues = await getLastValues(RULE, date);
    
    closeSpotChange = lastValues.hasOwnProperty('close_spot_price') ? (closeSpotPrice/lastValues['close_spot_price'] - 1) : null;
    
    let closeSpotChangeSytax = closeSpotChange === null ? '涨跌（无昨日数据）' : (pnSyntax(closeSpotChange,'跌','涨') + percentSyntax(Math.abs(closeSpotChange),4));
    
    let ccprjson = await getJson('http://www.chinamoney.com.cn/r/cms/www/chinamoney/data/fx/ccpr.json');
    
    let usd_cny_info = ccprjson['records'].filter(x=>{return x['vrtEName']=='USD/CNY'})[0];
    
    usd_cny_price = parseFloat(usd_cny_info['price']).toFixed(4);
    
    usd_cny_price_change = lastValues.hasOwnProperty('usd_cny_price') ? (usd_cny_price/lastValues['usd_cny_price'] - 1) : null;
    
    let usd_cny_price_change_sytax = usd_cny_price_change === null ? '涨跌（无昨日数据）' : (pnSyntax(usd_cny_price_change,'跌','涨') + percentSyntax(Math.abs(usd_cny_price_change),4));
    
    message += `在岸人民币兑美元16:30收盘，报${closeSpotPrice}，${closeSpotChangeSytax}，人民币中间价报${usd_cny_price}，${usd_cny_price_change_sytax}。`;
}

if(date){
    let mq_message = `☑人民币兑美元即期收盘价（${dateFormat(new Date(),'M月d日 hh:mm')}）\n\n${message}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
    return {'message':message,'close_spot_price':closeSpotPrice,'close_spot_price_change':closeSpotChange,'usd_cny_price':usd_cny_price,'usd_cny_price_change':usd_cny_price_change,'$version':date}
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