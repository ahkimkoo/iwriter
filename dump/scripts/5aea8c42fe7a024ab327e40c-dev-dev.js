const crawler = require('../../processer/crawler.js');
const RULE_ID = '5aea8c42fe7a024ab327e40c';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let docq = async (date) =>{
    let doc = await getDocument(`http://www.chinaclear.cn/cms-search/view.action?action=china&dateStr=${dateFormat(date,'yyyy.MM.dd')}`);
    if(doc && doc.text().indexOf('没有找到相关信息，请检查查询条件')<0 ){
        let date_str = doc('.fl').eq(0).text();
        let fm = parseInt(date_str.substring(16,18));
        let fd = parseInt(date_str.substring(19,21));
        let em = parseInt(date_str.substring(27,29));
        let ed = parseInt(date_str.substring(30,32));
        let val = parseFloat(doc('table table tr:nth-child(2)>td:nth-child(2)').text().trim()).toFixed(2);
        return [fm,fd,em,ed,val];
    }else return null;
}

let l1data, l2data;
for(let i=0; i<10; i++){
    let friday = lookForPreviousNDay(5,i);
    let qdata = await docq(friday);
    if(qdata){
        if(!l1data)l1data = qdata;
        else if(!l2data)l2data = qdata;
        else break;
    }
}

if(l1data && l2data){
    let datestr = `${l1data[0]}.${l1data[1]}－${l1data[2]}.${l1data[3]}`;
    let change_syntax = quoteChangeSyntax(l2data[4], l1data[4], '上升', '下降',2);
    return {
        '$version':`${l1data[2]}.${l1data[3]}`,
        'amount':l1data[4], 
        'message':`中登公司：上周（${datestr}），新增投资者数${l1data[4]}万，环比${change_syntax}。`
    };
}else return null
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