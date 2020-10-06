const crawler = require('../../processer/crawler.js');
const RULE_ID = 'glass-cement';
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

//filter_rule: [{'index':1,'values':['value1','value2']}]
const getTableData = async(url, selector,filter_rule=[]) => {
    let doc = await getDocument(url);
    let odata = table2array(doc, selector);
    if(odata){
        return odata.filter(x=>{
            let bol = true;
            for(let r of filter_rule){
                if(r['values'].indexOf(x[r['index']])<0){
                    bol = false;
                    break;
                }
            }
            return bol;
        });
    }return null;
}

const getItemsPrice = async(url, name_filter, date)=>{
    let data_array = await getTableData(url, '.lp-table', [{'index':5,'values':[`${date}`]}, {'index':0,'values': name_filter}]);
    if(data_array){
        let day_ago_data = await getPreviousNValues(RULE, 1);
        let week_ago_data = await getPreviousNValues(RULE, 5);
        let month_ago_data = await getPreviousNValues(RULE, 22);
        let year_ago_data = await getPreviousNValues(RULE, 250);
        
        return data_array.reduce((obj, line)=>{
            let name = line[0];
            let price = parseFloat(line[2].replace(/([\d\.]+)/g,'$1'));
            let unit = line[2].replace(/^[\d\.]+(.*)$/g,'$1');
            let result = {
                'name': name,
                'price': price,
                'unit' : unit
            }
            
            let day_change = day_ago_data[name] ? (price / day_ago_data[name]['price'] - 1) : null;
            let week_change = week_ago_data[name] ? (price / week_ago_data[name]['price'] - 1) : null;
            let month_change = month_ago_data[name] ? (price / month_ago_data[name]['price'] - 1) : null;
            let year_change = year_ago_data[name] ? (price / year_ago_data[name]['price'] - 1) : null;
            //result['yesterday_price'] = day_ago_data[name]['price'];
            if(day_change!==null)result['day_change'] = day_change;
            if(week_change!==null)result['week_change'] = week_change;
            if(month_change!==null)result['month_change'] = month_change;
            if(year_change!==null)result['year_change'] = year_change;
            
            obj[name] = result;
            return obj;
        },{});
    }else return null;
}

const constructTr = (data, name, valid_field, obj) => {
    let ov = data[name];
    if(ov){
        let html = '<tr>';
        for(let f of valid_field){
            let kv = ov[f];
            if(typeof kv != 'undefined'){
                if(f == 'price')kv = parseFloat(ov[f]).toLocaleString(undefined,{'minimumFractionDigits':2,'maximumFractionDigits':2});
                else if(f.endsWith('change')){
                    let color = kv == 0 ? 'black' : (kv > 0 ? 'red' : 'green');
                    kv = '<span style="color:'+color+'">'+(parseFloat(kv)*100).toFixed(2)+'%</span>';
                }
            }else kv = '';
            html += '<td>'+kv+'</td>';
        }
        html += '</tr>';
        let oov = Object.assign({}, ov);
        delete oov['name'];
        delete oov['date'];
        obj[name] = oov;
        return html;
    }else return '';
}

const takeSample =(data, names) => {
    let ret;
    for(let k of names){
        if(data[k]){
            ret = data[k];
            break;
        }
    }
    return ret;
} 

var entities = [
    ['http://cement.100ppi.com/price/', ['安徽水泥','江苏水泥','山东水泥','福建水泥','浙江水泥','上海水泥'], '水泥（市场价：元/吨）'],
    ['http://glass.100ppi.com/price/', ['金晶科技','安全玻璃','河北迎新','元华浮法','德金玻璃'], '玻璃（市场价：元/㎡）']
    ]

var result = {};
var show = '';
let date = `${YEAR}-${MONTH}-${DATE}`;
// let date = `2018-09-05`;

var sample;

for(let i=0;i<entities.length;i++){
    let e = entities[i];
    let pdata = await getItemsPrice(e[0], e[1], date);
    if(!sample){
        sample = takeSample(pdata, e[1]);
        show += '<table class="x-vd-duu">';
    }
    if(!sample)continue;
    let valid_field = ['name', 'price'];
    if(sample.hasOwnProperty('day_change'))valid_field.push('day_change');
    if(sample.hasOwnProperty('week_change'))valid_field.push('week_change');
    if(sample.hasOwnProperty('month_change'))valid_field.push('month_change');
    if(sample.hasOwnProperty('year_change'))valid_field.push('year_change');
    let head_field = [e[2],'最新价','日涨幅','周涨幅','月涨幅','年涨幅'];
    show += '<tr>';
    for(let i=0;i<valid_field.length;i++){
        show += '<th style="color:white;background-color:#cc6600">'+head_field[i]+'</th>';
    }
    show += '</tr>';
    show += e[1].map(x=>{return constructTr(pdata, x, valid_field, result)}).join('');
    show += '</tr>';
    if(i>=entities.length-1){
        show += '<tr align="right"><td colspan="'+(valid_field.length)+'" style="color:white;background-color:#cc6600">截止日期：'+date+'</td></tr>';
        show += '</table>';
    }
}

if(show){
    result['show'] = jsonStyle({'.x-vd-duu tr:nth-child(even)>td':{'background-color':'#eee'}})+show;
    result['$version'] = date; 
    return result;
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