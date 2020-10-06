const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ad95737dee54b1248867574';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		$ = await getDocument('http://www.shibor.org/shibor/web/html/shibor.html')

let last_data = $('table tr:nth-child(2) table:nth-child(2) tr:nth-child(1)>td:nth-child(3)').text().trim();

let last_data_ratio = $('table tr:nth-child(2)  table:nth-child(2) tr:nth-child(1)>td:nth-child(5)').text().trim();

let last_data_sytax = $('table tr:nth-child(2) table:nth-child(2) tr:nth-child(1)>td:nth-child(4)>img').attr('src').endsWith('downicon.gif')?'下跌':'上涨';


let day7_data = $('table tr:nth-child(2) table:nth-child(2) tr:nth-child(2)>td:nth-child(3)').text().trim();

let day7_data_ratio = $('table tr:nth-child(2)  table:nth-child(2) tr:nth-child(2)>td:nth-child(5)').text().trim();

let day7_data_sytax = $('table tr:nth-child(2) table:nth-child(2) tr:nth-child(2)>td:nth-child(4)>img').attr('src').endsWith('downicon.gif')?'下跌':'上涨';


let month3_data = $('table tr:nth-child(2) table:nth-child(2) tr:nth-child(5)>td:nth-child(3)').text().trim();

let month3_data_ratio = $('table tr:nth-child(2)  table:nth-child(2) tr:nth-child(5)>td:nth-child(5)').text().trim();

let month3_data_sytax = $('table tr:nth-child(2) table:nth-child(2) tr:nth-child(5)>td:nth-child(4)>img').attr('src').endsWith('downicon.gif')?'下跌':'上涨';

let message = `隔夜shibor报${last_data}%，${last_data_sytax}${last_data_ratio}个基点。7天shibor报${day7_data}%，${day7_data_sytax}${day7_data_ratio}个基点。3个月shibor报${month3_data}%，${month3_data_sytax}${month3_data_ratio}个基点。`;


let now = new Date();
let mq_message = `☑shibor利率（${dateFormat(now,'M月d日 hh:mm')}）\n\n【shibor利率播报】\n${message}`; 
if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});

return message;
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