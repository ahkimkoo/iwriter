const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Electronic Component';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		    const getPageInfo = function (page) {
            return {
                itemNames : page('.list h2 a'),
                itemCategories : page('.list ul li:nth-child(1)'),
                itemModelNos : page('.list ul li:nth-child(2)'),
                itemPrices : page('.list span h3 a'),
                noItems : page('.list h2 a').length,
            }
        };

        const getPagePromise = function (pageUrl) {
            const promise = new Promise (function (resolve, reject) {
                const listPage = getDocument(pageUrl,{
                    encoding:'gb2312',
                });
                if (listPage) {resolve(listPage);}
            });
            return promise;
        };
        // ------ above are some helper functions ------ //

        const result = {};
        const urlBase = 'http://product.yesky.com/electronic/';
        const subpageUrlBase = 'list$.html#page';
        const listPage = await getDocument(urlBase,{
            encoding:'gb2312',
        });

        let htmlTemplate = '<table border="1"> <tr> <th>产品名称</th> <th>产品类别</th> <th>产品型号</th> <th>最新价格</th> </tr> ';
        // add all 50 pages
        const pageUrls = [];
        pageUrls.push(urlBase);
        for (let y = 2;y<=50;y++){
            pageUrls.push(urlBase+subpageUrlBase.replace('
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
})();,y));
    }
    const promises = pageUrls.map( (item)=> {
        return getPagePromise(item);
    });

    let pages = await Promise.all(promises);
    for (let page of pages){
        let pageInfo= getPageInfo(page);
        for (let x =0;x<pageInfo.noItems;x++){
            htmlTemplate += `<tr> <td>${pageInfo.itemNames.eq(x).text()}</td> <td>${pageInfo.itemCategories.eq(x).text().substring(5)}</td> <td>${pageInfo.itemModelNos.eq(x).text().substring(5)}</td> <td>${pageInfo.itemPrices.eq(x).text()}</td> </tr>`;
        }
    }

    htmlTemplate += '</table>';
    result.show= htmlTemplate;
    return result;
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