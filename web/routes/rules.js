const showdown = require('showdown');
const mongo = require('../../lib/mongo-ndbc.js');
const stringUtil = require('../../lib/string-util.js');
const textHelper = require('../../processer/text-helper.js');
const shortHash = require('../../lib/shorthash.js');
const crawler = require('../../processer/crawler.js');
const DynamicConfig = require('../../lib/DynamicConfig.js');

module.exports = function (router, settings) {
	let logger = settings.logger;

	let rulescol = new mongo.MongoCollection(settings['mongo_connect_url'], 'rules', 5);
	let wikicol = new mongo.MongoCollection(settings['mongo_connect_url'], 'wiki', 5);

	let markdown_converter = new showdown.Converter({'openLinksInNewWindow':true, 'encodeEmails':false});

	let template = {
		'name':'',
		'category':'default',
		'description':'',
		'version':'',//${YEAR}-${MONTH}-${DATE}
		'code':'',
		'dev_code':'return null;',
		'schedule_start':stringUtil.dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss'),
		'schedule_peroid':86400,
		'last_schecule':0,
		'show_desktop':false,
		'code_changed':false,
		'valid':false
	}

	let primary_fields = [
		{'key':'name', 'label':'名称'},
		{'key':'category', 'label':'类别'},
		{'key':'schedule_peroid', 'label':'调度周期(秒)'},
		{'key':'schedule_start','label':'开始调度'},
		{'key':'last_schecule', 'label':'最近调度时间'},
		{'key':'error_count', 'label':'错误数'},
		{'key':'code_changed', 'label':'代码变更'},
		{'key':'valid', 'label':'有效'}
	]

	let search_key = 'name';

	let cate_key = 'category';

	let order_rule = {'category':1,'name':1}

	let title = '规则';

	let uri_prefix = '/rules/';

	let data_zone = new DynamicConfig.Instance('data_zone', 300);

	router.get(uri_prefix + 'list', function (req, res) {
		let pageSize = 20;
	    let pageNumber = req.query.pagenum || 1;
	    pageNumber = parseInt(pageNumber);
	    if (pageNumber < 1) pageNumber = 1;
	    let query = {};
	    let keyword = req.query.keyword;
	    let category = req.query.category;
	    if(keyword)query[search_key] = {'$regex':keyword};
	    if(category && category!='ALL')query[cate_key] = category;

	    rulescol.find(query, primary_fields.map(x=>x.key), order_rule, pageSize, pageNumber, result => {
	    	result['page_count'] = Math.ceil(result['count']/result['pagesize']);
	    	result['page_min_num'] = result['pagenum'] - 5 > 0 ? result['pagenum']- 5 : result['pagenum'];
	    	result['page_max_num'] = result['pagenum'] + 5 < result['page_count'] ? result['pagenum'] + 5 : result['page_count'];
	    	result['list'] = result['list'].map(x=>{
	    		return Object.assign(x, {
	    			'schedule_peroid_des' : textHelper.getAppropiatePeroidDescription(x['schedule_start'],x['schedule_peroid']),
	    			'last_schecule_des' : x['last_schecule']?textHelper.getAppropiateDateAgoDescription(x['last_schecule']):'无'
	    		});
	    	});
	    	data_zone.get().then(val=>{
	    		res.render('rules/list', {
		            'result': result,
		            'primary_fields': primary_fields,
		            'title': title,
		            'uri_prefix': uri_prefix,
		            'keyword':keyword,
		            'category':category,
		            'dateFormat':stringUtil.dateFormat,
		            'data_zone' : val ? val['data_zone'] : []
		        });
	    	});
	    });
	});

	router.get(uri_prefix + 'edit', function (req, res) {
		let id = req.query.id;
		let category = req.query.category;
		let referer = req.get('referer');
	    if (id) {
	        rulescol.get(id, ['name','category','schedule_start','schedule_peroid','version','valid','show_desktop','description'], result => {
	        	result['schedule_start'] = stringUtil.dateFormat(result['schedule_start'],'yyyy-MM-dd hh:mm:ss');
	        	data_zone.get().then(val=>{
		            res.render('rules/edit', {
		                'doc': result,
		                'id': id,
		                'title': title,
			            'uri_prefix': uri_prefix,
			            'data_zone' : val ? val['data_zone'] : [],
			            'referer' : referer
		            });
		        });
	        });
	    } else {
	    	let doc = Object.assign({}, template);
	    	doc['schedule_start'] = stringUtil.dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss');
	    	if(category)doc['category'] = category;
	    	doc['sid'] = shortHash.unique(new Date().getTime().toString());
	    	data_zone.get().then(val=>{
		        res.render('rules/edit', {
		            'doc': doc,
		            'id': null,
		            'title': title,
		            'uri_prefix': uri_prefix,
		            'data_zone' : val ? val['data_zone'] : [],
		            'referer' : referer
		        });
		    });
	    }
	});

	router.post(uri_prefix + 'verify-unique', function (req, res) {
		let sid = req.body.sid;
		rulescol.get(sid,['name'], ret=>{
			res.jsonp({'unique': !(ret && ret['name'])});
		});
	});

	router.post(uri_prefix + 'update', function (req, res) {
		let id = req.query.id;
		let name = req.body.name;
		let category = req.body.category || template['category'];
		let description = req.body.description || template['description'];
		let schedule_start = req.body.schedule_start ? new Date(req.body.schedule_start) : new Date();
		let schedule_peroid = req.body.schedule_peroid ? parseInt(req.body.schedule_peroid) : template['schedule_peroid'];
		let version = req.body.version || '';
		let valid = req.body.valid && req.body.valid !='' ;
		let show_desktop = req.body.show_desktop && req.body.show_desktop !='' ;
		let sid = req.body.sid;
		let referer = req.body.referer || (uri_prefix + 'list');

		let doc = {
			'name' : name,
			'category':category,
			'description':description,
			'schedule_start':schedule_start,
			'schedule_peroid':schedule_peroid,
			'version':version,
			'valid':valid,
			'show_desktop':show_desktop,
			'updated':new Date(),
			'is_new':false
		}

		if (id) {
	        rulescol.update(id, doc, false, false, result => {
	            res.redirect(referer);
	        });
	    } else {
	    	doc['_id'] = sid || shortHash.unique(new Date().getTime().toString());
	    	doc['is_new'] = true;
	        rulescol.save(doc, result => {
	            res.redirect(referer);
	        });
	    }
	});

	router.get(uri_prefix + 'code', function (req, res) {
		let id = req.query.id;
	    rulescol.get(id, ['code','dev_code','name','category'], result => {
	    	if(!result['dev_code'])result['dev_code'] = template['dev_code']
	        res.render('rules/code', {
	            'doc': result,
	            'id': id,
	            'title': title,
	            'uri_prefix': uri_prefix
	        });
	    });
	});

	router.get(uri_prefix + 'clone', function (req, res) {
		let id = req.query.id;
		let referer = req.get('referer');
	    rulescol.get(id, null, result => {
	    	if(result){
	    		result['_id'] = shortHash.unique(new Date().getTime().toString());
	    		result['name'] = result['name'] + '（克隆）';
	    		result['valid'] = false;
	    		result['is_new'] = true;
	    		result['updated'] = new Date();
	    		delete result['last_schecule'];
	    		rulescol.save(result,_=>{
	    			res.redirect(referer);
	    		});
	    	}else{
	    		res.redirect(referer);
	    	}	        
	    });
	});

	router.get(uri_prefix + 'forcerun', function (req, res) {
		let id = req.query.id;
		crawler.crawl(id, true, null, 'coder').then(_=>{
			res.redirect(uri_prefix + 'list');
		});
	});

	router.post(uri_prefix + 'putcode', function (req, res) {
		let id = req.body.id;
		let dev_code = req.body.dev_code;
		rulescol.update(id, {'dev_code':dev_code,'code_changed':true}, false, false, result => {
            res.json({'success':true});
        });
	});

	router.post(uri_prefix + 'publishcode', function (req, res) {
		let id = req.body.id;
		let dev_code = req.body.dev_code;
		rulescol.update(id, {'dev_code':dev_code, 'code':dev_code, 'code_changed':false}, false, false, result => {
            res.json({'success':true});
        });
	});

	router.post(uri_prefix + 'debugcode', function (req, res) {
		let id = req.body.id;
		let dev_code = req.body.dev_code;
		crawler.runAsyncCode(id, dev_code, 'coder').then(val=>{
			if(typeof val != 'object')val = {'message':val}
			res.json({'success':true, 'result':val});
		}).catch(reason=>{
			//console.error(reason);
			res.json({'success':false, 'result':reason.stack || reason.toString()});
		});
	});

	router.get(uri_prefix + 'trash', function (req, res) {
		let id = req.query.id;
		let referer = req.get('referer') || (uri_prefix + 'list');
	    rulescol.update(id, {'valid':false}, false, false, result => {
            res.redirect(referer);
        });
	});

	router.get(uri_prefix + 'delete', function (req, res) {
		let id = req.query.id;
		let referer = req.get('referer') || (uri_prefix + 'list');
	    rulescol.remove(id, result => {
	        res.redirect(referer);
	    });
	});

	router.get(uri_prefix + 'wiki/edit/:name', function (req, res) {
		let wiki_name = req.params.name;
	    wikicol.get(wiki_name, ['content'], result => {
	        res.render('rules/wiki-edit', {
	            'content': result?result['content']:'',
	            'name': wiki_name
	        });
	    });
	});

	router.post(uri_prefix + 'wiki/edit/putwiki', function (req, res) {
		let name = req.body.name;
		let content = req.body.content;
		wikicol.update(name, {'content':content}, false, true, result => {
            res.json({'success':true});
        });
	});

	router.get(uri_prefix + 'wiki/view/:name', function (req, res) {
		let wiki_name = req.params.name;
	    wikicol.get(wiki_name, ['content'], result => {
	        res.render('rules/wiki-view', {
	            'content': result?markdown_converter.makeHtml(result['content']):'',
	            'name': wiki_name
	        });
	    });
	});
}