const mongo = require('../../lib/mongo-ndbc.js');
const textHelper = require('../../processer/text-helper.js');
const stringUtil = require('../../lib/string-util.js');
const DynamicConfig = require('../../lib/DynamicConfig.js');

module.exports = async function (router, settings) {
	const logger = settings.logger;
	let subscribecol = new mongo.MongoCollection(settings['mongo_connect_url'], 'subscribe', 5);
    let datascol = new mongo.MongoCollection(settings['mongo_connect_url'], 'datas', 5);
    let rulescol = new mongo.MongoCollection(settings['mongo_connect_url'], 'rules', 5);
    let managercol = new mongo.MongoCollection(settings['mongo_connect_url'], 'manager', 5);

    let DATA_ZONE_IST = new DynamicConfig.Instance('data_zone', 300);

	const renderErrorPage = function (res, err) {
        res.render('operation-result', {
            result: [false, err.toString()]
        });
    };

    const renderSuccessPage = function (res, information, jumpUrl) {
        res.render('operation-result', {
            result: [true, information, jumpUrl]
        })
    }

    const updatePassword = function(id, password, callback) {
        managercol.update(
        		id,
                {
                    'password': password,
                    'first_log_in': false
                },
                false,
                false,
                (err,ret)=>{
                	callback(err,ret);
                }
            );
    }

    const getMySubscribe = async function(id, parse = false, field='rules'){
        return new Promise(resolve=>{
            subscribecol.get(id, [field], ret=>{
                let xret = ret[field] || [];
                resolve(parse ? xret.map(x=>{return subscribecol.generateObjectId(x)}) : xret);
            });
        });  
    }

    const addMySubscribe = async function(id, rule, field='rules'){
        let my_subscribe = await getMySubscribe(id);
        return new Promise(resolve=>{
            if(my_subscribe.indexOf(rule) <0 ){
                let doc = {};
                my_subscribe.push(rule);
                doc[field] = my_subscribe;
                subscribecol.update(id, doc, false, true, _=>{
                    resolve(true);
                });
            }else resolve(false);
        });  
    }

    const deleteMySubscribe = async function(id, rule, field='rules'){
        let my_subscribe = await getMySubscribe(id);
        return new Promise(resolve=>{
            if(my_subscribe.indexOf(rule) >= 0 ){
                let doc = {};
                doc[field] = my_subscribe.filter(x=>{return x != rule});
                subscribecol.update(id, doc, false, true, _=>{
                    resolve(true);
                });
            }else resolve(false);
        });  
    }

    const sortMySubscribe = async function(id, series, field='rules'){
        let my_subscribe = await getMySubscribe(id);
        let union = series.concat(my_subscribe.filter(v => !series.includes(v)));
        return new Promise(resolve=>{
            let doc = {};
            doc[field] = union;
            subscribecol.update(id, doc, false, true, _=>{
                resolve(true);
            });
        });  
    }

	router.route('/profile/change-password').get((req, res) => {
        res.render('profile/change-password.html');
    }).post((req, res) => {
        let userid = res.locals.userid;
        let password = req.body.password;
        updatePassword(
        	userid,
        	password, 
	        (err, result) => {
	            if (err) {
	                logger.error('update password err =', err, 'username =', username);
	                renderErrorPage(res, err);
	            } else {
	                res.render('login', {
	                    'url': req.protocol + "://" + req.get('host') + req.originalUrl
	                });
	            }
	        }
        )
    });

    router.get('/profile/logout',(req,res)=>{
    	res.render('profile/log-out',{
    		'link' : req.protocol + '://u'+Math.ceil(Math.random()*1000)+'@' + req.get('host') + '/'
    	});
    });

    router.get('/profile/subscribe/list', async (req,res)=>{
        let my_subscribe = await getMySubscribe(res.locals.userid);
        let data_zones = await DATA_ZONE_IST.get();

        let match_phrase = {"valid":{"$ne":false}}
        let keyword = req.query.keyword;
        let category = req.query.category;
        let edit = req.query.edit || '';
        
        if(keyword)match_phrase['name'] = {'$regex':keyword};
        if(category){
            if(category=='SOME')match_phrase['show_desktop'] = true
            else if(category!='ALL')match_phrase['category'] = category;
        }

        if(my_subscribe && my_subscribe.length>0)match_phrase['rule'] = {'$in' : my_subscribe};

        let query = [
            {
                "$match" : match_phrase
            },
            {
                "$sort": {"updated": -1}
            },
            {
                "$group": {
                        "_id": "$name",
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
            let datazones = data_zones ? data_zones['data_zone'] : [];
            results = results.map(x=>{
                return Object.assign(x, {
                    'updated_des' : textHelper.getAppropiateDateAgoDescription(x['updated']) + '（' + stringUtil.dateFormat(x['updated'], 'yyyy-MM-dd hh:mm:ss') + '）'
                });
            }).filter(x=>{return typeof (x['message']||x['show']) == 'string';});

            results.sort((a,b)=>{
                return my_subscribe.indexOf(a['rule']) - my_subscribe.indexOf(b['rule']);
            });
            res.render('profile/subscribe-list', {
                'results': results,
                'keyword':keyword,
                'category':category,
                'data_zone' : datazones,
                'edit' : edit
            });
        });
    });

    router.get('/profile/subscribe/add', async (req,res)=>{
        let my_subscribe = await getMySubscribe(res.locals.userid, true);
        let data_zones = await DATA_ZONE_IST.get();

        let pageSize = 20;
        let pageNumber = req.query.pagenum || 1;
        pageNumber = parseInt(pageNumber);
        if (pageNumber < 1) pageNumber = 1;
        let query = {
            'valid' : true,
            '_id' : {'$nin' : my_subscribe}
        };

        let keyword = req.query.keyword;
        let category = req.query.category;

        if(keyword)query['name'] = {'$regex':keyword};
        if(category && category!='ALL')query['category'] = category;

        rulescol.find(query, ['name','category','schedule_peroid','schedule_start','last_schecule','description'], {'category':1,'name':1}, pageSize, pageNumber, result => {
            result['page_count'] = Math.ceil(result['count']/result['pagesize']);
            result['page_min_num'] = result['pagenum'] - 5 > 0 ? result['pagenum']- 5 : result['pagenum'];
            result['page_max_num'] = result['pagenum'] + 5 < result['page_count'] ? result['pagenum'] + 5 : result['page_count'];

            result['list'] = result['list'].map(x=>{
                return Object.assign(x, {
                    'schedule_peroid_des' : textHelper.getAppropiatePeroidDescription(x['schedule_start'],x['schedule_peroid']),
                    'last_schecule_des' : x['last_schecule']?textHelper.getAppropiateDateAgoDescription(x['last_schecule']):'无'
                });
            });

            res.render('profile/subscribe-add', {
                'result': result,
                'keyword':keyword,
                'category':category,
                'data_zone' : data_zones ? data_zones['data_zone']: []
            });
        });
    });

    router.post('/profile/subscribe/add', async function (req, res) {
        let rule = req.body.id;
        let bol = await addMySubscribe(res.locals.userid, rule);
        res.json({'success':true,'add':bol});
    });

    router.post('/profile/subscribe/delete', async function (req, res) {
        let rule = req.body.id;
        let bol = await deleteMySubscribe(res.locals.userid, rule);
        res.json({'success':true,'add':bol});
    });

    router.post('/profile/subscribe/sort', async function (req, res) {
        let series = req.body.series;
        let bol = await sortMySubscribe(res.locals.userid, series);
        res.json({'success':true,'add':bol});
    });
}