const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae2bf5e450137382befdd56';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getVersion = async () =>{
    let xsbjson = await getJson(
    'http://www.neeq.com.cn/marketStatController/dailyReport.do?callback=kk', 
    {
        'jsonp':'kk',
        'form':{'HQJSRQ':''},
        'headers':{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36'}
    }
    );

    if(xsbjson){
        let version = xsbjson[0]['rq'];
        let m = parseInt(xsbjson[0]['rq'].slice(4,6));
        let d = parseInt(xsbjson[0]['rq'].slice(6,8));
        return [version, m, d];
    }else return null;
}


let xsbdoc = await getBrowserDocument('http://www.neeq.com.cn/static/statisticdata.html','<td class="tc">成交股票只数</td>');
let version_data = await getVersion();
if(xsbdoc && version_data){
    let version = version_data[0];
    let m = version_data[1];
    let d = version_data[2];
    
    let dataarray = table2array(xsbdoc, 'table');
    
    let company_count = parseInt(dataarray[2][5]);
    let company_change = parseInt(dataarray[3][5]);
    let company_change_sytax = pnSyntax(company_change,'新增','减少') + Math.abs(company_change);
    let total_trade = (parseFloat(dataarray[7][5])/10000).toFixed(2);
    let trade_a = (parseFloat(dataarray[7][1])/10000).toFixed(2);
    let trade_b = (parseFloat(dataarray[7][2])/10000).toFixed(2);
    
    let message = `新三板：${m}月${d}日合计挂牌${company_count}家公司，当日${company_change_sytax}家，成交金额${total_trade}亿，其中做市转让${trade_a}亿，集合竞价${trade_b}亿。`;
    
    let sbczjson = await getJson(
    'http://www.neeq.com.cn/neeqController/getSBCZ.do?callback=kk', 
    {
        'jsonp':'kk',
        'headers':{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36'}
    }
    );
    
    if(sbczjson){
        let sbcz_lv = sbczjson[sbczjson.length-1];
        let sbcz_change = sbcz_lv['zdf'];
        let sbcz_change_sytax = pnSyntax(sbcz_change,'涨','跌') + Math.abs(sbcz_change);
        
        let sbcz_price = sbcz_lv['drzx'].toFixed(2);
        let sbcz_amount = (sbcz_lv['cjje']/100000000).toFixed(2);
        
        message += `三板成指报${sbcz_price}，${sbcz_change_sytax}%，成交额${sbcz_amount}亿。`;
    }
    
    let mq_message = `☑新三板（${dateFormat(new Date(),'M月d日 hh:mm')}）\n\n【新三板收盘数据】${message}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
    
    return {'$version':version,'message':message};
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