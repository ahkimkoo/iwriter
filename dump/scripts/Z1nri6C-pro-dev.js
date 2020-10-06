const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z1nri6C';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		function _dateFormat(date,fmt) {
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ?
                (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

const md5 = (str) => {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

const genCode = (now) =>{
    let str = `${now.getMinutes()}${now.getDate()}${now.getHours()}`;
    return md5(str);
}

const getCountOfTodayInfo = function(){
    let MongoClient = mongodb.MongoClient
    return new Promise((resolve, reject) => {
        // let connection = mysql.createConnection({
        //   'host'     : 'cms-mysql.feheadline.net',
        //   'user'     : 'news',
        //   'password' : 'pwd@news
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
        //   'database' : 'news_cfg'
        // });
        // connection.connect();
        // connection.query(`SELECT count(*) AS number FROM profession_article_content WHERE to_days(pub_time)=to_days(now()) and valid = 1`,(err,result)=>{
        //     connection.end();
        //     if(!err && result && result.length && result[0]['number']>9){
        //         resolve(true);
        //     } else {
        //         reject('当日日报数量不够');
        //     }
        // })
            MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
            if(err)reject('获取mongoclient失败');
            else {
                    let db = client.db('fes');
                    let collection = db.collection('fes_info');
                    collection.find({"pub_time":{"$lte":new Date(new Date().setHours(23,59,59,0)),"$gte":new Date(new Date().setHours(18,0,0,0))}}).toArray(async (err,docs)=>{
                        client.close();
                        if(!err && docs.length>9){
                            resolve(docs[5]['date']);
                        } else {
                            reject('当日日报数量不够');
                        }
                    })
            }
        })
    })
}

const getIsPush = function(){
    return new Promise((resolve, reject) => {
        let key = 'pushed:applet:daily-report:'+_dateFormat(new Date(),'yyyy-MM-dd');
        let cache_redis_cli = redis.createClient({"host":"newscache.redis.feheadline.net","port":6379});
        cache_redis_cli.select(42,error=>{
            cache_redis_cli.exists(key, (err, reply) => {
                cache_redis_cli.quit();
                if (err) reject(err);
                else if (reply === 0) { // key 不存在
                    resolve(false)
                } else {
                    resolve(true);
                }
            })
        })
    })
}

const setPushState = function(){
    return new Promise((resolve, reject) => {
        let key = 'pushed:applet:daily-report:'+_dateFormat(new Date(),'yyyy-MM-dd');
        let cache_redis_cli = redis.createClient({"host":"newscache.redis.feheadline.net","port":6379});
        cache_redis_cli.select(42,err=>{
            cache_redis_cli.setex(key,86400,1,_=>{
                cache_redis_cli.quit();
                resolve(true);
            })
        })
    })
}

//发送小程序微信推送
const sendWxmsg = function(s_date){
    return new Promise((resolve, reject) => {
        let t_date = new Date().getTime();
        if(new Date().getDay()==5){
            t_date = t_date+24*3600*1000*3;
        } else {
            t_date = t_date+24*3600*1000;
        }
        request.post({'url':'https://fesapi.feheadline.com/provider/msg-api/v1/fes-send-tempmsg',json:{
                "project": "afterCompleteArticle",
                "date": s_date || _dateFormat(new Date(t_date),'yyyy-MM-dd')
            }},(err,response,body)=>{
                console.log(body)
            if(!err && body && body['success']){
                resolve(true);
            } else {
                reject('请求推送接口失败');
            }
        })
    })
}

//发送APP推送
const sendAPPpush = function(s_date){
    return new Promise((resolve,reject) => {
        let t_date = new Date().getTime();
        if(new Date().getDay()==5){
            t_date = t_date+24*3600*1000*3;
        } else {
            t_date = t_date+24*3600*1000;
        }
        request.post({'url':'https://fesapi.feheadline.com/provider/api/v1/fes-group-push',json:{
        	"access_token":genCode(new Date()),
        	"title":"财经秘书",
        	"content":(s_date || _dateFormat(new Date(t_date),'yyyy-MM-dd'))+"日报更新成功",
        	"groups":["phone_users"]
        }},(err,response,body)=>{
            if(!err && body && body['success']){
                resolve(true);
            } else {
                reject('请求app推送接口失败');
            }
        })
    })
}

const setTimePushWXmsg = async function(){
    try{
        let push_state = await getIsPush();
        if(push_state){
            return '推送过';
        } else {
            let s_date = await getCountOfTodayInfo();
             await sendWxmsg(s_date);
             await sendAPPpush(s_date);
             await setPushState();
            return 'success';
        }
    }catch(e){
        return '出错了';
    }
}

const getReportDate = async function(){
    try{
        let date = await getCountOfTodayInfo();
        return date;
    } catch(e){
        return '出错了';
    }
}

//return await getReportDate();

return await setTimePushWXmsg();

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