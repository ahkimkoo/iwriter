/**
 * Created by cherokee on 15-4-2.
 */

module.exports = function (router, settings) {
    require('./authorization.js')(router, settings);
    router.get('/', index);
    require('./admin.js')(router, settings);
    require('./config.js')(router, settings);
    require('./profile.js')(router, settings);
    require('./rules.js')(router, settings);
    require('./datas.js')(router, settings);
    require('./provider.js')(router, settings);
    require('./worker.js')(router, settings);
}


var index = function (req, res) {
	res.redirect('/profile/subscribe/list');
    // var template = 'index';
    // res.render(template, {});
}