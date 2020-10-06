const crawler = require('../../processer/crawler.js');
const RULE_ID = '5af03c617807282b08ecc9a8';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		// sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'聚合写作','message':'这测试'+new Date()});

/*
a:参数a
b:参数b
*/
const fn = (a,b)=>{
    return {
        'message':'这是'+a+'+'+b+'的结果',
        'images':['http://qn-cmspics.feheadline.com/page-capture/iw-hot-4007.png','http://qn-cmspics.feheadline.com/page-capture/iw-Cp0ff-2019-04-15.png'],
        'html':'<h1>这是<strong>'+a+'+'+b+'</strong>的结果</h1>'
    };
}
// return {
//     'message':'有show的时候不显示message信息',
//     'show':'<img src="http://c.hiphotos.baidu.com/image/pic/item/d50735fae6cd7b89acbea9df032442a7d8330e9f.jpg">',
//     'caller':CALLER
// };

return fn;
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