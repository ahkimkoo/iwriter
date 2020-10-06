const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z1l0Pt2';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const checkOrder = async() => {
    let now = new Date();
    let lastValue = await getLastValues(RULE);
    let cursor = lastValue && lastValue['cursor'] ? lastValue['cursor'] : new Date(now.getTime()-86400000*10);
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
        
        // let sql = `SELECT 
        //     sys_user.name AS buyer,
        //     profession_order_history.phone AS buyer_phone,
        //     fe_profession_list.name AS industry_name,
        //     fe_profession_list.mask_name AS industry_mask_name,
        //     start_time,
        //     end_time,
        //     total_fee,
        //     profession_order_history.require_price AS require_price,
        //     profession_order_history.wx_order_id AS order_id,
        //     profession_order_history.agency as agency,
        //     IF(ISNULL(profession_order_history.salesman),NULL,(SELECT name  FROM sys_user WHERE id = profession_order_history.salesman))  as salesman,
        //     profession_order_history.create_time AS create_time
        // FROM
        //     profession_order_history
        //         INNER JOIN
        //     wx_order_history ON profession_order_history.wx_order_id = wx_order_history.out_trade_no
        //         AND total_fee > 1
        //         INNER JOIN
        //     fe_profession_list ON fe_profession_list.id = profession_order_history.profession_id
        //         INNER JOIN
        //     wx_caimi_user ON profession_order_history.phone = wx_caimi_user.phone
        //         INNER JOIN
        //     sys_user ON sys_user.id = wx_caimi_user.user_id
        // WHERE
        //     profession_order_history.valid = 1 
        //     AND profession_order_history.create_time > FROM_UNIXTIME(${parseInt(cursor.getTime()/1000)})
        //         AND profession_order_history.create_time <= FROM_UNIXTIME(${parseInt(now.getTime()/1000)})`;
                
        let sql = `SELECT 
            fes_user.user_name AS buyer,
            fes_user.user_phone AS buyer_phone,
            fes_industry_list.name AS industry_name,
            fes_user_subscribe_buy.start_time AS start_time,
            fes_user_subscribe_buy.end_time AS end_time,
            fes_user_subscribe_buy.wx_order_id AS order_id,
            wx_order_history.trade_type AS trade_type, 
            fes_user_subscribe_buy.agency AS agency,
            IF(ISNULL(fes_user_subscribe_buy.salesman),
                NULL,
                (SELECT 
                        name
                    FROM
                        fes_user
                    WHERE
                        id = fes_user_subscribe_buy.salesman)) AS salesman,
            fes_user_subscribe_buy.buy_price AS require_price,
            wx_order_history.total_fee AS total_fee,
            fes_user_subscribe_buy.create_time AS create_time
        FROM
            fes_user_subscribe_buy,
            fes_user,
            fes_industry_list,
            wx_order_history
        WHERE
            fes_user_subscribe_buy.valid = 1
                AND wx_order_history.total_fee > 1
                AND fes_user_subscribe_buy.create_time > FROM_UNIXTIME(${parseInt(cursor.getTime()/1000)})
                AND fes_user_subscribe_buy.create_time <= FROM_UNIXTIME(${parseInt(now.getTime()/1000)})
                AND fes_user.user_phone = fes_user_subscribe_buy.user_phone
                AND fes_user_subscribe_buy.industry_id = fes_industry_list.id
                AND wx_order_history.out_trade_no = fes_user_subscribe_buy.wx_order_id;`;
        
        connection.query(sql, async function (error, results, fields) {
          if (error){
              connection.end();
              resolve();
          }else{
              let tidy_order = results.reduce((dlist, ret)=>{
                  let idx = dlist.map(x=>{return x['order_id']}).indexOf(ret['order_id']);
                  if(idx>=0){
                      dlist[idx]['orders'].push({
                          'industry_name' : ret['industry_name'],
                          'require_price' : ret['require_price'],
                          'start_time' : ret['start_time'],
                          'end_time' : ret['end_time']
                      });
                  }else{
                      dlist.push({
                          'buyer':ret['buyer']||'神秘人',
                          'buyer_phone':ret['buyer_phone'],
                          'order_id' : ret['order_id'],
                          'create_time' : ret['create_time'],
                          'total_fee' : ret['total_fee'],
                          'agency'   : ret['agency']||'',
                          'salesman' : ret['salesman']||'',
                          'trade_type': ret['trade_type']=='APP'?'APP':'小程序',
                          'orders':[{
                          'industry_name' : ret['industry_name'] ,
                          'require_price' : ret['require_price'],
                          'start_time' : ret['start_time'],
                          'end_time' : ret['end_time']
                      }]
                      });
                  }
                  return dlist;
              },[]);
              
              let tidy_list = [['昵称','手机','时间','费用','行业','代理商','推荐人','终端']];
              
              for(let ret of tidy_order){
                  let mq_message = `☑财秘订单：\n${ret['buyer'].replace(/(.)./g,'$1░')}（${ret['buyer_phone'].replace(/(\d{3})\d{4}(\d+)/,'$1****$2')}）于${dateFormat(ret['create_time'],'hh:mm')}在${ret['trade_type']}付费${ret['total_fee']}元购买了${ret['orders'].length}份行业情报：${ret['orders'].map(x=>{return x['industry_name']}).join('；')}。`;
                  if(ret['agency']){
                      mq_message += `\n此单代理商：${ret['agency']} 。`;
                  }
                  if(ret['salesman']){
                      mq_message += `\n此单推荐人：${ret['salesman']}。`;
                  }
                  if(CALLER!='coder'){
                      await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'恭喜发财','message':mq_message});
                  }
                  tidy_list.push([ret['buyer'],ret['buyer_phone'],dateFormat(ret['create_time'],'hh:mm:ss'),ret['total_fee'],ret['orders'].map(x=>{return x['industry_name']}).join('；'),ret['agency'],ret['salesman'],ret['trade_type']])
              }
              
              connection.end();
              if(tidy_list.length>1)resolve({
                  'show':array2table(tidy_list, true),
                  'cursor':now
              });
              else resolve();
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