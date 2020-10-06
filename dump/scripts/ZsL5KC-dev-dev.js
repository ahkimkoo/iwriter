const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZsL5KC';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getIndustryIndex = async (name)=>{
    let global_stock_index = await getValuesByVersion('stock-est',`${YEAR}-${MONTH}-${DATE}`);
    let sw_industry_index = await  getValuesByVersion('1DLSIv',`${YEAR}-${MONTH}-${DATE}`);
    
    if(global_stock_index && sw_industry_index){
        return {'show':array2table([
            ['指数', '上证', '深证', '恒生指数', '标普500', name[0]],
            ['最新价', global_stock_index['上证指数']['price'].toFixed(2), global_stock_index['深证成指']['price'].toFixed(2), global_stock_index['恒生指数']['price'].toFixed(2), global_stock_index['标普指数']['price'].toFixed(2), sw_industry_index[name[1]]['price'].toFixed(2)],
            ['涨跌幅（%）', global_stock_index['上证指数']['change'].replace('%',''), global_stock_index['深证成指']['change'].replace('%',''), global_stock_index['恒生指数']['change'].replace('%',''), global_stock_index['标普指数']['change'].replace('%',''), sw_industry_index[name[1]]['change'].replace('%','')],
            ],
            true,
            'iwdatatable iwindextable'
            )}
    }else return null;
}

//参数：[显示的名字，申万行业名称]
return await getIndustryIndex(['食品饮料','食品饮料']);
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