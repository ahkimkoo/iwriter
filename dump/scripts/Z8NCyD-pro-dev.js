const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z8NCyD';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const type_mapping = {
    "news":"新闻",
    "event":"快讯",
    "video":"视频",
    "share":"财友圈"
}

const platform_mapping = {
    "feheadline":"财经头条",
    "fescretary":"财经秘书",
    "femorning":"财经早餐"
}

let ret;

try{
   let handle_count = await consumeMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews', 'comment_ex', 'comment_ex_q_iw', 20000, async(msgstr)=>{
        let msg = JSON.parse(msgstr);
        if(msg['valid'] || msg['artificial'])return true;
        else{
            let mq_msg = `☑${msg['user_name']}(${msg['user_id']})在${platform_mapping[msg['platform']]}的${type_mapping[msg['type']]}发表违规言论被系统拦截。\n【拦截原因】：${msg['invalid_reason']||'看着不爽'}`;
            let invalid_part = msg['invalid_part'];
            if(invalid_part.indexOf('message')>=0){
                mq_msg += `\n【内容】：${msg['message'].substring(0,300)}`;
            }
            if(invalid_part.indexOf('images')>=0){
                mq_msg += `\n【图片】：${msg['images'].join(' , ')}`;
            }
            mq_msg += `\n【点此放行】：${msg['to_valid_url']}`;
            if(msg['to_invalid_url'])mq_msg += `\n【点此撤销】：${msg['to_invalid_url']}`;
            await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'评论审核','message':mq_msg});
        }
    }); 
    if(handle_count>0)ret = '处理了'+handle_count+'条评论';
}catch(e){
    ret = '发生错误:'+e;
}

return ret
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