if(module.parent){
    const path = require('path');
    const fs = require('fs');
    const logger = require('../lib/LogUtil.js').logger;

    const crawler = require('../processer/crawler.js');

    const dump2file = async(rule_id, profile, version)=>{
        let rule = await crawler.loadrule(rule_id);
        let code = version == 'pro' ? rule['code'] : rule['dev_code'];
        let template = await fs.readFileSync(path.resolve(__dirname, 'template.js'), {
            'encoding': 'utf-8'
        });
        let fcode = template.replace('/*RULE_ID*/', rule_id);
        fcode = fcode.replace('/*CODE*/', code);
        fcode = fcode.replace('/*PROFILE*/', profile);
        let filepath = path.resolve(__dirname, 'scripts', rule_id + '-' + profile + '-' + version + '.js');
        fs.writeFileSync(filepath, fcode, {
            'encoding': 'utf-8'
        });
        logger.debug(rule_id + ' dump to ' + filepath);
    }

    exports.dump2file = dump2file;
}else{
    const path = require('path');
    const fs = require('fs');
    const logger = require('../lib/LogUtil.js').logger;

    const userArgv = require('optimist')
        .usage('Usage: -e [dev|test|pro] -p [port] -h')
        .options('e', {
            'alias': 'env',
            'default': 'dev',
            'describe': 'Specify a environment(profile), dev|test|pro'
        })
        .options('r', {
            'alias': 'rule',
            'default': '',
            'describe': 'Specify a rule id'
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
    if (options['h'] || !options['r']) {
        userArgv.showHelp();
        process.exit();
    }

    process.env.profile = process.env.profile || options['e'];
    const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');
    const crawler = require('../processer/crawler.js');

    const dump2file = async(rule_id, profile, version)=>{
        let rule = await crawler.loadrule(rule_id);
        let code = options['v'] == 'pro' ? rule['code'] : rule['dev_code'];
        let template = await fs.readFileSync(path.resolve(__dirname, 'template.js'), {
            'encoding': 'utf-8'
        });
        let fcode = template.replace('/*RULE_ID*/', rule_id);
        fcode = fcode.replace('/*CODE*/', code);
        fcode = fcode.replace('/*PROFILE*/', profile);
        let filepath = path.resolve(__dirname, 'scripts', rule_id + '-' + profile + '-' + version + '.js');
        fs.writeFileSync(filepath, fcode, {
            'encoding': 'utf-8'
        });
        logger.debug(rule_id + ' dump to ' + filepath);
    }

    (async () => {
        await dump2file(options['r'], process.env.profile, options['v']);
        process.exit(0);
    })();
}