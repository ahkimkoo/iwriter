const crawler = require('../../processer/crawler.js');
const RULE_ID = 'ZaVsVr';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const md5 = (str) => {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

const genCode = (now) =>{
    let str = `${now.getMinutes()}${now.getDate()}${now.getHours()}`;
    return md5(str);
}

const getLastestMatch = function(){
    return new Promise((resolve, reject) => {
        request.post({url:'http://feapi.feheadline.com/provider/api/v1/show-last-stockbetting',json:{
            "access_token":genCode(new Date())
            }},(err,response,resBody)=>{
            if(!err && resBody && resBody['match_id']){
                resolve(resBody['match_id']);
            } else {
                reject('未获取match_id');
            }
        })
    })
}

const setOriginalCount = function(count,bet_object,match_id){
    return new Promise((resolve, reject) => {
        request.post({
            "url":"http://feapi.feheadline.com/provider/api/v1/user-bet-stock",
            "json":{
                "user_id":3705521,
                "bet_obj":bet_object,
                "bet_count":count,
                "access_token":genCode(new Date()),
                "match_id":match_id
            }
        },(err,response,resBody)=>{
            resolve();
        })
    })
}

const wholeTask = async function(){
    let bet_content_config = [
        "sh000001_rise",
        "sh000001_fall",
        "sz399001_rise",
        "sz399001_fall",
        "sz399006_rise",
        "sz399006_fall"
    ];
    let match_id = await getLastestMatch();
    if(new Date().getDay()!=0 && new Date().getDay()!=6){
        for(let k of bet_content_config){
            await setOriginalCount(parseInt(Math.random()*1000)+1500,k,match_id);
        }
    }
    return 'success';
}
return await wholeTask();
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