const crawler = require('../../processer/crawler.js');
const RULE_ID = '27QKCe';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let MongoClient = mongodb.MongoClient;

return new Promise(resolve=>{
    MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
        if(err)resolve(null);
        else{
            let db = client.db('feheadline');
            let collection = db.collection('topics');
            collection.find({'sorttype':'hct','category':'default'},{"data":{"$slice":20},"updated":1,"data.articles":{"$slice":3},"data.articles.title":1,"data.title":1}).sort({'updated':-1}).limit(1).toArray(async (err, docs)=>{
                client.close();
                if(!err && docs.length>0){
                    let doc = docs[0];
                    let show = '<ol>';
                    let now = doc['updated'];
                    let tnow = new Date(now.getTime()-(8*3600*1000));
                    if(new Date().getTime() - tnow.getTime() <= (4*3600*1000)){
                        let mq_msg = `☑财经热点（${dateFormat(tnow, 'M月d日hh:mm')}）\n`;
                        for(let i=0; i< doc['data'].length; i++){
                            let topic = doc['data'][i];
                            show += '<li>';
                            show += '<p>'+topic['title']+'</p>';
                            mq_msg += '\n●'+topic['title'];
                            if(i<3){
                                let articles = topic['articles'].map(x=>{return x['title']});
                                articles.sort((a,b)=>{
                                    return b.length - a.length;
                                });
                                show += '<p>'+articles[0]+'</p>';
                                mq_msg += '\n'+articles[0];
                            }
                            show += '</li>';
                        }
                        show += '</ol>';
                        mq_msg += '\n\n详见：http://t.cn/R1htplh';
                        await sendMQ('amqp://fenews:fenews@rabbit-crawler.feheadline.net:5672/fenews','iw_ex',{'to':'热点追击','message':mq_msg});
                        resolve({
                            'show' : show
                        });
                    }else resolve(null);
                }else resolve(null);
            });
        }
    });
});
    
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