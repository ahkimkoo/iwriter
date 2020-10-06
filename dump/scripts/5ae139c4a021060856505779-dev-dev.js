const crawler = require('../../processer/crawler.js');
const RULE_ID = '5ae139c4a021060856505779';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let message = '';
let date;

let hkex_html = await getDocument('http://sc.hkex.com.hk/TuniS/www.hkex.com.hk/?sc_lang=zh-cn', {'parse':false});

if(hkex_html){
    let token = hkex_html.replace(/^[\s\S]*LabCI.getToken[\s\S]*?return "(.{50,})";[\s\S]*$/img,'$1');
    if(token){
        let rn = new Date().getTime();
        let cf = 'cb'+rn;
        let hkex_market_data = await getJson('https://www1.hkex.com.hk/hkexwidget/data/getmarketoverview?lang=chn&token='+token+'&qid='+rn+'&callback='+cf,{'jsonp':cf});
        if(hkex_market_data){
            date = hkex_market_data['data']['indices'][0]['date'].split(/[^\d]+/).slice(0,-1).join('-');
            let hsq = hkex_market_data['data']['indices'].filter(x=>{return x['nm_s']=='恒生指数'});
            let gqq = hkex_market_data['data']['indices'].filter(x=>{return x['nm_s']=='恒生中国企业指数'});
            
            if(hsq.length>0){
                let hs = hsq[0];
                let hs_change = parseFloat(hs['pc']);
                let hs_price = hs['ls'].replace(/\,/g,'');
                let hs_change_sytax = pnSyntax(hs_change,'涨','跌') + Math.abs(hs_change);
                message += `恒生指数${hs_change_sytax}%，报${hs_price}点。`;
            }
            if(gqq.length>0){
                let gq = gqq[0];
                let gq_change = parseFloat(gq['pc']);
                let gq_price = gq['ls'].replace(/\,/g,'');
                let gq_change_sytax = pnSyntax(gq_change,'涨','跌') + Math.abs(gq_change);
                message += `国企指数${gq_change_sytax}%，报${gq_price}点。`;
            }
        }
    }
}

let hgt_doc = await getDocument('http://sc.hkex.com.hk/TuniS/www.hkex.com.hk/chi/csm/script/data_NBSH_QuotaUsage_chi.js?_='+new Date().getTime(),{'parse':false});
if(hgt_doc){
    hgt_doc = hgt_doc.replace(/[\r\n\t]+/g,'');
    try{
        eval(hgt_doc);
        if(northbound12){
            hgt_yes = northbound12[0]['section'][0]['item'][1][1];
            hgt_val = parseFloat(hgt_yes.replace(/RMB(.*) Mil/,'$1').replace(',',''));
            let hgt_amount = hgt_val / 100.0;
            let hgt_change = (520 - hgt_amount).toFixed(2);
            let hgt_change_sytax = pnSyntax(hgt_change,'入','出');
            message += `沪股通净流${hgt_change_sytax}${Math.abs(hgt_change)}亿元，当日余额${hgt_amount.toFixed(2)}亿元。`;
        }
    }catch(e){
       
    }
}

let sgt_doc = await getDocument('http://sc.hkex.com.hk/TuniS/www.hkex.com.hk/chi/csm/script/data_NBSZ_QuotaUsage_chi.js?_='+new Date().getTime(),{'parse':false});
if(sgt_doc){
    sgt_doc = sgt_doc.replace(/[\r\n\t]+/g,'');
    try{
        eval(sgt_doc);
        if(northbound22){
            sgt_yes = northbound22[0]['section'][0]['item'][1][1];
            sgt_val = parseFloat(sgt_yes.replace(/RMB(.*) Mil/,'$1').replace(',',''));
            let sgt_amount = sgt_val / 100.0;
            let sgt_change = (520 - sgt_amount).toFixed(2);
            let sgt_change_sytax = pnSyntax(sgt_change,'入','出');
            message += `深股通净流${sgt_change_sytax}${Math.abs(sgt_change)}亿元，当日余额${sgt_amount.toFixed(2)}亿元。`;
        }
    }catch(e){
        
    }
}

if(date){
    let mq_message = `☑港股收盘数据（${dateFormat(new Date(),'M月d日 hh:mm')}）\n\n【港股收盘数据】\n${message}`; 
    if(CALLER=='scheduler')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'快讯来了','message':mq_message});
    return {'message':message, '$version':date}
}return null;
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