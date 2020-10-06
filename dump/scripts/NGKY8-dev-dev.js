const crawler = require('../../processer/crawler.js');
const RULE_ID = 'NGKY8';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const getLinks = async (seed_url, limit)=>{
   let links = await getChromeDocument(seed_url,'div#ToSwitch', {
        'evaluate':`(function(limit){
            let links = [];
            document.querySelectorAll('#bang-nav a').forEach(ele=>{
                if(!ele.getAttribute('href').startsWith('javascript')){
                    let href = ele.href.replace('#ToSwitch','') + '&rank=brand&type=up&s=';
                    for(let i=0; i<limit; i+=20){
                        links.push(href+i);
                    }
                }
            });
            return links;
        })(${limit})`
    }); 
    return links;
}

const getBrands = async (url) =>{
    let brands = await getChromeDocument(url,'div#ToSwitch', {
        'evaluate':function(){
            let brands = {};
            document.querySelectorAll('#bang-wbang ul li').forEach((ele,idx)=>{
                if(idx>0){
                    let title = ele.querySelector('.title').innerText.trim();
                    let score = parseFloat(ele.querySelector('.num').innerText.trim());
                    brands[title] = score
                }
            });
            return brands;
        }
    }); 
    return brands;
}

const mergeBrands = (baseBrands, brandList) =>{
    for(let newBrands of brandList){
        for(let k of Object.keys(newBrands)){
            if(baseBrands.hasOwnProperty(k)){
                baseBrands[k] = baseBrands[k] + newBrands[k];
            }else baseBrands[k] = newBrands[k];
        }
    }
    return baseBrands;
}

const array2table = (arr, header) =>{
    let html = '<table>';
    if(header && header.length == arr[0].length){
        html += '<tr>';
        for(let h of header){
            html += '<th>'+h+'</th>';
        }
        html += '</tr>';
    }
    for(let a of arr){
        html += '<tr>';
        for(let v of a){
            html += '<td>'+v+'</td>';
        }
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

const getBrandsRank = async(seed_url, limit) =>{
    let links = await getLinks(seed_url,100);
    let brands = {};
    let ps = [];
    for(let i=0; i<links.length; i++){
        let l = links[i];
        ps.push(getBrands(l));
        if(i%10 === 0 || i >= links.length-1){
            let brandlist = await Promise.all(ps);
            brands = mergeBrands(brands, brandlist);
            ps = [];
        }
    }
    let brand_arr = [];
    for(let b in brands){
        if(brands.hasOwnProperty(b)){
            brand_arr.push([b, brands[b]]);
        }
    }
    brand_arr.sort((a,b)=>{return b[1] - a[1]});
    let ranked_brand = brand_arr.slice(0, limit).map(x=>{return [x[0],x[1].toFixed(2)]});
    return {
        'data' : ranked_brand,
        'link_count' : links.length,
        'show' : array2table(ranked_brand, ['品牌','关注指数'])
    }
}

return await getBrandsRank('https://top.taobao.com/index.php?topId=TR_SP&leafId=50008055&rank=brand&type=up&s=0', 20);

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