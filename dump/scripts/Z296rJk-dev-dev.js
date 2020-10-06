const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z296rJk';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		//根据json对象省城css描述
const jsonCss = (selector, attributes) => {
    let html = '\n';
    html += selector+'{\n';
    for(let a in attributes){
        if(attributes.hasOwnProperty(a)){
            html += a+':'+attributes[a]+';\n';
        }
    }
    html += '}\n';
    return html;
}
//根据json对象封装style标签
const jsonStyle = (json) => {
    let html = '<style>';
    for(let j in json){
        if(json.hasOwnProperty(j)){
            html += jsonCss(j, json[j]);
        }
    }
    html += '</style>';
    return html;
}

let doc = await getDocument('http://fdc.fang.com/data/house/',{'encoding':'gbk'});
if(doc){
    let array = table2array(doc, 'table.ltab01:nth-child(1)');
    array[0] = ['主要城市', '成交套数(套)', '成交面积(㎡)', '统计时间'];
    for(let i=1; i<array.length; i++){
        array[i][1] = parseInt(array[i][1]);
        array[i][2] = parseFloat(array[i][2]).toFixed(2);
    }
    let last_data = await getLastValues(RULE, 'DEFAULT');
    if(last_data && last_data['data']){
        array[0].push('涨跌幅');
        for(let i=1;i<array.length;i++){
            let last_value = last_data['data'].filter(x=>{return x[0] == array[i][0]})[0];
            if(last_value){
                if(array[i][3] == last_value[3]){
                    array[i][4] = last_value[4] || '';
                }else{
                    array[i][4] = array[i][2]==0 ? '' : (last_value[2] / array[i][2] - 1).toFixed(2)+'%';
                }
            }else array[i][4] = '';
        }
    }
    return {
        'data' : array,
        'show' : jsonStyle({'.iw_data_num_table tr td':{'text-align':'right'},'.iw_data_num_table tr td:nth-child(1)':{'text-align':'center'}})+array2table(array, true, 'iw_data_table iw_data_num_table')
    };
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