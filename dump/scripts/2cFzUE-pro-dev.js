const crawler = require('../../processer/crawler.js');
const RULE_ID = '2cFzUE';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
    let sandbox = await crawler.getSandbox(RULE_ID, 'coder');
    with(sandbox) {
        const fname = 'cmpt-1';

        const getTopicInfo = async (name) => {
            let json = await getJson('http://cms.feheadline.com/dynamic/dynamic_file/' + name + '.json', {
                'headers': {
                    'Authorization': 'Basic Y2hlcm9rZWU6Y2hlcm9rZWUxMjM='
                },
                'method': 'GET',
                'json': true
            });

            return json;
        }

        const getArticles = (topic) => {
            let connection = mysql.createConnection({
                host: '10.10.119.133',
                user: 'feapi',
                password: 'pwd@news$',
                database: 'news_cfg'
            });

            connection.connect();

            return new Promise(resolve => {
                connection.query(`SELECT n.id FROM fe_topic_article_relation a, fe_avnews n where a.topic_id = ${topic} and a.valid = 1 and n.article_id = a.article_id;`, function(error, results, fields) {
                    connection.end();
                    resolve(!error && results.length > 0 ? results.map(x => { return x['id'] }) : []);
                });
            });
        }

        const getRankFromNeo4j = async (newsid, start_time, end_time) => {
            let statement = '';
            for (let i = 0; i < newsid.length; i++) {
                let n = newsid[i];
                if (i > 0) statement += ' UNION ';
                statement += `MATCH (u1:USER)-[r:SHARE*]->(u2:USER) WHERE u1<>u2 AND ALL(v in r where v.date>=${start_time} AND v.date<${end_time} AND v.article_fp = ${n})  WITH count(r) AS ct, u1.fp AS name RETURN name,ct ORDER BY ct DESC LIMIT 100`
            }

            let json = await getJson('http://neo4j.feheadline.net:7474/db/data/transaction/commit', {
                'headers': {
                    'Authorization': 'Basic bmVvNGo6MTIz'
                },
                'method': 'POST',
                'json': true,
                'body': {
                    "statements": [{
                        "statement": statement
                    }]
                },
                'timeout': 600000
            });

            if (json) {
                return json['results'][0]['data'].map(x => { return x['row'] });
            } else return []
        }

        const getUserInfos = (userid_arr) => {
            let connection = mysql.createConnection({
                host: '10.10.119.133',
                user: 'feapi',
                password: 'pwd@news$',
                database: 'news_cfg'
            });

            connection.connect();
            let sql = `SELECT id,name,avatar_addr FROM sys_user where id in (${userid_arr.join(',')})`;

            return new Promise(resolve => {
                connection.query(sql, function(error, results, fields) {
                    connection.end();
                    resolve(!error && results.length > 0 ? results.reduce((d, v) => {
                        d[v['id']] = { 'name': v['name'], 'avatar': v['avatar_addr'] };
                        return d;
                    }, {}) : {});
                });
            });
        }

        const updateConfigFile = (value) => {
            let svalue = JSON.stringify(value, null, 4);
            let MongoClient = mongodb.MongoClient;
            return new Promise(resolve => {
                MongoClient.connect('mongodb://mongodb.feheadline.net:27017', function(err, client) {
                    let db = client.db('feheadline');
                    db.collection('dynamic_file').update({ 'name': fname + '.json' }, { "$set": { "code": svalue } }, (err) => {
                        client.close();
                        resolve(err);
                    });
                })
            })
        }

        let config = await getTopicInfo(fname);
        let topic = config['topic'];
        let start_time = new Date(config['date'][0]).getTime();
        let end_time = new Date(config['date'][1]).getTime();

        let newsid = await getArticles(topic);

        let ranks = await getRankFromNeo4j(newsid, start_time, end_time);

        ranks = ranks.filter(x => { return typeof x[0] == 'number' });

        let sumed_ranks = ranks.reduce((d, x) => {
            if (d[x[0]]) d[x[0]] += x[1];
            else d[x[0]] = x[1];
            return d;
        }, {});

        let ard_ranks = [];

        for (let sr in sumed_ranks) {
        	ard_ranks.push([sr, sumed_ranks[sr]]);
        }

        ranks = ard_ranks.sort((x, y) => {
            return y[1] - x[1];
        });debugger;

        let userid_arr = ranks.map(x => { return x[0] });

        let usersinfo = await getUserInfos(userid_arr);

        let ret_array = [
            ['排名', '昵称', 'ID', '头像', '影响力']
        ]
        debugger;
        let c = 1;
        let newrank = [];
        for (let rk of ranks) {
            let uinfo = usersinfo[rk[0]] || {};
            let name = uinfo['name'] || ('u-' + rk[0]);
            let fk_avartar;
            if (uinfo['avatar']) {
                if (uinfo['avatar'].startsWith('http://wx.qlogo.cn')) fk_avartar = 'https://www.tinygraphs.com/labs/isogrids/hexa16/' + rk[0] + '?theme=frogideas&numcolors=4&size=100&fmt=svg';
                else fk_avartar = uinfo['avatar'];
            } else {
                fk_avartar = 'https://www.tinygraphs.com/labs/isogrids/hexa16/' + rk[0] + '?theme=frogideas&numcolors=4&size=100&fmt=svg';
            }

            let avatar = '<img src="' + fk_avartar + '" width="80" height="80"/>';
            ret_array.push([c, name, rk[0], avatar, rk[1]]);
            newrank.push({
                'no': c,
                'id': rk[0],
                'name': name,
                'avatar': fk_avartar,
                'score': rk[1]
            });
            c++;
        }

        if (newrank.length > 0) {
            config['rank'] = newrank;
            let err = await updateConfigFile(config);
        }

        let show = array2table(ret_array, true, 'iwdatatable');

        return {
            'show': show
        };
    }
}

(async () => {
    let result = await evalFuc();
    if (typeof result == 'function') {
        console.log(RULE_ID + ' is Function');
    } else {
        if (typeof result != 'object') result = { 'message': result };
        console.log('crawled ' + RULE_ID + ', result: ' + result['message']);
        let version = result['$version'] || (await crawler.autoVersion(RULE_ID));
        let isnew = await crawler.data2mongo(RULE_ID, version, Object.assign({}, result));
        await crawler.updateScheduleStatus(RULE_ID, -1);
        if (isnew) console.log('crawl new data for ' + RULE_ID);
        else console.log('update crawled data for ' + RULE_ID);
    }
    process.exit(0);
})();