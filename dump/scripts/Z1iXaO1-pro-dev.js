const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z1iXaO1';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const replaceAsync = (str, re, replacer) => {
  return Promise.resolve().then(() => {
    const fns = []
    str.replace(re, (m, ...args) => {
      fns.push(replacer(m, ...args))
      return m
    })
    return Promise.all(fns).then(replacements => {
      return str.replace(re, () => replacements.shift())
    })
  })
}

const getArticleLinks = (source_links)=>{
    return new Promise(resolve=>{
        Async.map(source_links, (slink, cbot)=>{
            let doc = getJson(slink,{'encoding':'gbk'}).then(doc=>{
                if(doc){
                    let origin_links = doc[0]['Article'];
                    Async.mapLimit(origin_links, (50/source_links.length)||1, (alink, cbir)=>{
                        let ukey = crypto.createHash('md5').update('autohome#news#'+alink['Id']).digest('hex');
                        procedure('feheadline-check-article-exists', {'key':ukey}).then(bol=>{
                            if(bol)cbir(null, {'valid':0});
                            else cbir(null, {
                                'ukey' : ukey,
                                'url'  : `https://m.autohome.com.cn/news/${alink['PublishTime']}/${alink['Id']}.html`,
                                'source_id' : 846,
                                'channel_id' : 100001,
                                'title' : alink['Title'],
                                'origin' : '汽车之家',
                                'thumbnail' : alink['Img'],
                                'summary' : alink['Summary'],
                                'valid' : 1,
                                'artificial' : 0,
                                'score' : 1,
                                'genre' : 1,
                                'hotflag' : 0
                            });
                        });
                    }, (err, rets) => {
                        cbot(null, rets.filter(l=>{return l['valid']==1;}));
                    });
                }else return cbot([]);
            });
        },(err, results) => {
            let final_links = [];
            for(let result of results)final_links = final_links.concat(result);
            resolve(final_links);
        });
    });
}

const getArticles = (links) =>{
    return new Promise(resolve=>{
        Async.mapLimit(links, 10, (link, callback)=>{
            getDocument(link['url']).then(doc=>{
               if(doc){
                   let datestr = doc('.date').eq(0).text();
                   if(datestr)link['pub_time'] = datestr;
                   let author = doc('.name>a').eq(0).text();
                   if(author && author!=undefined && author!='undefined')link['author'] = author;
                   else link['author'] = '';
                   link['create_time'] = dateFormat(new Date(),'yyyy-MM-dd hh:mm:sss');
                   let content = doc('.details').eq(0).html();
                   if(content){
                       content = content.replace(/\'/g,'‘').replace(/(\"\/\/)/g,'"https://');
                       //replace(/(src="[^"]+)" data-src="([^"]+)"/g,'src="$2"');
                       replaceAsync(content, /(src="[^"]+)" data-src="([^"]+)"/g, (_,p1,p2)=>{
                           return procedure('qn-fetch-img',{'url':p2}).then(imglink=>{
                                return 'src="'+imglink+'"';
                           });
                       }).then(c=>{
                           link['content'] = c;
                           callback(null,link);
                       });
                   }else {
                       link['content'] = '无法获取内容';
                       callback(null,link);
                   }
               }else{
                   link['valid'] = 0;
                   callback(null,link);
               } 
            });
        },(err, results)=>{
            resolve(results.filter(l=>{return l['valid']}));
        });
    });
}


let candidates = ['https://www.autohome.com.cn/ashx/channel/AjaxChannelArtList.ashx?20&page=1&ExcptArtIds=929693,929680,929604&class2Id=7','https://www.autohome.com.cn/ashx/channel/AjaxChannelArtList.ashx?20&page=1&ExcptArtIds=929693,929680,929604&class2Id=10','https://www.autohome.com.cn/ashx/channel/AjaxChannelArtList.ashx?20&page=1&ExcptArtIds=929693,929680,929604&class2Id=40','https://www.autohome.com.cn/ashx/channel/AjaxChannelArtList.ashx?20&page=1&ExcptArtIds=929693,929680,929604&class2Id=150'];

let articleLinks = await getArticleLinks(candidates);
let articles = await getArticles(articleLinks);
let saved_articles = await procedure('feheadline-articles-to-mysql',{'articles':articles});
let printed_valid_articles = saved_articles['articles'].map(a=>{
                return `<li>${a['title']}   <a href="http://webapp.feheadline.com/news/${a['news_id']}/0" target="_blank">查看</a>   <a href="${a['url']}" target="_blank">原文</a></li>`
            });

return {
    'article_count': articleLinks.length,
    'err_count': saved_articles['err_count'],
    'err_msg': saved_articles['err_msg'],
    'show' : '<ul>'+printed_valid_articles.join('')+'</ul>'
};
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