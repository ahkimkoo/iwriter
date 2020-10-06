const crawler = require('../../processer/crawler.js');
const RULE_ID = '5adfe60c0f134324a00b64a4';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getJson('http://www.chinamoney.com.cn/dqs/rest/dqs-u-fx-base/CcprHisNew')

if(doc){
    let version = doc['records'][0]['date'];
    let today_price = parseFloat(doc['records'][0]['values'][0]);
    
    let yestoday_price = parseFloat(doc['records'][1]['values'][0]);
    
    let change = today_price - yestoday_price;
    
    let change_sytax;
    
    if(change === 0){
        change_sytax = '相较于昨日不变';
    }else if(change>0){
        change_sytax = '下调' + Math.round(change*10000) +'点';
    }else {
        change_sytax = '上调' + Math.round(Math.abs(change*10000)) +'点';
    }
    
    let trans_today_price = today_price.toFixed(4);
    let trans_yestoday_price = yestoday_price.toFixed(4);
    
    let message = `【人民币中间价${change_sytax}】人民币兑美元中间价报${trans_today_price}，上一交易日中间价${trans_yestoday_price}。`;
    let now = new Date();
    let mq_message = `☑人民币中间价（${dateFormat(now,'M月d日 hh:mm')}）\n\n${message}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
 
    return {
        'message' : message,
        '$version' : version
    }
}else return null
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