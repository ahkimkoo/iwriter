const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ad982677b99481e4814d3d4';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const parseValue = (value) =>{
    let valuelist = value.split(',');
    let name = valuelist[0];
    let current_price = parseFloat(valuelist[3]);
    let yesterday_price = parseFloat(valuelist[2]);
    let current_amount = parseFloat(valuelist[9])/100000000;
    let current_change_syntax = quoteChangeSyntax(yesterday_price, current_price, positivesyntax='上涨', negativesyntax='下跌', keeppoint=2);
    
    return {
       'name' : name,
       'current_price' : current_price,
       'current_amount' : current_amount,
       'current_change_syntax' : current_change_syntax,
       'description' : `${name}报${current_price.toFixed(2)}点，${current_change_syntax}，成交额${current_amount.toFixed(2)}亿`
    }
}


let now = new Date();
let result = null;
let sina_doc = await getDocument('http://hq.sinajs.cn/rn=7esck&list=sh000001,sz399001,sz399006,sz399102',{'parse':false, 'encoding':'gbk'});
if(sina_doc){
    eval(sina_doc);
    if(typeof hq_str_sh000001 == 'string'){
        if(hq_str_sh000001.indexOf(YEAR+'-'+MONTH+'-'+DATE)>=0 && now.getHours() == 9 && now.getMinutes()<40){
                result = '【A股开盘数据】';
                
                let sh_market = parseValue(hq_str_sh000001);
                result += `\n${sh_market['description']}；`;
                
                let sz_market = parseValue(hq_str_sz399001);
                result += `\n${sz_market['description']}；`;
                
                let sz_cy_market = parseValue(hq_str_sz399006);
                let sz_cy_zz_market = parseValue(hq_str_sz399102);
                result += `\n创业板指报${sz_cy_market['current_price'].toFixed(2)}点，${sz_cy_market['current_change_syntax']}，成交额${sz_cy_zz_market['current_amount'].toFixed(2)}亿；`;
                
                let total = (sh_market['current_amount'] + sz_market['current_amount']).toFixed(2);
                result += `\n两市合计成交${total}亿。`;
                
                let _now = new Date();
                let mq_message = `☑股开盘数据（${dateFormat(_now,'M月d日 hh:mm')}）\n\n${result}`; 
                if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
        }
    }
}

return result;


/*
let sse_data = await getJson('http://yunhq.sse.com.cn:32041/v1/sh1/list/self/000001_000016_000010_000009_000300?select=code%2Cname%2Clast%2Cchg_rate%2Camount%2Copen%2Cprev_close');
let now = new Date();
if(''+sse_data['date'] != YYMMDD || now.getHours() != 9 || now.getMinutes()>40)return null;
else{
    let result = '【A股开盘数据】\n';
    
    let sh_market_price = sse_data['list'][0][2].toFixed(2);
    let sh_market_change_v = sse_data['list'][0][3];
    let sh_market_amount = Math.round(sse_data['list'][0][4]/100000000);
    let sh_market_change_sytax = pnSyntax(sh_market_change_v,'上涨','下跌');
    let sh_market_change = Math.abs(sh_market_change_v);
    
    result += `上证指数开盘报${sh_market_price}点，${sh_market_change_sytax}${sh_market_change}%，成交${sh_market_amount}亿；`;
    
    let szse_doc = await getBrowserDocument('http://www.szse.cn/main/marketdata/hqcx/xshqlb/index.shtml?code=399001','昨收')
    
    if(szse_doc){
        let sz_market_price = szse_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(3)>td:nth-child(2)').text().trim();
        let sz_market_change = szse_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(5)>td:nth-child(2)').text().trim();
        let sz_change_sybol = szse_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(5)>td:nth-child(2)>img').attr('src');
        let sz_market_change_sytax = sz_change_sybol.endsWith('downar.gif')?'下跌':'上涨';
        let sz_market_amount = Math.round(parseFloat(szse_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(9)>td:nth-child(2)').text().trim())/10000);
        result += '\n' + `深证成指开盘报${sz_market_price}点，${sz_market_change_sytax}${sz_market_change}%，成交${sz_market_amount}亿；`;
    }
    
    let szse_cy_doc = await getBrowserDocument('http://www.szse.cn/main/marketdata/hqcx/xshqlb/index.shtml?code=399006','昨收')
    
    if(szse_cy_doc){
        let szse_cy_market_price = szse_cy_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(3)>td:nth-child(2)').text().trim();
        let szse_cy_market_change = szse_cy_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(5)>td:nth-child(2)').text().trim();
        let szse_cy_change_sybol = szse_cy_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(5)>td:nth-child(2)>img').attr('src');
        let szse_cy_market_change_sytax = szse_cy_change_sybol.endsWith('downar.gif')?'下跌':'上涨';
        let szse_cy_market_amount = Math.round(parseFloat(szse_cy_doc('#CONTENT_ID table[class="hqdataContainer"] tr:nth-child(9)>td:nth-child(2)').text().trim())/10000);
        result += '\n' + `创业板指开盘报${szse_cy_market_price}点，${szse_cy_market_change_sytax}${szse_cy_market_change}%，成交${szse_cy_market_amount}亿。`;
    }
    
    let mq_message = `☑A股开盘数据（${dateFormat(new Date(),'M月d日 hh:mm')}）\n\n${result}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
     
    return result;
}
*/
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