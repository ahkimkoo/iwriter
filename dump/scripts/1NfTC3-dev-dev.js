const crawler = require('../../processer/crawler.js');
const RULE_ID = '1NfTC3';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getMongoLog = async ()=>{
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                    let db = client.db('felog');
                    let collection = db.collection('wxapp_user_actions');
                    collection.find({"timestamp":{"$gte":new Date(new Date().getTime() - 86400000),"$lte":new Date()}}).toArray(async (err,docs)=>{
                        client.close();
                        if(!err && docs.length>0){
                            resolve(docs);
                        } else {
                            resolve([]);
                        }
                    })
            }
        })
    })
}

const getUserRole = async (item)=>{
    return new Promise(resolve=>{
        let connection = mysql.createConnection({
          'host'     : '10.10.119.133',
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
        connection.connect();
        let sql =  `SELECT count(*) AS num FROM profession_order_history AS a INNER JOIN wx_caimi_user AS b ON a.phone = b.phone where b.user_id =${item['meta']['user_id']} AND a.require_price>1`;
        connection.query(sql, async function (error, result, fields) {
            if(!error && result && result.length && result[0]['num']){
                item['meta']['user_role'] = 'paid';
                connection.end();
                resolve(item);
            } else {
                let sql2 = `SELECT experience_profession_id FROM wx_caimi_user WHERE user_id = ${item['meta']['user_id']}`;
                connection.query(sql2, async function (error, result, fields) {
                        if(!error && result && result.length && result[0]['experience_profession_id']){
                            item['meta']['user_role'] = 'experienced';
                        } else {
                            item['meta']['user_role'] = 'new';
                        }
                        connection.end();
                        resolve(item);
                })
            }
        })
    })
}

const formatDate = function(date){
    return date.getFullYear()+'-'+addZero(date.getMonth()+1)+'-'+addZero(date.getDate())+' '+addZero(date.getHours())+':'+addZero(date.getMinutes())+':'+addZero(date.getSeconds());
}

const addZero = function(time){
    if(time<10){
        return '0'+time;
    }
    return time;
}

const insertMysqlLog = async (item)=>{
    return new Promise(resolve=>{
        let connection = mysql.createConnection({
          'host'     : '10.10.119.133',
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
        connection.connect();
        let sql = `INSERT INTO wxapp_user_action_log (terminal,user_id,user_token,action,action_extra,status,result,updated,version,role) VALUES (?,?,?,?,?,?,?,?,?,?)`;
         connection.query(sql,[
                        item['meta']['terminal'],
                        item['meta']['user_id'],
                        item['meta']['user_token'],
                        item['meta']['action'],
                        item['meta']['action_extra'],
                        item['meta']['status']?1:0,
                        JSON.stringify(item['meta']['result']),
                        formatDate(new Date(item['meta']['updated'])),
                        item['meta']['version'],
                        item['meta']['user_role']], async function (error, result, fields) {
            if(!error && result && result.affectedRows){
                connection.end()
                resolve(true);
            } else {
                connection.end()
                resolve(false);
            }
         })
    })
}

const synchronizeUserActions = async()=>{
    let count = 0;
    let mongoLogs = await getMongoLog();
    for(let i =0;i<mongoLogs.length;i++){
        let log = await getUserRole(mongoLogs[i]);
        let result = await insertMysqlLog(log);
        if(result){
            count++;
        }
    }
        //     let log = await getUserRole(mongoLogs[0]);
        // let result = await insertMysqlLog(log);
    return "success to insert logs : "+count;
}

return await synchronizeUserActions();



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