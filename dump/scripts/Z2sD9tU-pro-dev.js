const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z2sD9tU';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		function execSql(sql, sql_params) {
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection({
            host     : 'cms-mysql.feheadline.net',
            user     : 'feadmin',
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
        connection.query(sql, sql_params, (error, _results) => {
            if (error) reject(error);
            else resolve(_results);
        });
        connection.end();
    });
}

// [{keyword: '123', score: 834}]
async function getKeywordScoreList() {
    let $ = await getDocument("http://www.5ce.com/hot/baidu/7");
    let keyword_list = [];
    let score_list = [];
    $(".read-item .keyword .keyword-value a").each((index, ele) => {
        keyword_list.push($(ele).text());
    });
    $(".read-item .index").each((index, ele) => {
        score_list.push($(ele).text());
    });
    
    let len = keyword_list.length > score_list.length ? score_list.length : keyword_list.length;
    let keyword_score_list = [];
    for (let i = 0; i < len; i++) {
        keyword_score_list.push({
            keyword: keyword_list[i],
            score: Number(score_list[i].substring(0, 3))
        })
    }
    
    return keyword_score_list;
}

function getSevenDaysBeforeDate() {
    return dateFormat(new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
}

async function isRepeat(keyword) {
    let sql = `select 1 from fe_hot_search_word where word = '${keyword}' and create_date >= '${getSevenDaysBeforeDate()}';`;
    let results = await execSql(sql);
    return results.length > 0;
}

async function addHotKeyword(keyword, score) {
    let sql = `insert into fe_hot_search_word(word, create_date, degree, valid) VALUES (?, ?, ?, ?)`;
    let sql_params = [
        keyword, dateFormat(new Date(), "yyyy-MM-dd"), score, 1
    ];
    await execSql(sql, sql_params);
}

async function updateHotKeywordScore(keyword, score) {
    let sql = `update fe_hot_search_word set degree = ${score}, valid = 1 where word = '${keyword}'`;
    await execSql(sql);
}

// 将七天内的关键词先设为无效
async function setInvalid() {
    let date = getSevenDaysBeforeDate();
    let sql = `update fe_hot_search_word set valid = 0 where create_date >= '${date}'`;
    await execSql(sql);
}

// 逻辑主体
// [{keyword: '123', score: 834}]
await setInvalid();
let keyword_score_list = await getKeywordScoreList();
for (let each of keyword_score_list) {
    if (await isRepeat(each.keyword)) {
        await updateHotKeywordScore(each.keyword, each.score);
    } else {
        await addHotKeyword(each.keyword, each.score);
    }
}

return JSON.stringify(keyword_score_list);
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