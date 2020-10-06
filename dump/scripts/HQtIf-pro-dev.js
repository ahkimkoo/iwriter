const crawler = require('../../processer/crawler.js');
const RULE_ID = 'HQtIf';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const checkOrder = async() => {
    let yesterday = new Date(new Date().getTime() - 86400000);
    yesterday.setHours(0,0);
    
    let today = new Date();
    today.setHours(0,0);
    
    return new Promise(resolve=>{
        let connection = mysql.createConnection({
          'host'     : 'mysql.fes.net',
          'user'     : 'fes',
          'password' : 'yqqlmgs1cl@fes
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
          'database' : 'fes'
        });
        
        connection.connect();
                
        let sql = `SELECT 
            COUNT(DISTINCT (fes_user.user_phone)) AS buyer_count,
            COUNT(DISTINCT (fes_industry_list.name)) AS industry_count,
            COUNT(fes_user_subscribe_buy.id) AS order_count
        FROM
            fes_user_subscribe_buy,
            fes_user,
            fes_industry_list
        WHERE
            fes_user_subscribe_buy.valid = 1
                AND fes_user_subscribe_buy.buy_price > 1
                AND fes_user_subscribe_buy.create_time > FROM_UNIXTIME(${parseInt(yesterday.getTime()/1000)})
                AND fes_user_subscribe_buy.create_time <= FROM_UNIXTIME(${parseInt(today.getTime()/1000)})
                AND fes_user.user_phone = fes_user_subscribe_buy.user_phone
                AND fes_user_subscribe_buy.industry_id = fes_industry_list.id;`;
        
        let sql2 = `SELECT 
            SUM(CAST(total_fee AS DECIMAL(10,2))) AS total_fee
        FROM
            wx_order_history
        WHERE
            create_time >= FROM_UNIXTIME(${parseInt(yesterday.getTime()/1000)})
                AND create_time < FROM_UNIXTIME(${parseInt(today.getTime()/1000)})
                AND result_code = 'SUCCESS';`;
        
        connection.query(sql, async function (error, results, fields) {
          if (error){
              resolve();
              connection.end();
          }else{
              if(results.length>0){
                  connection.query(sql2, async function (error2, results2, fields2) {
                      let ret = results[0];
                      let total_fee = 0;
                      if(!error2 && results2.length>0) total_fee = results2[0]['total_fee'];
                      let mq_message = `☑财秘订单统计：\n昨日成交订单${ret['order_count']}个，成交额${total_fee}元，买家${ret['buyer_count']}人，涉及行业${ret['industry_count']}个。\n详细：http://t.cn/E5WAX1d`;
                      if(CALLER!='coder'){
                          await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'恭喜发财','message':mq_message});
                      }
                      connection.end();
                      resolve(`昨日成交订单${ret['order_count']}个，成交额${total_fee}元，买家${ret['buyer_count']}人，涉及行业${ret['industry_count']}个。`);
                  });
              }else {
                connection.end();
                resolve();  
              }
          }
        });
    });
}


return checkOrder();
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