const crawler = require('../../processer/crawler.js');
const RULE_ID = '10jqka-stock';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getPageCount = async () => {
    let doc = await getDocument('http://q.10jqka.com.cn/');
    return parseInt(doc('#m-page>a:last-of-type').eq(0).attr('page'));
}

const getStockList = async (page) =>{
    let stocks = await getChromeDocument(
        'http://q.10jqka.com.cn/index/index/board/all/field/zdf/order/desc/page/'+page+'/ajax/1/',
        '//th[contains(text(),"加自选")]',
        {
            'encoding':'gbk',
            'nocookie': true,
            'evaluate':function(){
                let rows = document.querySelectorAll('table.m-table>tbody>tr');
                if(rows && rows.length>0){
                    let data = [];
                    for(let row of rows){
                        data.push({
                            'code': row.querySelector('td:nth-of-type(2)').innerText,
                            'name': row.querySelector('td:nth-of-type(3)').innerText
                        });
                    }
                    return data;
                }else return [];
            }
        }
        );
        
    for(let stock of stocks){
        let json = await getJson('https://basic.10jqka.com.cn/api/stockph/conceptdetail/'+stock['code']+'/');
        stock['concept'] = json.data ? json.data.map(x=>{return x.title}) : []
    }
    
    return stocks;
}


const getAllStocks = async () => {
    let page_count = await getPageCount();
    let stocks = {};
    for(let i=1; i<=10; i++){
        //if(i%5==0)await sleep(1000);
        let stock_in_page = await getStockList(i);
        stocks = stock_in_page.reduce((dct,itm)=>{
            dct[itm['code']] = itm;
            return dct;
        },stocks);
    }
    return stocks;
}

var prev = await getLastValues(RULE);//获得上一版本数据
var prev_stocks = {};//上一版本个股数据
var prev_concepts = {};//上一版本概念

if(prev && prev['stocks']){
    prev_stocks = prev['stocks'];
    for(let stock in prev_stocks){
        if(prev_stocks.hasOwnProperty(stock) && prev_stocks[stock]['concept']){
            for(let c of prev_stocks[stock]['concept']){
                if(!prev_concepts.hasOwnProperty(c))prev_concepts[c] = true;
            }
        }
    }
}

var curr_stocks = await getAllStocks();//重新抓取股票数据
var curr_concepts = {};//抓取数据中涉及的概念
for(let stock in curr_stocks){
    if(curr_stocks.hasOwnProperty(stock) && curr_stocks[stock]['concept']){
        for(let c of curr_stocks[stock]['concept']){
            if(!curr_concepts.hasOwnProperty(c))curr_concepts[c] = true;
        }
    }
}

var new_concept = {};//新概念
for(let c of Object.keys(curr_concepts)){
    if(!prev_concepts.hasOwnProperty(c))new_concept[c] = true;
}

var new_stock = [];//新股票
var changed_stock = [];//变更的股票
for(let s of Object.keys(curr_stocks)){
    let cur_ccpt = curr_stocks[s]['concept'].join(',');
    if(prev_stocks.hasOwnProperty(s)){
        let pre_ccpt = prev_stocks[s]['concept'].join(',');
        if(pre_ccpt != cur_ccpt){
            changed_stock.push([
                    curr_stocks[s]['code'],
                    curr_stocks[s]['name'],
                    pre_ccpt,
                    cur_ccpt
                ]);
        }
    }else{
        new_stock.push([
                curr_stocks[s]['code'],
                curr_stocks[s]['name'],
                cur_ccpt
            ]);
    }
}

var html = '';

let new_concept_list = Object.keys(new_concept);
if(new_concept_list.length>0){
    html += '<h2>新概念</h2><ul>';
    for(let c of new_concept_list)html += '<li>'+c+'</li>';
    html += '</ul>';
}

if(new_stock.length>0){
    let tb_arr = [['代码','名称','概念']].concat(new_stock);
    html += '<h2>新股票</h2>';
    html += array2table(tb_arr, true, 'stocktable');
}

if(changed_stock.length>0){
    let tb_arr = [['代码','名称','原概念','新概念']].concat(changed_stock);
    html += '<h2>变更股票</h2>';
    html += array2table(tb_arr, true, 'stocktable');
}


return {
    'show' : html||'无变化',
    'stocks': curr_stocks
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