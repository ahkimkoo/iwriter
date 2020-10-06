const path = require('path');
const fs = require('fs');
const mongo = require('../lib/mongo-ndbc.js');
const logger = require('../lib/LogUtil.js').logger;

const userArgv = require('optimist')
    .usage('Usage: -e [dev|test|pro] -p [port] -h')
    .options('e', {
        'alias': 'env',
        'default': 'dev',
        'describe': 'Specify a environment(profile), dev|test|pro'
    })
    .options('v', {
        'alias': 'version',
        'default': 'dev',
        'describe': 'Specify a rule version dev|pro'
    })
    .options('h', {
        'alias': 'help',
        'describe': 'Help infomation'
    });

const options = userArgv.argv;
if (options['h']) {debugger;
    userArgv.showHelp();
    process.exit();
}

process.env.profile = process.env.profile || options['e'];
const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');
const crawler = require('../processer/crawler.js');
const dump = require('./dump.js');
const rulescol = new mongo.MongoCollection(settings['mongo_connect_url'], 'rules', 1);

const getRulesId = async () =>{
    let query = {}
    return new Promise(resolve=>{
        rulescol.find(query, ['_id'], null, 100000, 1, result => {
            resolve(result.list.map(x=>{return x['_id'].toString()}));
        });
    });
}

(async () => {
    let rules = await getRulesId();
    for(let rule of rules){
        await dump.dump2file(rule, process.env.profile, options['v']);
    }
    process.exit(0);
})();