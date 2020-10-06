const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZCOsIJ';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ?
                (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};


const getReturnCoupons = async ()=>{
        return new Promise(resolve=>{
        let connection = mysql.createConnection({
          'host'     : '10.10.119.133',
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
        let sql =  `SELECT * FROM fes_coupon_send_record WHERE update_time < "${new Date(new Date().getTime()-86400*1000)}" AND update_time >= "${new Date(new Date().getTime()-(86400*1000+3600*1000))}" AND receive_user_phone IS NULL;`;
        connection.query(sql, async function (error, result, fields) {
                    connection.end();
                    resolve(result);
            
        })
    })
}

//发送APP推送
const sendAPPpush = function(users){
    return new Promise((resolve,reject) => {
        request.post({'url':'http://push-service.fes.net:9528/v1/fesecret/push/single',json:{
                "users":users,
                "platform":["ALL"],
                "title":"财经秘书",
                "content": "您的好友超过24小时没有领券，已经返还至您的账户中哦~",
                "app_data":{
                    "page":"coupon"
                }
        }},(err,response,body)=>{
            if(!err && body && body['success']){
                resolve(true);
            } else {
                reject('请求app推送接口失败');
            }
        })
    })
}

const sendWXAPPpush = function(users){
    return new Promise((resolve,reject) => {
        request.post({'url':'http://push-service.fes.net:9528/v1/fesecret/wechat-applet/push/template/single',json:{
                "users": users,
                "template_id": "y74H9fQvS5hzEyUX0Cc6xYkCJ8eJbdo7Ogj0JM9ZAJI", // 微信小程序或者公众号后台的 template_id
                "template_data": {
                    "keyword1":{"value":"财经秘书"},
                    "keyword2":{"value":"您的好友超过24小时没有领券，已经返还至您的账户中哦~"}
                }, // 模板id对应的 template_data
                "page": 'pages/vip/home', // 跳转小程序的界面
                "emphasis_keyword": {} // 需要方法的关键词
        }},(err,response,body)=>{
            if(!err && body && body['success']){
                resolve(true);
            } else {
                reject('请求app推送接口失败');
            }
        })
    })
}

//数组去重
function unique(arr) {
    if (!Array.isArray(arr)) {
        console.log('type error!')
        return
    }
    let res = []
    for (let i = 0; i < arr.length; i++) {
        if (res.indexOf(arr[i]) === -1) {
            res.push(arr[i])
        }
    }
    return res
}

const wholeTask = async ()=>{
    let return_coupons = await getReturnCoupons();
    let users = return_coupons.map(x=>{return x['send_user_phone']});
    users = unique(users);
    await sendAPPpush(users);
    await sendWXAPPpush(users)
}
return wholeTask();


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