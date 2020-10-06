const crawler = require('../../processer/crawler.js');
const RULE_ID = 'p2pnews';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const clinks = [
        ['有利网','https://www.google.com/alerts/feeds/01483232072033565755/15586966268926216383'],
        ['黄金钱包','https://www.google.com/alerts/feeds/01483232072033565755/550534642694107873'],
        ['人人贷','https://www.google.com/alerts/feeds/01483232072033565755/13014220647266891739'],
        ['陆金所','https://www.google.com/alerts/feeds/01483232072033565755/7801456489555009104']
    ]
    
const getNews = async (link) =>{
    let xml = await getDocument(link[1], {'proxy':'http://172.17.0.1:8234','parse':false});
    if(xml){
        let doc = cheerio.load(xml,{'xmlMode':true, 'decodeEntities':true, 'withDomLvl1':false});
        let news = [];
        let nitms = doc('entry');
        let update_ele = doc('updated');
        let update_version = update_ele ? update_ele.eq(0).text(): '0';
        nitms.each((i,ele)=>{
            let title = getTextFromHtml(doc(ele).find('title').eq(0).text());
            let link = doc(ele).find('link').eq(0).attr('href');
            link = decodeURIComponent(link.substring(link.indexOf('url=')+4));
            link = link.substring(0, link.indexOf('&ct=ga'));
            news[i] = [title, link];
        });
        return [update_version, news];
    }else return null
}

const getAllNews = async() =>{
    let lastvalues = await getLastValues(RULE);
    let xhtml = [];
    let vret = {};
    
    for(let l of clinks){
        let fresh_news = [];
        let xtext = [];
        let shtml = [];
        let news = await getNews(l);
        if(news && news[1].length>0){
            let update_version = news[0];
            let last_news = [];
            let last_update_version = '0';
            if(lastvalues && lastvalues.hasOwnProperty(l[0])){
                last_update_version = lastvalues[l[0]]['update_version'];
                last_news = lastvalues[l[0]]['news'];
            }
            if(update_version!=last_update_version && new Date().getTime() - new Date(update_version).getTime() < 86400000*2){
                for(let n of news[1]){
                    if(last_news.indexOf(n[1])<=0){
                        fresh_news.push(n[1]);
                        shtml.push('<li><a href="'+n[1]+'" target="_blank">'+n[0]+'</a></li>');
                        xtext.push(n[0]);
                    }
                }
                if(xtext.length>0){
                    let mq_message = `☑${l[0]}：\n\n${xtext.slice(0,8).join('\n\n')}\n\n详见：http://dwz.cn/QyYKU69o`;
                    //await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'网贷资讯','message':mq_message});
                }
                if(fresh_news.length>0){
                    xhtml.push(`<h2>${l[0]}：</h2><ul>${shtml.join('')}</ul>`);
                    vret[l[0]] = {
                        'update_version' : update_version,
                        'news' : fresh_news
                    }
                }else{
                    vret[l[0]] = lastvalues[l[0]];
                }
            }else{
                vret[l[0]] = lastvalues[l[0]];
            }
                
        }
    }
    if(xhtml.length>0){
        return Object.assign(vret,{'show' : `${xhtml.join('')}`});
    }else return null
}

return await getAllNews();
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