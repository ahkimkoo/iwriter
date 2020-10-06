const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZcyKba';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getStockResult = async ()=>{
    return new Promise(resolve=>{
        request.get('http://feapi.feheadline.com/provider/api/v1/count-bet',(err,res,body)=>{
            resolve(body);
        })
    })
}
return await getStockResult();
const setStockIndex = async (sh000001_index,sz399001_index,sz399006_index,date)=>{//手动获取指数增长
    return new Promise(resolve=>{
        resolve({
            "sh000001_index":sh000001_index,
            "sz399001_index":sz399001_index,
            "sz399006_index":sz399006_index,
            "date":date
        })
    })
}

const getLastestMatch = async ()=>{
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                    let db = client.db('feheadline');
                    let collection = db.collection('stock_bet_match');
                    collection.find({"valid":1,"result":1}).sort(["create_time",-1]).limit(1).toArray(async (err,docs)=>{
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

const getOdds = async ()=>{
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                    let db = client.db('feheadline');
                    let collection = db.collection('stock_bet_match');
                    collection.find({"valid":1,"result":null}).sort(["create_time",-1]).limit(1).toArray(async (err,docs)=>{
                        client.close();
                        if(!err && docs.length>0){
                            let match_id = docs[0]['_id'];
                            let sh_odds_rise = (docs[0]['sh000001_rise_bettingcout']+docs[0]['sh000001_fall_bettingcout'])/docs[0]['sh000001_rise_bettingcout'];
                            let sh_odds_fall = (docs[0]['sh000001_rise_bettingcout']+docs[0]['sh000001_fall_bettingcout'])/docs[0]['sh000001_fall_bettingcout'];
                            let sz_odds_rise = (docs[0]['sz399001_rise_bettingcout']+docs[0]['sz399001_fall_bettingcout'])/docs[0]['sz399001_rise_bettingcout'];
                            let sz_odds_fall = (docs[0]['sz399001_rise_bettingcout']+docs[0]['sz399001_fall_bettingcout'])/docs[0]['sz399001_fall_bettingcout'];
                            let cy_odds_rise = (docs[0]['sz399006_rise_bettingcout']+docs[0]['sz399006_fall_bettingcout'])/docs[0]['sz399006_rise_bettingcout'];
                            let cy_odds_fall = (docs[0]['sz399006_rise_bettingcout']+docs[0]['sz399006_fall_bettingcout'])/docs[0]['sz399006_fall_bettingcout'];
                            resolve({
                                "match_id":match_id,
                                "sh_odds_rise":sh_odds_rise,
                                "sh_odds_fall":sh_odds_fall,
                                "sz_odds_rise":sz_odds_rise,
                                "sz_odds_fall":sz_odds_fall,
                                "cy_odds_rise":cy_odds_rise,
                                "cy_odds_fall":cy_odds_fall
                            });
                        } else {
                            resolve({
                                "error":"no results"
                            });
                        }
                    })
            }
        })
    })
}

const updateMatchResult = async (match_id,sh_result,sz_result,cy_result,date)=>{//更新比赛结果
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                    let db = client.db('feheadline');
                    let collection = db.collection('stock_bet_match');
                    collection.update({"_id":new mongodb.ObjectID(match_id)},{"$set":{"sh000001_betting_result":sh_result,"sz399001_betting_result":sz_result,"sz399006_betting_result":cy_result,"date":date,"result":1}}, (err,docs)=>{
                        client.close();
                        if(!err){
                            resolve({
                                "error":null
                            })
                        } else {
                            resolve({
                                "error":err
                            });
                        }
                    })
            }
        })
    })
}

const updateUserResult = async (match_id,sh_result,code_rise,code_fall,odds_rise,odds_fall,date)=>{
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                let db = client.db('feheadline');
                let collection = db.collection('user_stock_bet_match');
                collection.updateMany({"match_id":new mongodb.ObjectID(match_id),"is_add":0,"bet_obj":code_rise},{"$set":{"match_result":sh_result,"date":date,"odds":odds_rise},"$mul":{"bet_result":sh_result>0?odds_rise:0}},null, (err,docs)=>{
                                        collection.updateMany({"match_id":new mongodb.ObjectID(match_id),"is_add":0,"bet_obj":code_fall},{"$set":{"match_result":sh_result,"date":date,"odds":odds_fall},"$mul":{"bet_result":sh_result<0?odds_fall:0}},null, (err,docs)=>{
                    client.close();
                    resolve();
                })
                })
            }
        })
    })
}

const getUserBetResult = async (match_id)=>{//获取用户投注
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                    let db = client.db('feheadline');
                    let collection = db.collection('user_stock_bet_match');
                    collection.find({"match_id":new mongodb.ObjectID(match_id),"is_add":0}).toArray(async (err,docs)=>{
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

const updateUserBetState = async (bet_id)=>{
    let MongoClient = mongodb.MongoClient;
    return new Promise(resolve=>{
        MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)resolve(null);
            else {
                    let db = client.db('feheadline');
                    let collection = db.collection('user_stock_bet_match');
                    collection.update({"_id":new mongodb.ObjectID(bet_id)},{"$set":{"is_add":1}}, (err,docs)=>{
                        client.close();
                        resolve();
                    })
            }
        })
    })
}

const updateMysqlScore = async (bet_result,user_id)=>{
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
        let sql =  `UPDATE fe_integration_total set integration = integration + ${parseInt(bet_result)} WHERE user_id = ${user_id}`;
        connection.query(sql, async function (error, result, fields) {
            let sql2 = `INSERT INTO fe_integration_detail (user_id,task_code,integration,obj_type,obj_id) VALUES (${user_id},"task_14",${parseInt(bet_result)},null,null)`;
            connection.query(sql2, async function (error, result, fields) {
                    connection.end();
                    resolve();
            })
            
        })
    })
}


const wholeTask = async ()=>{   let indexJson = await setStockIndex(1,-1,-1,'2018-12-17');
     let sh_result = indexJson['sh000001_index'];
    let sz_result = indexJson['sz399001_index'];
    let cy_result = indexJson['sz399006_index'];
    let date = indexJson['date'];
    let match_id = 0;
   let sh_odds_rise = 1;
    let sh_odds_fall = 1;
     let sz_odds_rise = 1;
   let sz_odds_fall = 1;
    let cy_odds_rise = 1;
    let cy_odds_fall = 1;
    let lastestMatch = await getLastestMatch();
    if(lastestMatch[0] && lastestMatch[0]['date'] && lastestMatch[0]['date']>=date){
        return lastestMatch[0]['date'];
    } else {
        let oddsList = await getOdds();
        if(oddsList['error']){
            return 'odds_error:'+oddsList['error'];
       } else {
            match_id = oddsList['match_id'];
            sh_odds_rise = oddsList['sh_odds_rise'];
            sh_odds_fall = oddsList['sh_odds_fall'];
            sz_odds_rise = oddsList['sz_odds_rise'];
            sz_odds_fall = oddsList['sz_odds_fall'];
            cy_odds_rise = oddsList['cy_odds_rise'];
            cy_odds_fall = oddsList['cy_odds_fall'];
            let update_match_result = await updateMatchResult(match_id,sh_result,sz_result,cy_result,date);
             if(update_match_result['error']){
                 return 'odds_error:'+update_match_result['error'];
             } else {
                 await updateUserResult(match_id,sh_result,"sh000001_rise","sh000001_fall",sh_odds_rise,sh_odds_fall,date);
                 await updateUserResult(match_id,sz_result,"sz399001_rise","sz399001_fall",sz_odds_rise,sz_odds_fall,date);
                 await updateUserResult(match_id,cy_result,"sz399006_rise","sz399006_fall",cy_odds_rise,cy_odds_fall,date);
                let user_bet_result = await getUserBetResult(match_id);
                for(let i=0;i<user_bet_result.length;i++){
                    if(user_bet_result[i]['bet_result']>0){
                        await updateMysqlScore(user_bet_result[i]['bet_result'],user_bet_result[i]['user_id']);
                        await updateUserBetState(user_bet_result[i]['_id']);
                    } else {
                        await updateUserBetState(user_bet_result[i]['_id']);
                    }
                }
                return 'success';
            }
        }
    }
 }

// const test = async ()=>{
//     return await updateMatchResult("5bebe9d8ecd284001b76e537",1,1,-1,'2018-11-16');
// }
// return await test()
// return await wholeTask();
// const getrequireMatch = async ()=>{
//     let MongoClient = mongodb.MongoClient;
//     return new Promise(resolve=>{
//         MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
//             if(err)resolve(null);
//             else {
//                     let db = client.db('feheadline');
//                     let collection = db.collection('stock_bet_match');
//                     collection.update({"create_time":{"$lte":new Date('2019-01-29 12:00:00'),"$gte":new Date('2019-01-28 12:00:00')}},{"$set":{"sz399006_fall_bettingcout":490}},async (err,docs)=>{
//                         client.close();
//                         if(!err && docs.length>0){
//                             resolve(docs);
//                         } else {
//                             resolve([]);
//                         }
//                     })
//             }
//         })
//     })
// }

// const getMatchUser = async ()=>{
//     let MongoClient = mongodb.MongoClient;
//     return new Promise(resolve=>{
//         MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
//             if(err)resolve(null);
//             else {
//                     let db = client.db('feheadline');
//                     let collection = db.collection('user_actions');
//                     collection.find({}).count().toArray(async (err,docs)=>{
//                         client.close();
//                         if(!err && docs.length>0){
//                             resolve(docs);
//                         } else {
//                             resolve([]);
//                         }
//                     })
//             }
//         })
//     })
// }
//return await getrequireMatch()

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