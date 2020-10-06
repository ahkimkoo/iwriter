const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZDUqEl';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let sse_json = await getJson(
    'http://query.sse.com.cn/marketdata/tradedata/queryMargin.do?isPagination=true&pageHelp.pageSize=2&pageHelp.pageNo=1&pageHelp.beginPage=1&pageHelp.cacheSize=1&pageHelp.endPage=2',
    {
     'headers':{
         'Referer' : 'http://www.sse.com.cn/market/othersdata/margin/sum/'
     }   
    }
    );

let result = null;

if(sse_json){
    let sse_pred_value = sse_json['result'][1]['rzye'];
    let sse_tod_value = sse_json['result'][0]['rzye'];
    
    let sse_tod_date_str = sse_json['result'][0]['opDate'];
    let sse_tod_month = parseInt(sse_tod_date_str.slice(4,6));
    let sse_tod_date = parseInt(sse_tod_date_str.slice(6,8));
    
    let sse_change = sse_tod_value - sse_pred_value;
    let sse_change_sytax = pnSyntax(sse_change,'增加','减少');
    let total = 0 + sse_tod_value;
    let total_pre = 0 + sse_pred_value;
    sse_tod_value = (sse_tod_value / 100000000 ).toFixed(2);
    sse_change = Math.abs(sse_change / 100000000 ).toFixed(2);
    
    
    let scse_pred_value, scse_tod_value;
    
    for(let i=0; i<15; i++){
        let d = new Date(new Date().getTime() - i * 86400000)
        let szse_doc = await getJson(
        'http://www.szse.cn/api/report/ShowReport/data?SHOWTYPE=JSON&CATALOGID=1837_xxpl&txtDate='+dateFormat(d,'yyyy-MM-dd')+'&random='+Math.random());
        if(szse_doc){
          if(szse_doc[0]['data'] && szse_doc[0]['data'].length>0){
              if(!scse_tod_value)scse_tod_value = parseFloat(szse_doc[0]['data'][0]['jrrzye'].replace(/\,/g,''))*100000000;
              else if(!scse_pred_value)scse_pred_value = parseFloat(szse_doc[0]['data'][0]['jrrzye'].replace(/\,/g,''))*100000000;
          }
        }
        if(scse_tod_value && scse_pred_value)break;
    }
    
    if(scse_tod_value && scse_pred_value){
        let scse_change = scse_tod_value - scse_pred_value;
        let scse_change_sytax = pnSyntax(scse_change,'增加','减少');
        
        total += scse_tod_value;
        total_pre += scse_pred_value;
        let total_change = total - total_pre;
        let total_change_sytax = pnSyntax(total_change,'增加','减少');
        
        
        scse_tod_value = (scse_tod_value / 100000000 ).toFixed(2);
        scse_change = Math.abs(scse_change / 100000000 ).toFixed(2);
        
        total = (total / 100000000 ).toFixed(2)
        total_change = Math.abs(total_change / 100000000 ).toFixed(2);
        
        result = {'$version':`${YEAR}-${sse_tod_month}-${sse_tod_date}`,'message':`两市融资余额：截至${sse_tod_month}月${sse_tod_date}日，上交所融资余额报${sse_tod_value}亿，较前一交易日${sse_change_sytax}${sse_change}亿；深交所融资余额报${scse_tod_value}亿，${scse_change_sytax}${scse_change}亿元；两市合计${total}亿元，${total_change_sytax}${total_change}亿元。`};
    }
}

let now = new Date();
let mq_message = `☑两市融资余额（${dateFormat(now,'M月d日 hh:mm')}）\n\n${result['message']}`; 
if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});

return result; 
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