const crawler = require('../../processer/crawler.js');
const RULE_ID = 'badurss';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const track_keywords = [
        {'keyword':'有利网', 'only_title':false},
        {'keyword':'黄金钱包', 'only_title':true},
        {'keyword':'人人贷', 'only_title':false},
        {'keyword':'P2P跑路', 'only_title':false},
        {'keyword':'陆金所', 'only_title':false}
    ]
    
const getNews = async (track, filter=3600000, warehouse={}) =>{
    if(typeof filter=='number'){
        filter = new Date(new Date().getTime() - filter);
    }
    let searchwords = encodeURIComponent((track['only_title'] ? 'title:' : '') + track['keyword']);
    let link = `http://news.baidu.com/ns?word=${searchwords}&tn=newsrss&sr=0&cl=2&rn=10&ct=0`;
    let xml = await getDocument(link, {'parse':false, 'encoding':'gbk', 'headers':{'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/68.0.3440.75 Chrome/68.0.3440.75 Safari/537.36'}});
    if(xml){
        let doc = cheerio.load(xml,{'xmlMode':true, 'decodeEntities':true, 'withDomLvl1':false});
        let news = [];
        let nitms = doc('rss>channel>item');
        nitms.each((i,ele)=>{
            let title = doc(ele).find('title').eq(0).text();
            let link = doc(ele).find('link').eq(0).text();
            let description = getTextFromHtml(doc(ele).find('description').eq(0).text());
            let pubdate = new Date(doc(ele).find('pubDate').eq(0).text());
            news[i] = {
                'title': title,
                'link': link,
                'description': description,
                'pubdate': pubdate
            };
        });
        news = news.filter(x=>{return x['pubdate'] > filter}).sort((a,b)=>{return b['pubdate'] - a['pubdate']});
        if(news && news.length>0){
            warehouse[track['keyword']] = {
                'update_version': news[0]['pubdate'],
                'news': news
            }
            return news;
        }else return null;
    }else return null
}


var warehouse = {}
var result = null;
var found_count = 0;

var lastvalues = await getLastValues(RULE);
for(let track of track_keywords){
    let last_update_version = new Date(new Date().getTime() - 3600*4*1000);
    if(lastvalues && lastvalues.hasOwnProperty(track['keyword'])){
        last_update_version = lastvalues[track['keyword']]['update_version'];
    }
    let news = await getNews(track, last_update_version, warehouse);
    if(news){
        found_count += news.length;
    }else{
        warehouse[track['keyword']] = {
            'update_version': last_update_version,
            'news': []
        }
    }
}

if(warehouse && found_count>0){
    result = {};
    let html = '';
    for(let section in warehouse){
        if(warehouse.hasOwnProperty(section)){
            if(warehouse[section]['news'].length>0){
                html += `<h2>${section}：</h2><ul>`;
                html += warehouse[section]['news'].map(x=>{return `<li><a href="${x['link']}" target="_blank">${x['title']}</a></li>`;}).join('');
                html += '</ul>';
                let mq_message = `☑${section}：\n\n${warehouse[section]['news'].slice(0,8).map(x=>{return x['title']}).join('\n\n')}\n\n详见：http://dwz.cn/14i8wH0u`;
                if(CALLER!='coder')await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'网贷资讯','message':mq_message});
            }
            result[section] = {'update_version':warehouse[section]['update_version']}
        }
    } 
    result['show'] = html;
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