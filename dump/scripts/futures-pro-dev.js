const crawler = require('../../processer/crawler.js');
const RULE_ID = 'futures';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		//coder：姜文浩
const getFutureData = async() =>{
  const futures = ['IF','IC','IH','TS','TF','T']
  let futureData = []
  const getData = (future) =>{
    return new Promise((resolve,reject) =>{
      request.post('http://www.cffex.com.cn/quote_'+future+'.txt', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let data = body.split('\n')
          data.splice(0,1)
          data.splice(data.length - 1,1)
          for(var i=0;i<data.length;i++){
            //console.log(typeof(data[i]))
            data[i] = data[i].split(",");
        }
          resolve(data)
        }
      })
    })
  } 

  for (const future of futures) {
    let data = await getData(future)
    futureData = futureData.concat(data)
  }
  //console.log(futureData)
  return futureData
}

let data = await getFutureData()

const createTable=(data, name)=>{
    let html='<table> <caption>'+ name +'</caption>';
    html+='<tr><th>'+'合约名称'+'</th><th>'+'开盘价'+'</th><th>'+'最高价'+'</th><th>'+'最低价'+'</th><th>'+'最新价'+'</th><th>'+'涨跌'+'</th><th>'+'买价'+'</th><th>'+'买量'+'</th><th>'+'卖价'+'</th><th>'+'卖量'+'</th><th>'+'成交量'+'</th><th>'+'持仓量'+'</th></tr>'
    for (i=1; i<data.length; i++){
        html+='<tr><td>'+data[i][0]+'</td><td>'+data[i][1]+'</td><td>'+data[i][2]+'</td><td>'+data[i][3]+'</td><td>'+data[i][4]+'</td><td style="'
        if (data[i][5].indexOf('-')!=-1){
            html+='color: green;'
        }else{
            html+='color: red;'
        }
        
        html+= '">'+data[i][5]+'</td><td>'+data[i][6]+'</td><td>'+data[i][7]+'</td><td>'+data[i][8]+'</td><td>'+data[i][9]+'</td><td>'+data[i][10]+'</td><td>'+data[i][11]+'</td></tr>'
    }
    html+='</table>'
    return html
    
}
result=createTable(data,YEAR+'-'+MONTH+'-'+DATE+' '+HOUR+'时 期货整点报价-(延时行情-延时15分钟)')
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