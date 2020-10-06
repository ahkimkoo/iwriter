const crawler = require('../../processer/crawler.js');
const RULE_ID = '5afba0b01a629d00750bb84c';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let now = new Date();
let result = {
    '$version' : dateFormat(now, 'yyyy-MM-dd'),
    'message' : '截至' + dateFormat(now, 'h点m分') + '，'
}

let lastweek_data = await getValuesByVersion(RULE, dateFormat(lookForPreviousNDay(now.getDay(),1), 'yyyy-MM-dd'));

let crawler_doc = await getDocument('http://config:NEOCrawler.Feheadline.com@10.10.169.90:8888/monitor/daily');
if(crawler_doc){
    let crawled_article = parseInt(crawler_doc('tbody>tr:nth-child(1)>th:nth-child(6)').text());
    result['crawled'] = crawled_article;
    result['message'] += '爬虫抓取了'+crawled_article+'篇文章；';
    if(lastweek_data && lastweek_data['crawled']){
        result['message'] += '同比' + quoteChangeSyntax(lastweek_data['crawled'], crawled_article, '增加', '减少', 2) + '。';
    }
}

const countMongo = async (col) =>{
    return new Promise(resolve=>{
        let MongoClient = mongodb.MongoClient;
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            let db = client.db('feheadline');
            var start = new Date();
            start.setHours(0,0,0,0);
        
            db.collection(col).count({'created':{'$gt':start.getTime()}},(err,val)=>{
                client.close();
                resolve(val);
            });
        });
    });
}

let rawnews = await countMongo('rawnews');
let avnews = await countMongo('avnews');

result['rawnews'] = rawnews;
result['avnews'] = avnews;

result['message'] += `\nMongodb rawnews存入${rawnews}篇，avnews存入${avnews}篇。`;

const countMysql = async(table='fe_avnews') =>{
    let connection = mysql.createConnection({
      host     : '10.10.119.133',
      user     : 'feapi',
      password : 'pwd@news
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
      database : 'news_cfg'
    });
    
    connection.connect();
    
    var start = new Date();
    start.setHours(0,0,0,0);
    
    return new Promise(resolve=>{
        connection.query(`SELECT count(*) as ct FROM ${table} WHERE create_time > '${dateFormat(start, 'yyyy-MM-dd hh:mm:ss')}'`, function (error, results, fields) {
            connection.end();
            resolve(!error && results.length > 0 ? results[0]['ct'] : 0);
        });
    });
}

let newscount = await countMysql('fe_avnews');
let articlecount = await countMysql('fe_articles');
result['newscount'] = newscount;
result['articlecount'] = articlecount;

result['message'] += `\nMysql 最终入库文章数${articlecount}，排重后新闻量${newscount}，`;

if(lastweek_data && lastweek_data['newscount']){
    result['message'] += '同比' + quoteChangeSyntax(lastweek_data['newscount'], newscount, '增加', '减少', 2) + '，';
}

let dupratio = percentSyntax(newscount / articlecount, false);
let avbratio = percentSyntax(newscount / rawnews, false);

result['message'] += `排重率${dupratio}，文章抓取可用率${avbratio}。`;

await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'运维报告','message':'☑'+dateFormat(now,'M月d日')+'数据入库报告\n\n'+result['message']});

// await sendMail(['"Cherokee" <lcg@feheadline.com>', '"洪军" <hj@feheadline.com>', '"傅强" <fq@feheadline.com>'], dateFormat(now,'M月d日')+'数据入库报告', result['message'], null, {
//     'host': 'smtp.exmail.qq.com',
//     'port': 465,
//     'secure': true,
//     'auth': {
//         'user': 'support@feheadline.com',
//         'pass': '123456s'
//     }}, '"Support" <support@feheadline.com>');


return result
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