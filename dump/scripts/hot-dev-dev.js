const crawler = require('../../processer/crawler.js');
const RULE_ID = 'hot';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getDocument('http://top.baidu.com/buzz?b=1&fr=tph_right',{'encoding':'gbk'});

let result = null;

if(doc){
    let hotnews = [];
    let hotnews_show = [];
    doc('.list-title').each((i,ele)=>{
        hotnews[i] = doc(ele).text();
        hotnews_show[i] = doc.html(ele);
    });
    
    lastvalues = await getLastValues(RULE);
    
    let isnew = true;
    
    if(lastvalues && lastvalues.hasOwnProperty('hotnews')){
        let po = lastvalues['hotnews'].indexOf(hotnews[0]);
        if(po >= 0 && po < 3)isnew = false;
    }
    
    if(isnew && hotnews.length>0){
        result = {};
        result['hotnews'] = hotnews;
        
        let xhtml = [];
        let xtext = [];
        doc('.shixiaoxinwen').each((i,ele)=>{
            xhtml[i] = doc(ele).html();
            xtext[i] = `【${doc(ele).find('.info-title').text().trim()}】\n${doc(ele).find('.info-text').text().trim()}`;
        });
        
        result['show'] = xhtml.join(''); 
        
        let now = new Date();
        
        let sub_hotnews = hotnews.slice(0,10).map((x,i)=>{return (i+1)+'、'+x});
        let mq_message = `☑百度热搜（${dateFormat(now,'M月d日 hh:mm')}）\n\n${xtext.join('\n\n')}\n\n${sub_hotnews.join('\n')}\n\n详见：http://t.cn/R1RFysM`; 
        await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'热点追击','message':mq_message});
        
        /*
        let mail_html = '<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>实时热点</title></head><body>' 
        + result['show'] + '<div><ol><li>'
        + hotnews_show.join('</li><li>')+'</li></ol></div>'
        + '</body></html>';

        await sendMail(['"Cherokee" <lcg@feheadline.com>','"李柯兵" <lkb@feheadline.com>'], '最新热点报告（'+dateFormat(now,'M月d日 hh:mm')+'）', null, mail_html, {
        'host': 'smtp.exmail.qq.com',
        'port': 465,
        'secure': true,
        'auth': {
            'user': 'support@feheadline.com',
            'pass': '123456s'
        }}, '"聚合写作" <support@feheadline.com>');
        */
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