const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae2d396450137382befdd57';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let xsbjson = await getJson(
    'http://www.neeq.com.cn/marketStatController/weeklyReport.do?callback=kk', 
    {
        'jsonp':'kk',
        'form':{'weekDate':''},
        'headers':{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36'}
    }
    );

if(xsbjson){
    let hit = xsbjson[0]['listWeekly'].filter(x=>{return x['tjx'] =='GPGSJS'})[0];
    let company_inc_count = hit['bzlj'];
    let company_inc_count_sytax = pnSyntax(company_inc_count,'新增','减少') + Math.abs(company_inc_count);
    let fdate = hit['ksrq'];
    let edate = hit['jsrq'];
    
    let fdate_sytax = parseInt(fdate.slice(4,6))+'.'+parseInt(fdate.slice(6,8));
    let edate_sytax = parseInt(edate.slice(4,6))+'.'+parseInt(edate.slice(6,8));
    
    let trade_amount_node = xsbjson[0]['listWeekly'].filter(x=>{return x['tjx'] =='CJJE'})[0];
    let trade_amount = (trade_amount_node['bzlj']/100000000).toFixed(2);
    let trade_amount_change = trade_amount_node['bszzj'];
    let trade_amount_change_sytax = pnSyntax(trade_amount_change,'增加','减少') + percentSyntax(Math.abs(trade_amount_change),2);
    
    let lastValues = await getLastValues(RULE);
    
    let last_company_inc_count_sytax = '(无数据)';
    if(lastValues['company_inc_count']){
        last_company_inc_count_sytax = pnSyntax(lastValues['company_inc_count'],'增加','减少') + Math.abs(lastValues['company_inc_count']);
    }
    
    let xsb_day_json = await getJson(
    'http://www.neeq.com.cn/marketStatController/dailyReport.do?callback=kk', 
    {
        'jsonp':'kk',
        'form':{'HQJSRQ':''},
        'headers':{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36'}
    }
    );
    
    let company_count;
    if(xsb_day_json){
        company_count = xsb_day_json[1]['gpgsjs'] + xsb_day_json[2]['gpgsjs'];
    }
    
    return {
        '$version':`${fdate_sytax}-${edate_sytax}`,
        'company_inc_count':company_inc_count,
        'message':`新三板：上周（${fdate_sytax}－${edate_sytax}），${company_inc_count_sytax}家挂牌公司，前一周${last_company_inc_count_sytax}家；成交金额${trade_amount}亿，环比${trade_amount_change_sytax}。截至目前，新三板挂牌公司总数达${company_count}家。`
        
    };
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