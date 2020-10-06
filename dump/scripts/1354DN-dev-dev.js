const crawler = require('../../processer/crawler.js');
const RULE_ID = '1354DN';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getPrice = async (url) =>{
    let all = await getChromeDocument(url);
    let doc = cheerio.load(all);
    return doc('#current_price').text();
};


let [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12] = await Promise.all([
                  getPrice('http://item.yhd.com/251837.html'),
                  getPrice('http://item.yhd.com/251813.html'),
                  getPrice('http://item.yhd.com/506545.html'),
                  getPrice('http://item.yhd.com/283397.html'),
                  getPrice('http://item.yhd.com/265468.html'),
                  getPrice('http://item.yhd.com/283407.html'),
                  getPrice('http://item.yhd.com/1316711234.html'),
                  getPrice('http://item.yhd.com/1036608409.html'),
                  getPrice('http://item.yhd.com/10147174069.html'),
                  getPrice('http://item.yhd.com/1115533955.html'),
                  getPrice('http://item.yhd.com/11375776943.html'),
                  getPrice('http://item.yhd.com/1628675297.html')]);



return `一号店品牌 自营 店高端白酒报价 \n飞天茅台 53度 500ml: ${p1} \n五粮液 52度 500ml: ${p2} \n洋河M3 52度 500ml: ${p3} \n剑南春 52度 500ml: ${p4} \n水井坊 52度 500ml: ${p5} \n泸州老窖1573 52度 500ml: ${p6} \n\n一号店品牌 直营 店高端白酒报价 \n飞天茅台 53度 500ml: ${p7} \n五粮液 52度 500ml: ${p8} \n洋河M3 52度 500ml: ${p9} \n剑南春 52度 500ml: ${p10} \n水井坊 52度 500ml: ${p11} \n泸州老窖1573 52度 500ml: ${p12}`;

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