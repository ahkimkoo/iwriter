const crawler = require('../../processer/crawler.js');
const RULE_ID = '2vJP7D';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getBrowserDocument('https://top.taobao.com/index.php?spm=a1z5i.1.7.11.Wcdbqz&rank=focus&type=up','关注指数');

let result = null;

if(doc){
    let hotnews = [];
    let hotnews_show = [];
    doc('.title').each((i,ele)=>{
        let v = doc(ele).text().trim();
        hotnews[i] = v;
        hotnews_show[i] = (i+1)+'、'+v;
    });
    
    lastvalues = await getLastValues(RULE);
    
    let isnew = true;
    
    if(lastvalues && lastvalues.hasOwnProperty('hotnews')){
        let po = lastvalues['hotnews'].indexOf(hotnews[0]);
        if(po >= 0 && po < 10)isnew = false;
    }

    if(isnew){
        result = {};
        result['hotnews'] = hotnews;
        result['message'] = hotnews_show.join('\n'); 
        
        let now = new Date();

        let mq_message = `☑淘宝热门搜索（${dateFormat(now,'M月d日 hh:mm')}）\n\n${hotnews_show.join('\n')}`; 
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