const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Cp0ff';
const PROFILE = 'pro';
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

const getPrice = async(name, url, p_unit)=>{
    let result = null;
    let doc = await getDocument(url);
    if(doc){
        if(url.indexOf('96369.net')>0){
            let date = doc('.mod_tab tr:nth-child(2)>td:nth-child(1)').text();
            let price = parseFloat(doc('.mod_tab tr:nth-child(2)>td:nth-child(2)').text());
            result = {
                    'name' : name,
                    'date' : date,
                    'price' : price,
                    'unit' : p_unit
            }
        }else{
            let hele = doc('ul>li:nth-child(1)>.pr-news-tit');
            let txt = doc(hele.contents().get(url.indexOf('message')>0?0:2)).text();
            if(txt){
                let month = txt.replace(/.*?([\d]+)月.*/g,'$1');
                let date = txt.replace(/.*?([\d]+)日.*/g,'$1');
                let unit = txt.trim().replace(/^.*为[\d\.]+(.*)$/g,'$1');
                if(month.length<2)month = '0' + month;
                if(date.length<2)date = '0' + date;
                let price = parseFloat(txt.replace(/.*为([\d\.]+).*/g,'$1'));
                
                result = {
                    'name' : name,
                    'date' : YEAR + '-' + month + '-' + date,
                    'price' : price,
                    'unit' : unit || p_unit
                }
            }
        }
        if(result){
            let price = result['price'];
            let day_ago_data = await getPreviousNValues(RULE, 1);
            let week_ago_data = await getPreviousNValues(RULE, 5);
            let month_ago_data = await getPreviousNValues(RULE, 22);
            let year_ago_data = await getPreviousNValues(RULE, 250);
            let day_change = day_ago_data[name] ? (price / day_ago_data[name]['price'] - 1) : null;
            let week_change = week_ago_data[name] ? (price / week_ago_data[name]['price'] - 1) : null;
            let month_change = month_ago_data[name] ? (price / month_ago_data[name]['price'] - 1) : null;
            let year_change = year_ago_data[name] ? (price / year_ago_data[name]['price'] - 1) : null;
            //result['yesterday_price'] = day_ago_data[name]['price'];
            if(day_change!==null)result['day_change'] = day_change;
            if(week_change!==null)result['week_change'] = week_change;
            if(month_change!==null)result['month_change'] = month_change;
            if(year_change!==null)result['year_change'] = year_change;
        }
    }
    return result;
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

const entity = [
    ['铜','http://cu.100ppi.com/kx/list--13-1.html','元/吨'],
    ['铝','http://al.100ppi.com/kx/list--13-1.html','元/吨'],
    ['铅','http://pb.100ppi.com/kx/list--13-1.html','元/吨'],
    ['锌','http://zn.100ppi.com/kx/list--13-1.html','元/吨'],
    ['镍','http://ni.100ppi.com/kx/list--13-1.html','元/吨'],
    ['锡','http://sn.100ppi.com/kx/list--13-1.html','元/吨'],
    ['黄金','http://gold.100ppi.com/kx/list--13-1.html','元/克'],
    ['白银','http://silver.100ppi.com/kx/list--13-1.html','元/千克'],
    ['钴','http://co.100ppi.com/kx/list--13-1.html','元/吨'],
    ['金属硅441#','http://jsg.100ppi.com/kx/list--13-1.html','元/吨'],
    ['镁','http://mei.100ppi.com/kx/list--13-1.html','元/吨'],
    ['锑(1#)','http://ti.100ppi.com/kx/list--13-1.html','元/吨'],
    ['钛精矿(攀·46) ','http://www.100ppi.com/kx/detail-message-1627-13-1.html','元/吨'],
    ['氧化钕','http://www.100ppi.com/kx/detail-message-979-13-1.html','元/吨'],
    ['镨钕合金','http://www.100ppi.com/kx/detail-message-982-13-1.html','元/吨'],
    ['镝铁合金','http://www.100ppi.com/kx/detail-message-984-13-1.html','元/吨'],
    ['金属钕','http://www.100ppi.com/kx/detail-message-977-13-1.html','元/吨'],
    ['镨钕氧化物','http://www.100ppi.com/kx/detail-message-1454-13-1.html','元/吨'],
    ['氧化镝','http://www.100ppi.com/kx/detail-message-981-13-1.html','元/吨'],
    ['氧化镨','http://www.100ppi.com/kx/detail-message-980-13-1.html','元/吨'],
    ['金属镝','http://www.100ppi.com/kx/detail-message-978-13-1.html','元/吨'],
    ['金属镨','http://www.100ppi.com/kx/detail-message-976-13-1.html','元/吨']
    ];
    
var price_value = {};

var promises = entity.map(e=>{return getPrice(...e)});

for(let p of await Promise.all(promises)){
    if(p)price_value[p['name']] = p;
}

let sample = price_value[entity[0][0]];
if(sample){
    let result = {};
    let show = '<table class="x-vd-df">';
    let date = sample['date'].replace(/\-/g,'/');
    let valid_field = ['name', 'unit', 'price'];
    if(sample.hasOwnProperty('day_change'))valid_field.push('day_change');
    if(sample.hasOwnProperty('week_change'))valid_field.push('week_change');
    if(sample.hasOwnProperty('month_change'))valid_field.push('month_change');
    if(sample.hasOwnProperty('year_change'))valid_field.push('year_change');
    let head_field = ['基本金属', '单位','最新价','日涨幅','周涨幅','月涨幅','年涨幅'];
    show += '<tr>';
    for(let i=0;i<valid_field.length;i++){
        show += '<th style="color:white;background-color:#cc6600">'+head_field[i]+'</th>';
    }
    show += '</tr>';
    let part_a = entity.slice(0, 8).map(x=>{return x[0]});
    show += part_a.map(x=>{return constructTr(price_value, x, valid_field, result)}).join('');
    //show += '<tr align="left"><td colspan="'+(valid_field.length)+'" style="color:white;background-color:#cc6600">小金属、稀土</td></tr>';
    show += '<tr><td style="color:white;background-color:#cc6600">小金属、稀土</td>';
    for(let i=1;i<valid_field.length;i++){
        show += '<td style="color:white;background-color:#cc6600">'+head_field[i]+'</td>';
    }
    show += '</tr>';
    let part_b = entity.slice(8).map(x=>{return x[0]});
    show += part_b.map(x=>{return constructTr(price_value, x, valid_field, result)}).join('');
    show += '<tr align="right"><td colspan="'+(valid_field.length)+'" style="color:white;background-color:#cc6600">截止日期：'+date+'</td></tr>';
    show += '</table>';
    result['show'] = jsonStyle({'.x-vd-df tr:nth-child(even)>td':{'background-color':'#eee'}})+show;
    result['$version'] = sample['date'];
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