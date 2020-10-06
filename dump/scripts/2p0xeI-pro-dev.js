const crawler = require('../../processer/crawler.js');
const RULE_ID = '2p0xeI';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getDocument('https://s.weibo.com/top/summary?cate=realtimehot','<i class="icon-txt icon-txt-new">新</i>');
if(doc){
    let topics = [];
    let topics_show = [];
    doc('table>tbody>tr').each((i,ele)=>{
        let lk = doc(ele).find('a');
        let ic = doc(ele).find('i');
        if(ic && ic.text().trim() =='新'){
            topics[i] = lk.text().replace(/#(.*)#/g,'$1').trim();
            let ads = lk.attr('href');
            lk.attr('href', 'https://s.weibo.com' + ads);
            topics_show[i] = '<li>'+doc.html(lk)+'</li>';
        }else {
            topics[i] = null;
            topics_show[i] = null;
        }
    });
    topics = topics.filter(x=>{return x!==null;});
    topics_show = topics_show.filter(x=>{return x!==null;});
    
    let lastvalues = await getLastValues(RULE);
    let new_topics_index = [];
    let new_topics = [];
    let new_topic_show = [];
    if(lastvalues && lastvalues['topics']){
        for(let i=0; i<topics.length; i++){
            let topic = topics[i];
            if(lastvalues['topics'].indexOf(topic)<0){
                new_topics.push(topics[i]);
                new_topic_show.push(topics_show[i]);
            }
        }
    }else{
        new_topics = topics;
        new_topic_show = topics_show;
    }
    
    if(new_topics.length>0){
        let now = new Date();
        let fmt_topics = new_topics.map(x=>{return '➤'+x;});
        let mq_message = `☑微博热搜新话题（${dateFormat(now,'M月d日 hh:mm')}）\n\n${fmt_topics.join('\n')}\n\n详见：http://t.cn/R3DaGQC`; 
        await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'热点追击','message':mq_message});
        
        return {
            'show' : '<ol>'+new_topic_show.join('')+'</ol>',
            'topics' : topics
        };
    }else return null;
}else return null
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