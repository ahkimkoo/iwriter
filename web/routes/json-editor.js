const mongo = require('../../lib/mongo-ndbc.js');

const date_format = function (date, fmt) {
    var o = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "h+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        "S": date.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

const json_editor = (router, settings, title, collection_name, primary_fields, immutable_fileds, changed_feature_field, search_key, order_rule, uri_prefix, template)=>{
	const col = new mongo.MongoCollection(settings['mongo_connect_url'], collection_name.replace('-','_'), settings['mongo_pool_size']);

	router.get(uri_prefix+'list', (req, res)=>{
        let pageSize = 20;
	    let pageNumber = req.query.pagenum || 1;
	    pageNumber = parseInt(pageNumber);
	    if (pageNumber < 1) pageNumber = 1;
	    let query = {};
	    let keyword = req.query.keyword;
	    if(keyword)query[search_key] = {'$regex':keyword};

	    col.find(query, primary_fields.map(x=>x.key), order_rule, pageSize, pageNumber, result => {
	    	result['page_count'] = Math.ceil(result['count']/result['pagesize']);
	    	result['page_min_num'] = result['pagenum'] - 5 > 0 ? result['pagenum']- 5 : result['pagenum'];
	    	result['page_max_num'] = result['pagenum'] + 5 < result['page_count'] ? result['pagenum'] + 5 : result['page_count'];
	        res.render('component/json-list', {
	            'result': result,
	            'primary_fields': primary_fields,
	            'title': title,
	            'uri_prefix': uri_prefix,
	            'keyword':keyword
	        });
	    });
    });

    router.get(uri_prefix+'edit', (req, res)=>{
        let id = req.query.id;
	    if (id) {
	        col.get(id, null, result => {
	            res.render('component/json-edit', {
	                'doc': result,
	                'id': id,
	                'title': title,
		            'uri_prefix': uri_prefix
	            });
	        });
	    } else {
	        res.render('component/json-edit', {
	            'doc': template,
	            'id': null,
	            'title': title,
	            'uri_prefix': uri_prefix
	        });
	    }
    });

    router.post(uri_prefix+'update', (req, res)=>{
        let id = req.query.id;
	    let doc = JSON.parse(req.body.jsondata);
	    if (changed_feature_field) {
	        doc[changed_feature_field] = date_format(new Date(),'yyyy-MM-dd hh:mm:ss');
	    }
	    if (id) {
	    	for (let f of immutable_fileds) delete doc[f];
	        col.update(id, doc, false, false, result => {
	            res.redirect(uri_prefix + 'list');
	        });
	    } else {
	        col.save(doc, result => {
	            res.redirect(uri_prefix + 'list');
	        });
	    }
    });

    router.get(uri_prefix+'remove', (req, res)=>{
        let id = req.query.id;
	    col.remove(id, result => {
	        res.redirect(uri_prefix + 'list');
	    });
    });
}

exports.set = json_editor;