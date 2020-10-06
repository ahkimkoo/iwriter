const crawler = require('../../processer/crawler.js');
const RULE_ID = '5af0f7e585cbf02dd8749862';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getData = async (url) =>{
    let doc = await getDocument(url);
    if(doc){
        let dct = {}
        let tb = table2array(doc,'#quotes>table');
        for(let itm of tb){
            if(itm.length==15){
                let month = itm[1].trim();
                let last = itm[6].replace('-','').trim();
                let prior = itm[8].replace('-','').trim();
                dct[month] = parseFloat(last || prior);
            }
        }
        return dct;
    }else return null
}

const dict2line = (dict, series, name) =>{
    let html = '<tr><td>' + name + '</td>';
    for(let s of series){
        html += '<td>' + (dict.hasOwnProperty(s) ? dict[s] : '-') + '</td>';
    }
    html += '</tr>';
    return html;
}

let wmp = await getData('http://www.nzxfutures.com/dairy/quotes/wmp?locale=cn');
let smp = await getData('http://www.nzxfutures.com/dairy/quotes/smp?locale=cn');
let amf = await getData('http://www.nzxfutures.com/dairy/quotes/amf?locale=cn');
let btr = await getData('http://www.nzxfutures.com/dairy/quotes/btr?locale=cn');
// let mkp = await getData('http://www.nzxfutures.com/dairy/quotes/mkp?locale=cn');

let month_series = Object.keys(wmp);

let html = '<table><tr><th>名称/月份</th>';
for(let m of month_series){
    html += '<th>' + m + '</th>';
}
html += '</tr>';

html += dict2line(wmp, month_series, '全脂粉');
html += dict2line(smp, month_series, '脱脂粉');
html += dict2line(amf, month_series, '无水油');
html += dict2line(btr, month_series, '黄油');
// html += dict2line(mkp, month_series, 'MKP FUTURES');

html += '</table>';
return {'show':html};
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