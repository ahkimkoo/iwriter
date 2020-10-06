const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ad9b592fa0f6c5f6abe5bfc';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let sse_data = await getJson('http://yunhq.sse.com.cn:32041/v1/sh1/list/self/000001_000016_000010_000009_000300?select=code%2Cname%2Clast%2Cchg_rate%2Camount%2Copen%2Cprev_close');
let now = new Date();
if(''+sse_data['date'] != YYMMDD || now.getHours() < 15)return null;
else{
    let result = '';
    
    let sh_market_price = sse_data['list'][0][2].toFixed(2);
    let sh_market_change_v = sse_data['list'][0][3];
    let sh_market_amount = sse_data['list'][0][4];
    let sh_market_amount_syntax = (sh_market_amount/100000000).toFixed(2);
    let sh_market_change_sytax = Math.abs(sh_market_change_v) > 0.01 ? pnSyntax(sh_market_change_v,'上涨','下跌') : '涨跌持平';
    let sh_market_change = Math.abs(sh_market_change_v);
    
    result += `上证指数报${sh_market_price}点，${sh_market_change_sytax}${sh_market_change}%，成交额${sh_market_amount_syntax}亿。`;
    
    let suffix = '';
    let szse_json = await getJson('http://www.szse.cn/api/market/ssjjhq/getTimeData?marketId=1&code=399001&random='+Math.random());
    
    if(szse_json){
        let sz_market_price = szse_json['data']['now'];
        let sz_market_change = parseFloat(szse_json['data']['deltaPercent']);
        let sz_market_change_sytax = sz_market_change < 0 ? '下跌':'上涨';
        let sz_market_amount = parseFloat(szse_json['data']['amount']);
        let sz_market_amount_syntax = (sz_market_amount/100000000).toFixed(2);
        result += `深证成指报${sz_market_price}点，${sz_market_change_sytax}${Math.abs(sz_market_change)}%，成交额${sz_market_amount_syntax}亿。`;
        let total = ((sh_market_amount + sz_market_amount)/100000000).toFixed(2);
        suffix = `两市合计成交${total}亿。`;
    }
    
    let szse_cy_json = await getJson('http://www.szse.cn/api/market/ssjjhq/getTimeData?marketId=1&code=399006&random='+Math.random())
    
    if(szse_cy_json){
        let szse_cy_market_price = szse_cy_json['data']['now'];
        let szse_cy_market_change = parseFloat(szse_cy_json['data']['deltaPercent']);
        let szse_cy_market_change_sytax = szse_cy_market_change < 0 ? '下跌':'上涨';
        let szse_cy_market_amount = parseFloat(szse_cy_json['data']['amount']);
        let szse_cy_market_amount_syntax = (szse_cy_market_amount/100000000).toFixed(2);
        result += `创业板指报${szse_cy_market_price}点，${szse_cy_market_change_sytax}${Math.abs(szse_cy_market_change)}%，成交额${szse_cy_market_amount_syntax}亿。`;
    }
    
    result += suffix;
    
    let _now = new Date();
    let mq_message = `☑A股收盘数据（${dateFormat(_now,'M月d日 hh:mm')}）\n\n【A股收盘数据】\n${result}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
     
    return result;
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