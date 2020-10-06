const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae014a85f2291267e8d7d87';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let xgdoc = await getDocument('http://data.10jqka.com.cn/ipo/xgsgyzq/',{
    'encoding':'gbk'
});

let kzgjson = await getJson('http://data.10jqka.com.cn/ipo/kzz/');

let results;

if(xgdoc && kzgjson){
    let parsed_array = table2array(xgdoc,'#maintable');

    parsed_array = parsed_array.filter(itm=>{return itm[10] && itm[10].startsWith(MONTH+'-'+DATE)});
    
    results = '【今日可申购新股一览】'
    
    if(parsed_array.length < 1) results += '今日无新股申购。\n'
    else{
        results += '\n今日可申购新股为' + parsed_array.map(itm=>{return itm[1]}).join('、') + '。';
        results += '\n' + parsed_array.map(itm=>{return `${itm[1]}申购代码${itm[2]}，申购价格${itm[7]}元`}).join('；\n') + '。';
    }
    
    let fkzg = kzgjson['list'].filter(itm=>{return itm['sub_date'] == `${YEAR}-${MONTH}-${DATE}`});
    
    results += '\n【今日可申购可转债一览】'; 
    
    if(fkzg.length < 1) results += '今日无可转债申购。';
    else{
        results += '\n今日可申购可转债为' + fkzg.map(itm=>{return itm['bond_name']}).join('、') + '。';
        results += '\n' + fkzg.map(itm=>{return `${itm['bond_name']}申购代码${itm['sub_code']}`}).join('；\n') + '。';
    }
}

let now = new Date();
let mq_message = `☑新股、可转债（${dateFormat(now,'M月d日 hh:mm')}）\n\n${results}`; 
if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});

return results;
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