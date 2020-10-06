const crawler = require('../../processer/crawler.js');
const RULE_ID = 'food2';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		function createTable(data,row,column){
        var tableData = '<table>';
        for(let j = 0 ; j < row ; j++) {
            tableData += '<tr>';
            for (let i = 0; i < column; i++) {
                tableData += '<td>' + data[j*column + i] + '</td>';
            }
            tableData += '</tr>';
        }
        tableData += '</table>';
        return tableData;
    }
    function handleNum(data){
        let num = data/1000000000000;
        if(num < 1){
            num = num * 10000;
            return num.toFixed(0) + '亿'
        }
        return num.toFixed(2) + '万亿';
    }

    let industry = '食品饮料';
    const reg = new RegExp(industry,'i');
    let findwine = false;
    let alltext = "";
    let a = await getChromeDocument('http://quote.eastmoney.com/center/boardlist.html?st=ChangePercent&sortRule=0#industry_board');
    let web = cheerio.load(a);
    let pages = web('.paginate_page a').length;
    let now = new Date().getTime();

    for(let page = 1 ; page <= pages ; page ++){
        let url = 'http://nufm.dfcfw.com/EM_Finance2014NumericApplication/JS.aspx?cb=jQuery112401224246743905848_1544751454239&type=CT&token=4f1862fc3b5e77c150a2b985b12db0fd&sty=FPGBKI&js=(%7Bdata%3A%5B(x)%5D%2CrecordsFiltered%3A(tot)%7D)&cmd=C._BKHY&st=(ChangePercent)&sr=-1&p='+page+'&ps=20&_=${now}';
        const doc = await getDocument(url);
        let temp = doc.text();
        if (reg.test(temp)) {
            alltext = temp;
            break;
        }
    }
    let list = alltext.split(',');
    let index = list.indexOf(industry);
    let targetData = [];
    targetData[0] ='板块名称';
    targetData[1] ='最新价';
    targetData[2] ='涨跌额';
    targetData[3] ='涨跌幅';
    targetData[4] ='总市值';
    targetData[5] ='换手率';
    targetData[6] = industry;
    targetData[7] = list[index + 16];
    targetData[8] = list[index + 17].replace('"','');
    targetData[9] = list[index + 1]+'%';
    targetData[10] = handleNum(list[index + 2]);
    targetData[11] = list[index + 3] + '%';
    let result = createTable(targetData,2,6);

    return {
        'show' : result
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