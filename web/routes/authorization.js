const mongo = require('../../lib/mongo-ndbc.js');
const objectUtil = require('../../lib/object-util.js');
const async = require('async');


module.exports = function (router, settings) {
    const logger = settings.logger;

    let managercol = new mongo.MongoCollection(settings['mongo_connect_url'], 'manager', 10);
    let verify = (user, passwd, path, callback) => {
        let cache = {
            ok: false, // 是否可以访问该路由
            is_pwd_correct: false, // 用户名密码是否正确
            nickname: '访客',
            avatar: '/img/avatar.png',
            group_name: ['default'],
            all_path: [],
            first_log_in: true,
            userid: null
        }

        async.series([
            next => {
                managercol.get({
                    'username': user,
                    'password': passwd
                }, ['group_name', 'nickname', 'avatar', 'first_log_in'], result => {
                    if (result && !objectUtil.isEmpty(result)) {
                        cache.is_pwd_correct = true;
                        cache.group_name = result['group_name'];
                        cache.first_log_in = result['first_log_in'];
                        cache.userid = result['_id'];
                        if (result['nickname']) cache.nickname = result['nickname'];
                        if (result['avatar']) cache.avatar = result['avatar'];
                    }

                    next();
                });
            },
            next => {
                if (cache.group_name && cache.is_pwd_correct) {
                    _getPathAccGroupName(cache.group_name, (err, myPath) => {
                        // logger.debug('user =', user, 'group_name =', cache.group_name, 'myPath =', myPath, 'path =', path);
                        cache.all_path = myPath;
                        for (let p of myPath) {
                            if (new RegExp(`^${p}$`, 'ig').test(path)) {
                                cache.ok = true;
                                break;
                            }
                        }

                        next();
                    });
                } else {
                    cache.ok = false;
                    next('user do not have group');
                }
            }
        ], (err) => {
            callback(err, cache);
        })
    }


    /**
     * 
     * @param {*} groupName []
     * @param {*} callback groupName: []
     */
    const managerGroupCol = new mongo.MongoCollection(settings['mongo_connect_url'], 'manager_group', 10);

    function _getPathAccGroupName(groupName, callback) {
        let searchCondition = {
            $or: []
        };

        for (let group of groupName) {
            searchCondition['$or'].push({
                'group_name': group
            });
        }

        managerGroupCol.find(searchCondition, ['group_path'], null, 100, 1, result => {
            if (result && result.list && Array.isArray(result.list)) {
                let group_path = [];
                for (let each of result.list) {
                    group_path.push(...each.group_path);
                }
                callback(null, group_path);
            } else {
                callback('do not find this group group_name =', groupName);
            }
        })
    }

    router.use('*', function (req, res, next) {
        let splited_path = req.originalUrl.split('/');
        res.locals.pos = splited_path.length >0 && splited_path[1] ? splited_path[1] : 'index';
        var ua = req.headers['user-agent'];
        var mobile = false;
        if (/(micromessenger)|(android)|(ios)|(iphone)|(ucbrowser)/i.test(ua)) mobile = true;
        res.locals.mobile = mobile;

        var auth;
        if (req.headers.authorization) {
            auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
        }else{
            let auth_str = req.query.auth;
            if(auth_str){
                auth = new Buffer(auth_str, 'base64').toString().split(':');
            }
        }

        if (auth) {
            verify(auth[0], auth[1], req.originalUrl, (err, result) => {
                res.locals.userid = result.userid;
                res.locals.nickname = result.nickname;
                res.locals.avatar = result.avatar;
                res.locals.allPath = result.all_path;
                res.locals.username = auth[0];
                res.locals.password = auth[1];

                if (!result.is_pwd_correct) {
                    if(req.originalUrl == '/profile/logout')next();
                    else{
                        logger.debug(`username#${auth[0]},nickname#${result.nickname} login iwriter-web pwd err`);
                        res.statusCode = 401;
                        res.setHeader('WWW-Authenticate', 'Basic realm="AdminRealm"');
                        res.render('login', {
                            'url': req.protocol + "://" + req.get('host') + req.originalUrl
                        });
                    }                        
                } else if (result.first_log_in) { // 密码正确,是第一次登录
                    logger.debug(`username#${auth[0]},nickname#${result.nickname} first login iwriter-web`);
                    res.render('profile/change-password.html');
                } else if (result.ok || req.originalUrl.startsWith('/profile')) { // 密码正确,且有权限访问
                    // logger.info(`username#${auth[0]},nickname#${result.nickname} login iwriter-web`);
                    next();
                } else { // 密码正确,但无权访问
                    res.render('auth-deny.html', {});
                }
            });
        } else {
            logger.debug('Guest did not login, Access '+req.originalUrl+', '+req.method);
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="AdminRealm"');
            res.render('login', {
                'url': req.protocol + "://" + req.get('host') + req.originalUrl
            });
        }
    });
}