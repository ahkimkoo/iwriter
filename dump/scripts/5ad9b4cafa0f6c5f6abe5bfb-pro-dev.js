const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ad9b4cafa0f6c5f6abe5bfb';
const PROFILE = 'pro';
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
        if(hq_str_sh000001.indexOf(YEAR+'-'+MONTH+'-'+DATE)>=0 && now.getHours() == 11 && now.getMinutes()>=20){
                result = '【A股午间收盘数据】';
                
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
                let mq_message = `☑A股午间收盘数据（${dateFormat(_now,'M月d日 hh:mm')}）\n\n${result}`; 
                if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
        }
    }
}

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