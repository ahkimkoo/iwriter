const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z21EeV2';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		var message='';

let dax_doc = await getDocument('https://m.cn.investing.com/indices/germany-30');
if(dax_doc){
  let price_txt = dax_doc('.lastInst').text().replace(/\s+/g,'');
  let change_txt = dax_doc('.parentheses').text().replace(/\s+/g,'');
  let change_prefix = pnSyntax(parseFloat(change_txt),'涨','跌');
  let price_fmt_txt = price_txt.replace(/\,/g,'');
  let change_fmt_txt = change_txt.replace(/[\+\-]/,'');
   
  message += `德国DAX 30指数收${change_prefix}${change_fmt_txt}，报${price_fmt_txt}点。`;
}

let cac_doc = await getDocument('https://m.hk.investing.com/indices/france-40',{
    'headers': {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36'
     }
  }
  );

if(cac_doc){
  let price_txt = cac_doc('.lastInst').text().replace(/\s+/g,'');
  let change_txt = cac_doc('.parentheses').text().replace(/\s+/g,'');
  let change_prefix = pnSyntax(parseFloat(change_txt),'涨','跌');
  let price_fmt_txt = price_txt.replace(/\,/g,'');
  let change_fmt_txt = change_txt.replace(/[\+\-]/,'');
   
  message += `法国CAC 指数收${change_prefix}${change_fmt_txt}，报${price_fmt_txt}点。`;
}

let uk_doc = await getDocument('https://www.investing.com/indices/uk-100',{
    'headers': {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36'
     }
   }
  );

if(uk_doc){
  let price_txt = uk_doc('.arial_26').text().replace(/\s+/g,'');
  let change_txt = uk_doc('.parentheses').eq(0).text().replace(/\s+/g,'');
  let change_prefix = pnSyntax(parseFloat(change_txt),'涨','跌');
  let price_fmt_txt = price_txt.replace(/\,/g,'');
  let change_fmt_txt = change_txt.replace(/[\+\-]/,'');
   
  message += `英国富时100指数收${change_prefix}${change_fmt_txt}，报${price_fmt_txt}点。`;
}

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