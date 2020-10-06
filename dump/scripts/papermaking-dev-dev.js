const crawler = require('../../processer/crawler.js');
const RULE_ID = 'papermaking';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const date = `${YEAR}-${MONTH}-${DATE}`;

//根据json对象生成css描述
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
const getTableData = async(url, selector, filter_rule=[]) => {
    let doc = await getDocument(url);
    let odata = table2array(doc, selector);
    if(odata){
        return odata.filter(x=>{
            let bol = true;
            for(let r of filter_rule){
                let v;
                if(typeof r['index'] == 'function'){
                    v = r['index'](x);
                }else v = x[r['index']||0];
                if(r['values'].indexOf(v)<0){
                    bol = false;
                    break;
                }
            }
            return bol;
        });
    }return null;
}

const getItemsPrice = async(url, name_filter, filter_fn, name_fn)=>{
    let data_array = await getTableData(url, '.lp-table', [{'index':5,'values':[date]}, {'index':filter_fn, 'values': name_filter}]);
    if(data_array){
        let day_ago_data = await getPreviousNValues(RULE, 1);
        let week_ago_data = await getPreviousNValues(RULE, 5);
        let month_ago_data = await getPreviousNValues(RULE, 22);
        let year_ago_data = await getPreviousNValues(RULE, 250);
        
        return data_array.reduce((obj, line)=>{
            let name = typeof name_fn == 'function' ? name_fn(line) : line[name_fn||0];
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
    ['http://paper.100ppi.com/price/', ['嘉盛纸业：河南','兆美纸业','锦新纸业'], '纸张（瓦楞纸：出厂价）', function(l){return l[0]+(l[4]?'：'+l[4]:'')}, function(l){return l[0]+(l[4]?'：'+l[4]:'')}],
    ['http://fz.100ppi.com/price/', ['广东废纸','福建废纸','浙江废纸','山东废纸','河南废纸','河北废纸'], '废纸（黄板纸：市场价）', 0, 0],
    ['http://woodpulp.100ppi.com/price/', ['针叶木浆：山东太康：智利','针叶木浆：东建浆纸：加拿大','针叶木浆：青岛宝通：瑞典','针叶木浆：山东道欣：美国','阔叶木浆：嘉丰益：加拿大','阔叶木浆：东建浆纸：巴西','阔叶木浆：青岛宝通：印尼','阔叶木浆：山东道欣：智利','化机浆：山东轻工业：瑞典','本色浆：山东道欣：智利'], '木浆（经销价）', function(l){return l[3].replace('分类:','').replace('工艺:','')+'：'+l[0]+'：'+l[4]}, function(l){return l[3].replace('分类:','').replace('工艺:','')+'：'+l[0]+'：'+l[4]}]
    ]

var result = {};
var show = '';

let sample;

for(let i=0;i<entities.length;i++){
    let e = entities[i];
    let pdata = await getItemsPrice(e[0], e[1], e[3], e[4]);
    if(pdata){
        if(!sample)sample = takeSample(pdata, e[1]);
        if(sample){
            if(i==0)show += '<table class="x-vd-duu">';
            let valid_field = ['name', 'price'];
            if(sample.hasOwnProperty('day_change'))valid_field.push('day_change');
            if(sample.hasOwnProperty('week_change'))valid_field.push('week_change');
            if(sample.hasOwnProperty('month_change'))valid_field.push('month_change');
            if(sample.hasOwnProperty('year_change'))valid_field.push('year_change');
            let head_field = [e[2],'最新价（元/吨）','日涨幅','周涨幅','月涨幅','年涨幅'];
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