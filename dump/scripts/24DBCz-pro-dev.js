const crawler = require('../../processer/crawler.js');
const RULE_ID = '24DBCz';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		// 获得 网站
     let result = {};
     let doc = await getDocument('http://www.sinotex.cn/news/Html/gedishichang/tiantiankuaibao/');
     if(doc) {
         let today = new Date().getDate();
         let article_date = doc('.date').first().text().substring(4,6);
         // 检测 今日是否更新
         if(today !== parseInt(article_date)) result = { 'show' : '<p> 没有更新，可至 http://www.sinotex.cn/newsHtml/181212/140000/ 检查 </p>'};
         else {
             // 抓取 需要的内容
             let targeturl = doc('.zixun li > a').first().attr('href');
             let article = await getDocument('http://www.sinotex.cn' + targeturl);
             let text = article('.col-xs-9 p').eq(1).text();
             let pic = await snapshotByElement('http://www.sinotex.cn' + targeturl, 'body', 'tbody', [0, 0, 0, 0], 'url');
             if(pic) {
                 result = {
                     'show': '<p>' + text + '</p>' + '<img src="' + pic + '" />',
                 };
             }
         }
         // 如果是星期一，展示 周六周日的内容
         if (new Date().getDay() === 4){
             let sunday = lookForPreviousNDay(7);
             let saturday = lookForPreviousNDay(6);
             let version1 = sunday.getFullYear() + '-'+ (sunday.getMonth()+1) +'-' + sunday.getDate();
             let version2 = saturday.getFullYear() + '-'+ (saturday.getMonth()+1) +'-' + saturday.getDate();
             let version3 = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()};`
             let sun = await getValuesByVersion(RULE,version3);
             return version3;
             let sat = await getValuesByVersion(RULE,version2);
             result.show = result.show + sun.show ;
            return sun
             
         }
         return result;
     }
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