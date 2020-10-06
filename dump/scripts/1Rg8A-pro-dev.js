const crawler = require('../../processer/crawler.js');
const RULE_ID = '1Rg8A';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		var message='';

let wti_doc = await getDocument('https://wallstreetcn.com/markets/USCL.OTC',{
    'headers': {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36'
     },
     'gzip':true
  }
  );

if(wti_doc){
  let price_txt = wti_doc('.price-lastpx').text().replace(/\s+/g,'');
  let change_price_txt = wti_doc('.price-precision').text().replace(/\s+/g,'');
  let change_rate_txt = wti_doc('.price-rate').text().replace(/[\(\)]+/g,'').replace(/\s+/g,'');
  
  let change_price_prefix = pnSyntax(parseFloat(change_price_txt),'涨','跌');
  let change_rate_prefix = pnSyntax(parseFloat(change_rate_txt),'涨','跌');
  
  let price_fmt_txt = price_txt.replace(/\,/g,'');
  let change_price_fmt_txt = change_price_txt.replace(/[\+\-]/,'');
  let change_rate_fmt_txt = change_rate_txt.replace(/[\+\-]/,'');
  
  let month_text = (new Date().getMonth() + 1) % 13 + 1;
   
  message += `WTI ${month_text}月原油期货收${change_price_prefix}${change_price_fmt_txt}美元，${change_rate_prefix}幅${change_rate_fmt_txt}，报${price_fmt_txt}美元/桶。`;
}

let uko_doc = await getDocument('https://wallstreetcn.com/markets/UKOIL.OTC',{
    'headers': {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36'
     },
     'gzip':true
  }
  );

if(uko_doc){
  let price_txt = uko_doc('.price-lastpx').text().replace(/\s+/g,'');
  let change_price_txt = uko_doc('.price-precision').text().replace(/\s+/g,'');
  let change_rate_txt = uko_doc('.price-rate').text().replace(/[\(\)]+/g,'').replace(/\s+/g,'');
  
  let change_price_prefix = pnSyntax(parseFloat(change_price_txt),'涨','跌');
  let change_rate_prefix = pnSyntax(parseFloat(change_rate_txt),'涨','跌');
  
  let price_fmt_txt = price_txt.replace(/\,/g,'');
  let change_price_fmt_txt = change_price_txt.replace(/[\+\-]/,'');
  let change_rate_fmt_txt = change_rate_txt.replace(/[\+\-]/,'');
  
  let month_text = (new Date().getMonth() + 2) % 13 + 1;
   
  message += `布伦特${month_text}月原油期货收${change_price_prefix}${change_price_fmt_txt}美元，${change_rate_prefix}幅${change_rate_fmt_txt}，报${price_fmt_txt}美元/桶。`;
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