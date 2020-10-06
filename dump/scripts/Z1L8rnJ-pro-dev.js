const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z1L8rnJ';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getDocument('http://www.gsdata.cn/rank/wxarc');

let result = null;

if(doc){
    
    let hotnews = [];
    let hotnews_show = [];
    doc('.al>span>a').each((i,ele)=>{
        hotnews[i] = doc(ele).text();
        hotnews_show[i] = doc.html(ele);
    });
    
    lastvalues = await getLastValues(RULE);
    
    let isnew = true;
    
    if(lastvalues && lastvalues.hasOwnProperty('hotnews')){
        let po = lastvalues['hotnews'].indexOf(hotnews[0]);
        if(po >= 0 && po < 8)isnew = false;
    }
    
    if(isnew && hotnews.length>0){
        result = {};
        result['hotnews'] = hotnews;
        
        result['show'] = '<div><ol><li>'+hotnews_show.join('</li><li>')+'</li></ol></div>'; 
        
        let now = new Date();
        
        let sub_hotnews = hotnews.slice(0,8).map((x,i)=>{return (i+1)+'、'+x});
        let mq_message = `☑微信热文（${dateFormat(now,'M月d日 hh:mm')}）\n\n${sub_hotnews.join('\n')}\n\n详见：http://t.cn/RBJfjFM`; 
        await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'热点追击','message':mq_message});
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