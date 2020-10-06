const crawler = require('../../processer/crawler.js');
const RULE_ID = '5aeabef2fcb84c681f01c4cb';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let weibo_home_doc = await getBrowserDocument('https://weibo.com/1402901591/profile?topnav=1&wvr=6&is_all=1','<span class="S_txt2">粉丝</span>');
let message = '';
if(weibo_home_doc){
    let weibo_fans_count = parseInt(weibo_home_doc('.W_f18').eq(1).text().trim());
    message += `微博粉丝数${weibo_fans_count}。`;
    let video_link = weibo_home_doc('a[title=财经早餐的秒拍视频]').eq(0).attr('href');
    let video_doc = await getBrowserDocument(video_link,'次播放',{'headers':{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36'}});
    if(video_doc){
        let video_play_count = parseInt(video_doc('.bot_number>em:nth-child(2)').eq(0).text().trim().replace(/[^0-9]+/g,''));
        message += `\n当天视频播放量${video_play_count}。`;
    }
}

return message || null;
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