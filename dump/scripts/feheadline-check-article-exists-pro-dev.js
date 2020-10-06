const crawler = require('../../processer/crawler.js');
const RULE_ID = 'feheadline-check-article-exists';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		/**
 * 检查文章是否存在
 * 参数:key
 * 返回promise boolean
 */
 
const checkArticleExist = (key='') => {
    let mysql_conn = mysql.createConnection({
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
        });
        
    mysql_conn.connect();
    let sql = `select id from fe_articles where ukey = '${key}' limit 1`;
    return new Promise(resolve=>{
        mysql_conn.query(sql, (error, results, fields)=>{
            mysql_conn.end();
            if (error){
                resolve(true);
            }else{
                resolve(results.length>0);
            }
        });
    });
}


return checkArticleExist;
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