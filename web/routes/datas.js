const mongo = require('../../lib/mongo-ndbc.js');
const stringUtil = require('../../lib/string-util.js');
const textHelper = require('../../processer/text-helper.js');
const crawler = require('../../processer/crawler.js');
const DynamicConfig = require('../../lib/DynamicConfig.js');

module.exports = function (router, settings) {
	let logger = settings.logger;
	let datascol = new mongo.MongoCollection(settings['mongo_connect_url'], 'datas', 5);
	let rulescol = new mongo.MongoCollection(settings['mongo_connect_url'], 'rules', 5);

	const loadrule = async (id) => {
		return new Promise(resolve=>{
			rulescol.get(id, ['name','category','schedule_start','schedule_peroid'], result => {
	        	resolve(result);
	        });
		});
	}

	let title = '数据';
	let uri_prefix = '/datas/';

	let data_zone = new DynamicConfig.Instance('data_zone', 300);

	router.get(uri_prefix + 'list', function (req, res) {
	    let match_phrase = {"valid":{"$ne":false}}
	    let keyword = req.query.keyword;
	    let category = req.query.category;
	    
	    if(keyword)match_phrase['name'] = {'$regex':keyword};
	    if(category){
	    	if(category=='SOME')match_phrase['show_desktop'] = true
	    	else if(category!='ALL')match_phrase['category'] = category;
	    }else match_phrase['show_desktop'] = true

	    let query = [
			{
				"$match" : match_phrase
			},
			{
	        	"$sort": {"updated": -1}
	    	},
	    	{
		        "$group": {
			            "_id": "$rule",
			            "record": {"$first": "$$ROOT"}
			        }
		    },
		    {
		        "$replaceRoot": {
		            "newRoot": "$record"
		        }
		    },
		    {
	        	"$sort": {"updated": -1}
	    	}
		]
	    datascol.aggregate(query, results => {
	    	data_zone.get().then(data_zone_ret=>{
	    		let datazones = data_zone_ret ? data_zone_ret['data_zone'] : [];
		        res.render('datas/list', {
		            'results': results,
		            'title': title,
		            'uri_prefix': uri_prefix,
		            'keyword':keyword,
		            'category':category,
		            'dateFormat':stringUtil.dateFormat,
		            'getAppropiateDateDescription':textHelper.getAppropiateDateAgoDescription,
		            'data_zone' : datazones
		        });
		    });
	    });
	});

	router.get(uri_prefix + 'view/:rule', function (req, res) {
		let rule = req.params.rule;
		let name = req.query.name;
		let version = req.query.version;
		let category = req.query.category;
		let pageSize = 20;
	    let pageNumber = req.query.pagenum || 1;
	    pageNumber = parseInt(pageNumber);
	    if (pageNumber < 1) pageNumber = 1;
	    let query = {'rule':rule};
	    if(version)query['version'] = version;

	    loadrule(rule).then(
    		rule_data => {
    			let peroid_sytax = rule_data ? textHelper.getAppropiatePeroidDescription(rule_data['schedule_start'], rule_data['schedule_peroid']) : '不再';
    			datascol.find(query, null, {"updated" : -1}, pageSize, pageNumber, result => {
			    	result['page_count'] = Math.ceil(result['count']/result['pagesize']);
			    	result['page_min_num'] = result['pagenum'] - 5 > 0 ? result['pagenum']- 5 : result['pagenum'];
			    	result['page_max_num'] = result['pagenum'] + 5 < result['page_count'] ? result['pagenum'] + 5 : result['page_count'];

			        res.render('datas/view', {
			        	'rule':rule,
			            'result': result,
			            'title': title,
			            'name':name,
			            'version':version,
			            'category' : category,
			            'uri_prefix': uri_prefix,
			            'dateFormat':stringUtil.dateFormat,
			            'getAppropiateDateDescription':textHelper.getAppropiateDateAgoDescription,
			            'peroid': peroid_sytax
			        });
			    });
	    		}
	    	);
	});


	router.get(uri_prefix + 'forcerun', function (req, res) {
		let rule = req.query.rule;
		let name = req.query.name;
		let category = req.query.category;
		crawler.crawl(rule, true, null, 'viewer').then(_=>{
			res.redirect(uri_prefix + 'view/'+rule+'?name='+name+'&category='+category);
		});
	});

	router.get(uri_prefix + 'refresh', function (req, res) {
		let rule = req.query.rule;
		crawler.crawl(rule, true, null, 'viewer').then(_=>{
			datascol.find({'rule':rule}, ['message','show','values','version','updated','created'], {"created" : -1}, 1, 1, result => {
				let doc = {};
				if(result.list && result.list.length>0){
					doc = result.list[0];
					doc['updated_des'] = textHelper.getAppropiateDateAgoDescription(doc['updated']) + '（' + stringUtil.dateFormat(doc['updated'], 'yyyy-MM-dd hh:mm:ss') + '）'
				}
				res.jsonp(doc);
		    });
		});
	});	
}