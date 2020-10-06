const crawler = require('../../processer/crawler.js');
const RULE_ID = 'AwoyN';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const trans_sytax = function(str){
    if(str == '0%')return '涨跌持平';
    else return (str.startsWith('-') ? '跌' : '涨') + str.replace('-','');
}

let nikeidoc = await getDocument('https://indexes.nikkei.co.jp/en/nkave/');

if(nikeidoc){
    let message = '';
    let nikei_index = parseFloat(nikeidoc('#current_price_1').text().replace(',','')).toFixed(2);
    let nikei_change = nikeidoc('#diff').text().replace(/^.*\(([\%\.\d\-\+]+)\).*$/g,'$1').replace('+','');
    let nikei_change_syntax = trans_sytax(nikei_change);
    message += `日经225指数${nikei_change_syntax}，报${nikei_index}点。`
    
    let mq_message = `☑日本股市收盘（${dateFormat(new Date(),'M月d日 hh:mm')}）\n\n${message}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
    return message;
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