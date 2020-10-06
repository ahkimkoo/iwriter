const cors = require('cors');
const mongo = require('../../lib/mongo-ndbc.js');
const stringUtil = require('../../lib/string-util.js');
const textHelper = require('../../processer/text-helper.js');
const crawler = require('../../processer/crawler.js');
const DynamicConfig = require('../../lib/DynamicConfig.js');

module.exports = function (router, settings) {
	let datascol = new mongo.MongoCollection(settings['mongo_connect_url'], 'datas', 5);
	let rulescol = new mongo.MongoCollection(settings['mongo_connect_url'], 'rules', 5);
	let data_zone = new DynamicConfig.Instance('data_zone', 300);

	const loadrule = async (id) => {
		return new Promise(resolve=>{
			rulescol.get(id, ['name','category','schedule_start','schedule_peroid'], result => {
	        	resolve(result);
	        });
		});
	}

	router.get('/provider/get/:rule', cors(), function (req, res) {
		let rule = req.params.rule;
		let version = req.query.version;
		let pageSize = parseInt(req.query.pagesize || 20);
	    let pageNumber = parseInt(req.query.pagenum || 1);
	    if (pageNumber < 1) pageNumber = 1;
	    let query = {'rule':rule};
	    if(version)query['version'] = version;

	    loadrule(rule).then(
    		rule_data => {
    			datascol.find(query, null, {"updated" : -1}, pageSize, pageNumber, result => {
    				result['list'] = result['list'].map(x=>{
    					['name', 'rule', 'category'].forEach(e => delete x[e]);
    					x['created'] = stringUtil.dateFormat(x['created'], 'yyyy-MM-dd hh:mm:ss');
    					x['updated'] = stringUtil.dateFormat(x['updated'], 'yyyy-MM-dd hh:mm:ss');
    					return x;
    				});
    				rule_data['schedule_start'] = stringUtil.dateFormat(rule_data['schedule_start'], 'yyyy-MM-dd hh:mm:ss');
			        res.jsonp({
			        	'meta' : rule_data,
			        	'data' : result
			        });
			    });
	    		}
	    	);
	});

	router.get('/provider/show/:rule', cors(), function (req, res) {
		let rule = req.params.rule;
		let version = req.query.version;
		let bind = req.query.bind;

	    let query = {'rule':rule};
	    if(version)query['version'] = version;

		datascol.find(query, null, {"updated" : -1}, 1, 1, result => {
			let final_result = '';
			if(result['list'].length>0){
				let doc = result['list'][0];
				final_result = doc['show'] || doc['message'];
			}
			res.set('Content-Type', 'application/javascript');
			if(bind){
				res.send('var iw_pk_doc = document.getElementById("'+bind+'");\nif(iw_pk_doc){\niw_pk_doc.innerHTML = \''+final_result.replace(/[\r\n]+/g,'\\n')+'\';\n}');
			}else{
				res.send('document.write(\''+final_result.replace(/[\r\n]+/g,'\\n')+'\');');
			}
	    });
	});

	router.all('/provider/call/:rule', cors(), function (req, res) {
		let rule = req.params.rule;
		let parameters = req.method == 'GET' ? req.query : req.body;

		crawler.crawl(rule, true, parameters).then(val=>{
			ret = val[0];
			if(ret && typeof ret != 'object')ret = {'result':ret}
			res.jsonp(ret || {});
		});
	});

	router.get('/provider/try', cors(), function(req, res){
		data_zone.get().then(data_zone_ret=>{
    		let datazones = data_zone_ret ? data_zone_ret['data_zone'] : [];
	        res.render('provider/try',{'url_prefix' : req.protocol + "://" + req.get('host'), 'data_zone': datazones});
	    });
	});

	router.post('/provider/ajax/rules', cors(), function(req, res){
		let category = req.body.category;
		let query = (category && category!='ALL') ? {'category':category} : {};
		rulescol.find(query, ['name','code'], {'updated':-1}, 1000, 1, result => {
			res.jsonp(result['list'].map(x=>{
				if(x['code']){
					let mched = x['code'].match(/\/\*([\s\S]*?)\*\//);
					x['code'] = (mched && mched.length > 1) ? mched[1] : '';
				}else x['code'] = '';
				return x;
			}));
		});
	});
}