const crawler = require('../../processer/crawler.js');
const RULE_ID = '8FMXa';
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
            let doc = getDocument(slink).then(doc=>{
                if(doc){
                    let articles = [];
                    let origin_links = doc('.single>.s-left');
                    
                    origin_links.each((i,itm)=>{
                        let ele = doc(itm);
                        let article = {
                            'source_id' : 846,
                            'channel_id' : 100001,
                            'origin' : '新浪汽车',
                            'artificial' : 0,
                            'score' : 1,
                            'genre' : 1,
                            'hotflag' : 0
                        };
                        let link_node = ele.find('h3>a');
                        if(link_node){
                            article['valid'] = 1;
                            article['url'] = link_node.eq(0).attr('href');
                            article['ukey'] = crypto.createHash('md5').update(article['url']).digest('hex');;
                            article['title'] = link_node.eq(0).text();
                            let img_node = ele.find('img.lazy');
                            if(img_node){
                                article['thumbnail'] = img_node.eq(0).attr('src');
                            }
                            let summary_node = ele.find('img.lazy');
                            if(summary_node){
                                article['summary'] = summary_node.eq(0).clone().children().remove().end().text();
                            }
                            articles.push(article);
                        }
                    });
                    
                    Async.mapLimit(articles, (50/articles.length)||1, (article, cbir)=>{
                        procedure('feheadline-check-article-exists', {'key':article['ukey']}).then(bol=>{
                            if(bol)article['valid'] = 0;
                            cbir(null, article);
                        });
                    }, (err, rets) => {
                        cbot(null, rets.filter(l=>{return l['valid']==1;}));
                    });
                }else return cbot([]);
            });
        },(err, results) => {
            let articles = [];
            for(let ret of results)articles = articles.concat(ret);
            resolve(articles);
        });
    });
}

const getArticles = (links) =>{
    return new Promise(resolve=>{
        Async.mapLimit(links, 10, (link, callback)=>{
            getDocument(link['url']).then(doc=>{
               if(doc){
                   let datestr = doc('.time-source').eq(0).clone().children().remove().end().text().replace(/.*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}).*/,'$1');
                   if(datestr)link['pub_time'] = datestr;
                   let author = doc('.time-source>a').eq(0).text();
                   if(author && author!=undefined && author!='undefined'){
                       link['author'] = author;
                       link['origin'] = author;
                   }else {
                       link['author'] = '';
                   }
                   link['create_time'] = dateFormat(new Date(),'yyyy-MM-dd hh:mm:sss');
                   let summary = doc('.quotation').eq(0).text();
                   doc('.adv-con').remove();
                   let content = doc('#articleContent').eq(0).html();
                   if(content){
                       /*
                       content = content.replace(/\'/g,'‘');
                       replaceAsync(content, /(src="[^"]+)"/g, (_,p1)=>{
                           return procedure('qn-fetch-img',{'url':p1}).then(imglink=>{
                                return 'src="'+imglink+'"';
                           });
                       }).then(c=>{
                           link['content'] = c;
                           callback(null,link);
                       });
                       */
                       link['content'] = content;
                       callback(null,link);
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


let candidates = ['http://auto.sina.com.cn/news/ct/'];

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