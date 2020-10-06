const crawler = require('../../processer/crawler.js');
const RULE_ID = 'feheadline-articles-to-mysql';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		/**
 * 将文章存放到财经头条mysql数据库
 * 参数articles是array类型，元素是object类型，包含字段：ukey, url, source_id, channel_id, title, origin, thumbnail, summary, valid, artificial, score, genre, hotflag
 * 返回articles是array类型表示存储成功的文章
 */
var err_count = 0;
var err_msg = '';
const putArticlesToDatabase = (articles = [])=>{
    let conn_conf = {
          'host'     : 'cms-mysql.feheadline.net',
          'user'     : 'news',
          'password' : 'pwd@news
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
})();,
          'database' : 'news_cfg'
        }
    return new Promise(resolve=>{
        Async.mapLimit(articles, 1, (article, callback)=>{
            let mysql_conn = mysql.createConnection(conn_conf);
            mysql_conn.connect();
            Async.series([
                    cb=>{
                       mysql_conn.beginTransaction(cb);
                    },
                    cb=>{
                        let sql = `insert into fe_avnews(article_id, source_id, channel_id, valid, pub_time, create_time, artificial)values(0,${article['source_id']},${article['channel_id']}, ${article['valid']}, '${article['pub_time']}', '${article['create_time']}', ${article['artificial']})`;
                        mysql_conn.query(sql, (error, results)=>{
                            if(error || !results || !results.insertId)cb(error||'insert error');
                            else{
                                article['news_id'] = results.insertId;
                                cb();
                            }
                        });
                    },
                    cb=>{
                        let sql = `insert into fe_articles(ukey, url, news_id, source_id, channel_id, title, origin, thumbnail, summary, valid, artificial, score, genre, hotflag, pub_time, author, content, create_time)values('${article['ukey']}', '${article['url']}', ${article['news_id']}, ${article['source_id']}, ${article['channel_id']}, '${article['title']}', '${article['origin']}', '${article['thumbnail']}', '${article['summary']}', ${article['valid']}, ${article['artificial']}, ${article['score']}, ${article['genre']}, ${article['hotflag']}, '${article['pub_time']}', '${article['author']}', '${article['content']}', '${article['create_time']}')`;
                        mysql_conn.query(sql, (error, results)=>{
                            if(error || !results || !results.insertId)cb(error||'insert fe_articles_all error');
                            else{
                                article['article_id'] = results.insertId;
                                cb();
                            }
                        });
                    },
                    cb=>{
                        let sql = `insert into fe_articles_all(id, ukey, url, news_id, source_id, channel_id, title, origin, thumbnail, summary, valid, artificial, score, genre, hotflag, pub_time, author, content, create_time)values(${article['article_id']}, '${article['ukey']}', '${article['url']}', ${article['news_id']}, ${article['source_id']}, ${article['channel_id']}, '${article['title']}', '${article['origin']}', '${article['thumbnail']}', '${article['summary']}', ${article['valid']}, ${article['artificial']}, ${article['score']}, ${article['genre']}, ${article['hotflag']}, '${article['pub_time']}', '${article['author']}', '${article['content']}', '${article['create_time']}')`;
                        mysql_conn.query(sql, (error, results)=>{
                            if(error || !results || !results.insertId)cb(error||'insert fe_articles_all error');
                            else{
                                cb();
                            }
                        });
                    },
                    cb=>{
                        let sql = `update fe_avnews set article_id = ${article['article_id']} where id = ${article['news_id']}`;
                        mysql_conn.query(sql, (error, results)=>{
                            if(error)cb(error);
                            else{
                                cb();
                            }
                        });
                    },
                    cb=>{
                        let sql = `insert into fe_news(id,news_key,url,source_id,channel_id,title,origin,author,pub_time,img_thum_url,summary,content,valid,create_time,artificial,score)values(${article['news_id']},'${article['ukey']}','${article['url']}',${article['source_id']},${article['channel_id']},'${article['title']}','${article['origin']}','${article['author']}','${article['pub_time']}','["${article['thumbnail']}"]','${article['summary']}','${article['content']}',${article['valid']},'${article['create_time']}',${article['artificial']},${article['score']})`;
                        mysql_conn.query(sql, (error, results)=>{
                            if(error)cb(error);
                            else{
                                cb();
                            }
                        });
                    }
                ],
                err=>{
                if(err){
                    mysql_conn.rollback(_=> {
                        article['valid'] = 0;
                        err_count++;
                        err_msg = err;
                        mysql_conn.end();
                        callback(null, article);
                  });
                }else{
                    mysql_conn.commit(error=>{
                        if (error) {
                          mysql_conn.rollback(_=> {
                            article['valid'] = 0;
                            err_count++;
                            err_msg = err;
                            mysql_conn.end();
                            callback(null, article);
                          });
                        }else{
                            mysql_conn.end();
                            callback(null, article);
                        }
                    });
                }    
            });
        },(err, results)=>{
            let validArticles = results.filter(a=>{return a['valid']});
            resolve({'articles':validArticles, err_count, err_msg});
        });
    });
}

return putArticlesToDatabase;
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