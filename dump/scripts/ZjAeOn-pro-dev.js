const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZjAeOn';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getBrowserDocument('https://www.newrank.cn/public/info/list.html?period=day&type=data&category=cf','财经早餐');
if(doc){
    let version_v = doc('#date_current').text();
    let version = version_v.replace(/[^0-9]/g,'');
    let datas = table2array(doc,'#table_list');
    let row = datas.filter(x=>{return x[1].trim().startsWith('财经早餐')});
    if(row.length>0){
        row = row[0];
        
        let mq_message = `☑新榜排名数据（${version_v}）\n\n财经早餐总阅读数${row[3]}，头条阅读数${row[4]}，平均阅读数${row[5]}，总点赞数${row[7]}，财富类微信排行榜位居第${row[0]}。`; 
        await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'运维报告','message':mq_message});
        return {
            '$version' : version,
            'message' : `${version_v}，财经早餐总阅读数${row[3]}，头条阅读数${row[4]}，平均阅读数${row[5]}，总点赞数${row[7]}，财富类微信排行榜位居第${row[0]}。`
        };
    }else return null;
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