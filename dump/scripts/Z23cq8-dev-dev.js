const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z23cq8';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let doc = await getBrowserDocument('http://www.100ppi.com/price/list-18-1.html');
let result = null;

const getData= ()=>{
    let data = null;
    if (doc){
         let priceList=[]
        // let priceListShow=[]
        doc('.band-dl .clearfix').each((i,ele)=>{
            let item =doc(ele).text().trim().replace(' ', '').split('\n')
            priceList[i]=item
        })
        data = priceList;
    }
    return data;
}



const createTable = (dataList, name)=>{
    let html = '<table>'+ '<caption>'+ name+'</caption>';
    html+='<tr>'+'<th>'+ dataList[0][0] + '</th> <th>'+ dataList[0][1] + '</th> <th>'+dataList[0][2] +'</th>'+'</tr>'
    
    for(let i =1; i<dataList.length; i++){
        html+='<tr>'+'<td>'+ dataList[i][0] + '</td> <td style="text-align: center">'+dataList[i][1] + '</td> <td style="'
        if (/\+/.test(dataList[i][2])){
            html+='color: red;'
        }else if(/-/.test(dataList[i][2])){
            html+='color: green;'
        }
        html+= 'text-align: center">'+dataList[i][2]+'</td>'+'</tr>'
    } 
    html+='</table>';
    return html;
}

result=createTable(getData(),doc('.band-hd .fr').text()+ ' 农副产品报价')


return {'show':result}
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