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

const languages = [
			// 'abap',
			// 'abc',
			'actionscript',
			// 'ada',
			// 'apache_conf',
			// 'applescript',
			// 'asciidoc',
			// 'assembly_x86',
			// 'autohotkey',
			// 'batchfile',
			// 'behaviour',
			// 'bro',
			// 'c9search',
			// 'c_cpp',
			// 'cirru',
			// 'clojure',
			// 'cobol',
			'coffee',
			'coldfusion',
			'csharp',
			'css',
			// 'curly',
			// 'd',
			// 'dart',
			// 'diff',
			// 'django',
			// 'dockerfile',
			// 'dot',
			// 'drools',
			// 'eiffel',
			// 'ejs',
			// 'elixir',
			// 'elm',
			// 'erlang',
			// 'forth',
			// 'fortran',
			// 'ftl',
			// 'gcode',
			// 'gherkin',
			// 'gitignore',
			// 'glsl',
			// 'gobstones',
			'golang',
			// 'graphqlschema',
			// 'groovy',
			// 'haml',
			// 'handlebars',
			// 'haskell',
			// 'haxe',
			// 'hjson',
			'html',
			// 'html_elixir',
			// 'html_ruby',
			'ini',
			// 'io',
			// 'jack',
			// 'jade',
			'java',
			'javascript',
			'json',
			// 'jsp',
			// 'jsx',
			// 'julia',
			'kotlin',
			// 'latex',
			// 'less',
			// 'liquid',
			// 'lisp',
			// 'livescript',
			// 'logiql',
			// 'lsl',
			'lua',
			// 'luapage',
			// 'lucene',
			// 'makefile',
			// 'markdown',
			// 'mask',
			// 'matlab',
			// 'maze',
			// 'mel',
			// 'mushcode',
			'mysql',
			// 'nix',
			// 'nsis',
			'objectivec',
			// 'ocaml',
			'pascal',
			'perl',
			// 'pgsql',
			'php',
			'pig',
			'plain_text',
			// 'powershell',
			// 'praat',
			// 'prolog',
			// 'properties',
			// 'protobuf',
			'python',
			'r',
			// 'razor',
			// 'rdoc',
			// 'rhtml',
			// 'rst',
			'ruby',
			// 'rust',
			// 'sass',
			// 'scad',
			'scala',
			// 'scheme',
			// 'scss',
			'sh',
			// 'sjs',
			// 'smarty',
			// 'snippets',
			// 'soy_template',
			// 'space',
			// 'sparql',
			'sql',
			'sqlserver',
			// 'stylus',
			'svg',
			'swift',
			// 'tcl',
			// 'tex',
			'text',
			'textile',
			// 'toml',
			// 'tsx',
			// 'turtle',
			// 'twig',
			// 'typescript',
			// 'vala',
			// 'vbscript',
			// 'velocity',
			// 'verilog',
			// 'vhdl',
			// 'wollok',
			'xml',
			// 'xquery',
			'yaml'
]

const code_editor = (router, settings, title, collection_name, meta_fields, immutable_fileds, changed_feature_field, search_key, order_rule, uri_prefix, default_language)=>{
	const col = new mongo.MongoCollection(settings['mongo_connect_url'], collection_name.replace('-','_'), settings['mongo_pool_size']);

	router.get(uri_prefix+'list', (req, res)=>{
        let pageSize = 20;
	    let pageNumber = req.query.pagenum || 1;
	    pageNumber = parseInt(pageNumber);
	    if (pageNumber < 1) pageNumber = 1;
	    let query = {};
	    let keyword = req.query.keyword;
	    if(keyword)query[search_key] = {'$regex':keyword};
	    let query_fields = ['language'].concat(meta_fields.map(x=>x.key));

	    col.find(query, query_fields, order_rule, pageSize, pageNumber, result => {
	    	result['page_count'] = Math.ceil(result['count']/result['pagesize']);
	    	result['page_min_num'] = result['pagenum'] - 5 > 0 ? result['pagenum']- 5 : result['pagenum'];
	    	result['page_max_num'] = result['pagenum'] + 5 < result['page_count'] ? result['pagenum'] + 5 : result['page_count'];
	        res.render('component/code-list', {
	            'result': result,
	            'meta_fields': meta_fields,
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
	            res.render('component/code-edit', {
	                'doc': result,
	                'id': id,
	                'title': title,
		            'uri_prefix': uri_prefix,
		            'meta_fields': meta_fields,
	            	'languages':languages
	            });
	        });
	    } else {
	        res.render('component/code-edit', {
	            'doc': {'language':default_language},
	            'id': null,
	            'title': title,
	            'uri_prefix': uri_prefix,
	            'meta_fields': meta_fields,
	            'languages':languages
	        });
	    }
    });

    router.post(uri_prefix+'update', (req, res)=>{
        let id = req.query.id;
        let doc = {};
        for(let f of meta_fields){
        	doc[f['key']] = req.body[f['key']];
        }
        doc['code'] = req.body.code;
        doc['language'] = req.body.language;
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

exports.set = code_editor;