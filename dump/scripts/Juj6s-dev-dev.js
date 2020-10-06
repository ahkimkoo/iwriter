const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Juj6s';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let cffex= await getBrowserDocument('http://www.cffex.com.cn/');

let result=[]

const getData= ()=>{
    let data =[]
    for(let i =1; i<5; i++){
        let ele=[]
        for(var j of ['a','b','c','d']){
            let res=cffex(`.main_ul li:nth-child(${i}) .jrie${j}`).text()
            ele.push(res)
        }
        data.push(ele)
    }
    return data
}


const createTable=(data, name)=>{
    let html='<table> <caption>'+ name +'</caption>';
    html+='<tr><th>'+data[0][0]+'</th><th>'+data[0][1]+'</th><th>'+data[0][2]+'</th><th>'+data[0][3]+'</th></tr>'
    for (i=1; i<data.length; i++){
        html+='<tr><td>'+data[i][0]+'</td><td>'+data[i][1]+'</td><td style="'
        if (/↓/.test(data[i][2])){
            html+='color: green;'
        }else if(/↑/.test(data[i][2])){
            html+='color: red;'
        }
        
        html+= '">'+data[i][2]+'</td><td>'+data[i][3]+'</td></tr>'
    }
    html+='</table>'
    return html
    
}
// result=cffex('.main_ul li:nth-child(4) .jried').text()//.replace(/\t/ig,'').split('\n')

result=createTable(getData(),cffex('.input_date').text()+ ' 股指期货报价')

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