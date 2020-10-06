const crawler = require('../../processer/crawler.js');
const RULE_ID = '5acf24c9c4a911192e0b46d3';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const ABOVE = '涨幅'; 
const BELOW = '跌幅'; 

var getCoinData = async function(url_suffix, name, zh_name){ 
    let coin_data = await getJson('https://api.coinmarketcap.com/v1/ticker/'+url_suffix+'/'); 
    let price = coin_data[0]['price_usd']; 
    let percent_change_24h = coin_data[0]['percent_change_24h']; 
    let percent_change_7d = coin_data[0]['percent_change_7d']; 
    let percent_change_24h_sytax = pnSyntax(percent_change_24h, ABOVE, BELOW) + Math.abs(percent_change_24h) + '%'; 
    let percent_change_7d_sytax = pnSyntax(percent_change_7d, ABOVE, BELOW) + Math.abs(percent_change_7d)+'%'; 
    let result = `${name}${zh_name}报${price}美元，24小时${percent_change_24h_sytax}，7天${percent_change_7d_sytax}。`; 
    return result;
    //return Promise.resolve(result); 
} 
const tasks = [ 
    ['bitcoin','BTC','比特币'], 
    ['ethereum','ETH','以太币'], 
    ['ripple','XRP','瑞波币'], 
    ['litecoin','LTC','莱特币'], 
    ['eos','EOS','币'], 
    ] 

let results = [];

for(let t of tasks){
    results.push(await getCoinData(...t));
}

return '【加密货币整点报盘】\n'+results.join('\n');
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