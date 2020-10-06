const crawler = require('../../processer/crawler.js');
const RULE_ID = 'chemistry';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const findLink = async(keyword)=>{
    let doc = await getDocument('http://top.100ppi.com/');
    if(doc){
        let navlinks = doc('.top_linka a');
        let link = null;
        navlinks.each((idx,ele)=>{
            let sele = doc(ele);
            if(sele.text()==keyword) {
               link = sele.attr('href');
               return false;
            }
        });
        return link;
    }return null
}

const takeSnapshot = async()=>{
    //let link = await findLink('化工榜');
    let link = 'http://top.100ppi.com/zdb/detail-day---14.html';
    if(link){
        let image_link = await snapshotByElement(link, 'table', 'table', [0, 0, 0, 0], 'url');
        if(image_link)return {'show':'<img src="'+image_link+'" />'}
        else return null;
    }else return null
}

return await takeSnapshot();
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