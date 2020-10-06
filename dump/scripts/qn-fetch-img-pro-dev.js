const crawler = require('../../processer/crawler.js');
const RULE_ID = 'qn-fetch-img';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const fetch = (url='',bucket='feheadline', prefix='cont-img/', filename='', img_prefix='http://qn-cover.feheadline.com/', ak='Z76u-LeKQZPieLACb62ZVcMv-W0ZfpS6nzvio7MC', sk='W5H-WPtvOVxDTtIK0rJZ3jCRt1kQjXc79RubuyPx')=>{
    let qn_mac = new qiniu.auth.digest.Mac(ak, sk);
    let qn_config = new qiniu.conf.Config();
    let bucketManager = new qiniu.rs.BucketManager(qn_mac, qn_config);
    let file_ext = '.png';
    let fpos = url.lastIndexOf('.');
    
    if(fpos>0){
        let t_ext = url.substring(fpos);
        if(t_ext.length<=5)file_ext = t_ext;
    }
    
    let key = prefix + (filename||(crypto.createHash('md5').update(url).digest('hex')+file_ext));
    return new Promise(resolve=>{
        bucketManager.fetch(url, bucket, key, function(err, respBody, respInfo) {
              if (err) {
                resolve(url);
              } else {
                if (respInfo.statusCode == 200) {
                    let key = respBody['key'];
                    resolve(img_prefix+key);
                } else {
                    resolve(url);
                }
              }
        });
    });
}

return fetch;
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