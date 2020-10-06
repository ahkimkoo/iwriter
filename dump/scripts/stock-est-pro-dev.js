const crawler = require('../../processer/crawler.js');
const RULE_ID = 'stock-est';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getStockIndex = async(stocks=[
            ['上证综合指数','sh000001'],
            ['深证综合指数','sz399106'],
            ['深证成份指数','sz399001'],
            ['恒生指数','r_HSI'],
            ['标普500指数','int_sp500']
        ]) => {
    var parseValue = (value) =>{
        let valuelist = value.split(',');
        let name = valuelist[0];
        
        let current_price, yesterday_price, current_amount, current_change, current_change_syntax;
        if(valuelist.length>10){
            current_price = parseFloat(valuelist[3]);
            yesterday_price = parseFloat(valuelist[2]);
            current_amount = parseFloat(valuelist[9])/100000000;
            current_change = quoteChangeSyntax(yesterday_price, current_price, positivesyntax='', negativesyntax='-', keeppoint=2);
            current_change_syntax = quoteChangeSyntax(yesterday_price, current_price, positivesyntax='上涨', negativesyntax='下跌', keeppoint=2);
        }else{
            current_price = parseFloat(valuelist[1]);
            change = parseFloat(valuelist[3]);
            current_amount = 0;
            current_change = change.toFixed(2) + '%';
            current_change_syntax = pnSyntax(change, '上涨', '下跌') + Math.abs(change.toFixed(2))+'%';
        }
        
        return {
           'name' : name,
           'price' : current_price,
           'amount' : current_amount,
           'change' : current_change,
           'change_syntax' : current_change_syntax,
           'description' : `${name}报${current_price.toFixed(2)}点，${current_change_syntax}，成交额${current_amount>0 ? current_amount.toFixed(2)+'亿' :'不详'}`
        }
    }
    
    let now = new Date();
    let result = null;
    let sina_doc = await getDocument('http://hq.sinajs.cn/?list='+stocks.map(x=>{return x[1]}).join(','),{'parse':false, 'encoding':'gbk'});
    if(sina_doc){
        let json_str = '{'+sina_doc.replace(/var hq_str_(.*)=(.*?);\n/mg,'"$1":$2,')+'"ok":true}';
        let json_obj = JSON.parse(json_str);
        delete json_obj['ok'];
        let r_obj = {};
        let r_array = [['指数','价格','成交量','涨跌','简述']];
        for(let k in json_obj){
            if(json_obj.hasOwnProperty(k)){
                let ov = parseValue(json_obj[k]);
                r_obj[ov['name']] = ov;
                r_array.push([ov['name'], ov['price'], ov['amount']||'不详', ov['change_syntax'], ov['description']]);
            }
        }
        result = Object.assign(r_obj, {'show':array2table(r_array,true)});
    }
    return result;
}

return await getStockIndex()
    
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