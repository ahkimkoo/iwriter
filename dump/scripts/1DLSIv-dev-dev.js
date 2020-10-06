const crawler = require('../../processer/crawler.js');
const RULE_ID = '1DLSIv';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let txt = await getDocument('http://www.swsindex.com/ajaxpro/_IdxMain,App_Web_4x_imgqe.ashx',{
    'parse':false,
    'method':'POST',
    'form':'{}',
    'headers':{
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36',
        'X-AjaxPro-Method': 'swindex'
    }
   }
);

if(txt){
    let doc = cheerio.load(txt,{'decodeEntities': false});
    let data = [[],[],[],[]];
    let rows = doc('li');
    for (let i = 0; i < rows.length; i++) {
        let col = doc(rows.get(i));
        data[i%data.length].push(col.text().trim());
    }
    let d_array = [['行业','最新收盘','涨跌幅']];
    let d_obj = {};
    for(let i = 0; i < data[0].length; i++){
        d_array.push([data[0][i], data[1][i], data[2][i]]);
        d_obj[data[0][i]] = {
            'price' : parseFloat(data[1][i]),
            'change' : data[2][i]
        }
    }
    return Object.assign(d_obj,{
        'show' : array2table(d_array,true)
    });
}else return null;
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