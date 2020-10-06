const vm = require('vm');
const crypto = require('crypto');
const mysql = require('mysql');
const mongodb = require('mongodb');
const redis = require('redis');
const Async = require('async');
const qiniu = require('qiniu');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const elasticsearch = require('elasticsearch');
const nodejieba = require("nodejieba");
const seneca = require('seneca');
const mongo = require('../lib/mongo-ndbc.js');
const mq = require('../lib/RabbitMQ.js');
const kafka = require('../lib/kafka.js');
const stringUtil = require('../lib/string-util.js');
const objectUtil = require('../lib/object-util.js');
const requestHelper = require('./request-helper.js');
const textHelper = require('./text-helper.js');
const mailer = require('../lib/mailer.js');
const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');
const logger = require('../lib/LogUtil.js').logger;

const DynamicConfig = require('../lib/DynamicConfig.js');

const rulescol = new mongo.MongoCollection(settings['mongo_connect_url'], 'rules', 10);
const datascol = new mongo.MongoCollection(settings['mongo_connect_url'], 'datas', 10);

const data_zone = new DynamicConfig.Instance('data_zone', 300);

const CHECK_NEW_RULES_INTERVAL = 60*1000;

const sleep = async (duration) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, duration);
    });
};

const getMagicViarable = async () => {
	return new Promise(
			resolve=>{
				let now = new Date();
				let day_b4 = new Date(now.getTime() - 86400000);
				let day_aft = new Date(now.getTime() + 86400000);

				let basic_data = {
					'YEAR' : `${now.getFullYear()}`,
					'MONTH': now.getMonth() >=9  ? `${now.getMonth() + 1}` : `0${now.getMonth() + 1}`,
					'DATE' : now.getDate() >=10  ? `${now.getDate()}` : `0${now.getDate()}`,
					'DAY' : `${now.getDay()}`,
					'HOUR' : now.getHours() >=10  ? `${now.getHours()}` : `0${now.getHours()}`,
					'MINUTE' : now.getMinutes() >=10  ? `${now.getMinutes()}` : `0${now.getMinutes()}`,
					'SECOND' : now.getSeconds() >=10  ? `${now.getSeconds()}` : `0${now.getSeconds()}`,
				}

				let day_b4_data = {
					'YEAR' : `${day_b4.getFullYear()}`,
					'MONTH': day_b4.getMonth() >=9  ? `${day_b4.getMonth() + 1}` : `0${day_b4.getMonth() + 1}`,
					'DATE' : day_b4.getDate() >=10  ? `${day_b4.getDate()}` : `0${day_b4.getDate()}`,
					'DAY' : `${day_b4.getDay()}`,
					'HOUR' : day_b4.getHours() >=10  ? `${day_b4.getHours()}` : `0${day_b4.getHours()}`,
					'MINUTE' : day_b4.getMinutes() >=10  ? `${day_b4.getMinutes()}` : `0${day_b4.getMinutes()}`,
					'SECOND' : day_b4.getSeconds() >=10  ? `${day_b4.getSeconds()}` : `0${day_b4.getSeconds()}`,
				}

				let day_aft_data = {
					'YEAR' : `${day_aft.getFullYear()}`,
					'MONTH': day_aft.getMonth() >=9  ? `${day_aft.getMonth() + 1}` : `0${day_aft.getMonth() + 1}`,
					'DATE' : day_aft.getDate() >=10  ? `${day_aft.getDate()}` : `0${day_aft.getDate()}`,
					'DAY' : `${day_aft.getDay()}`,
					'HOUR' : day_aft.getHours() >=10  ? `${day_aft.getHours()}` : `0${day_aft.getHours()}`,
					'MINUTE' : day_aft.getMinutes() >=10  ? `${day_aft.getMinutes()}` : `0${day_aft.getMinutes()}`,
					'SECOND' : day_aft.getSeconds() >=10  ? `${day_aft.getSeconds()}` : `0${day_aft.getSeconds()}`,
				}


				basic_data['YYMMDD'] = basic_data['YEAR'] + basic_data['MONTH'] + basic_data['DATE'];

				basic_data['TIMESTAMP'] = basic_data['YYMMDD'] + basic_data['HOUR'] + basic_data['MINUTE'] + basic_data['SECOND'] + now.getMilliseconds();

				basic_data['BYYMMDD'] = day_b4_data['YEAR'] + day_b4_data['MONTH'] + day_b4_data['DATE'];

				basic_data['AYYMMDD'] = day_aft_data['YEAR'] + day_aft_data['MONTH'] + day_aft_data['DATE'];

				resolve(basic_data);
			}
		);
}

const transformString = async (expression) => {
	let sandbox = await getMagicViarable();
	let ctx = vm.createContext(sandbox);
	return vm.runInNewContext('`'+expression+'`', ctx);
}

const generateVersion = (start, peroid) => {
	let now = new Date();
	return parseInt((now.getTime() - start.getTime()) / 1000 / peroid )
} 

const getLastValues  = async (id, exclude_version) => {
	let rule = await loadrule(id);
	if(exclude_version === 'DEFAULT')exclude_version = rule['version'] ? await transformString(rule['version']) : generateVersion(rule['schedule_start'], rule['schedule_peroid']);
	//let version = current_version || (rule['version'] ? await transformString(rule['version']) : generateVersion(rule['schedule_start'], rule['schedule_peroid']));

	let query = {'rule':id};

	if(exclude_version)query['version'] = {'$ne':exclude_version};

	return new Promise(resolve=>{
		datascol.find(query, ['message','show','values','version','updated','created'], {"created" : -1}, 1, 1, result => {
			if(result.list && result.list.length>0){
				let doc = result.list[0];
				let sdoc = {
					'version' : doc['version'],
					'message' : doc['message'],
					'show' : doc['show'],
					'updated' : doc['updated'],
					'created' : doc['created']
				}
				if(doc.hasOwnProperty('values')){
					sdoc = Object.assign(sdoc, doc['values']);
				}
				resolve(sdoc)
			}else resolve({});
	    });
	});
}

const getPreviousNValues = async (id, n) => {
	let rule = await loadrule(id);
	exclude_version = rule['version'] ? await transformString(rule['version']) : generateVersion(rule['schedule_start'], rule['schedule_peroid']);

	let query = {'rule':id};

	if(exclude_version)query['version'] = {'$lt':exclude_version};

	return new Promise(resolve=>{
		datascol.find(query, ['message','show','values','version','updated','created'], {"version" : -1}, 1, n, result => {
			if(result.list && result.list.length>0){
				let doc = result.list[0];
				let sdoc = {
					'version' : doc['version'],
					'message' : doc['message'],
					'show' : doc['show'],
					'updated' : doc['updated'],
					'created' : doc['created']
				}
				if(doc.hasOwnProperty('values')){
					sdoc = Object.assign(sdoc, doc['values']);
				}
				resolve(sdoc)
			}else resolve({});
	    });
	});
}

const getValuesByVersion  = async (id, version) => {
	let query = {'rule':id,'version':version};

	return new Promise(resolve=>{
		datascol.find(query, ['message','show','values','version','updated','created'], {"created" : -1}, 1, 1, result => {
			if(result.list && result.list.length>0){
				let doc = result.list[0];
				let sdoc = {
					'version' : doc['version'],
					'message' : doc['message'],
					'show' : doc['show'],
					'updated' : doc['updated'],
					'created' : doc['created']
				}
				if(doc.hasOwnProperty('values')){
					sdoc = Object.assign(sdoc, doc['values']);
				}
				resolve(sdoc)
			}else resolve({});
	    });
	});
}

const getSandbox = async (id, caller='scheduler') => {
	let basic_object = {
		'CALLER' : caller,
		'RULE':id,
		'procedure':procedure,
		'request' : requestHelper.request,
		'cheerio' : requestHelper.cheerio,
		'phantom' : requestHelper.phantom,
		'getJson' : requestHelper.getJson,
		'getDocument' : requestHelper.getDocument,
		'getBrowserDocument' : requestHelper.getBrowserDocument,
		'getChromeDocument': requestHelper.getChromeDocument,
		'snapshotByElement': requestHelper.snapshotByElement,
		'snapshotByPosition': requestHelper.snapshotByPosition,
		'iconv' : requestHelper.iconv,
		'retryCheck' : requestHelper.retryCheck,
		'table2array' : requestHelper.table2array,
		'array2table' : textHelper.array2table,
		'pnSyntax' : textHelper.pnSyntax,
		'percentSyntax' : textHelper.percentSyntax,
		'quoteChange': textHelper.quoteChange,
		'quoteChangeSyntax': textHelper.quoteChangeSyntax,
		'dateFormat' : stringUtil.dateFormat,
		'getTextFromHtml' : stringUtil.getTextFromHtml,
		'lookForPreviousNDay' : textHelper.lookForPreviousNDay,
		'lookForNextNDay' : textHelper.lookForNextNDay,
		'getLastValues' : getLastValues,
		'getValuesByVersion' : getValuesByVersion,
		'getPreviousNValues' : getPreviousNValues,
		'sendMail' : mailer.send,
		'sleep': sleep,
		'mysql' : mysql,
		'mongodb' : mongodb,
		'redis' : redis,
		'elasticsearch' : elasticsearch,
		'nodejieba' : nodejieba,
		'crypto': crypto,
		'Async': Async,
		'sendMQ' : mq.publish,
		'consumeMQ' : mq.consumeOnce,
		'publishKafka': kafka.publish,
		'consumeKafka':kafka.consumeOnce,
		'qiniu': qiniu,
		'seneca': seneca
	}
	return Promise.resolve(Object.assign(basic_object, await getMagicViarable()));
}

const getCategories = async (zone) =>{
	let ret = [];
	let data_zone_ret = await data_zone.get();
	let datazones = data_zone_ret ? data_zone_ret['data_zone'] : [];

	for(let z of datazones){
		if(z['id'] == zone){
			ret = z['categories'];
			break;
		}
	}
	return ret;
}

const loadrule = async (id) => {
	return new Promise(resolve=>{
		rulescol.get(id, null, result => {
        	resolve(result);
        });
	});
}

const loadrules = async (zone) =>{
	// let query = {'valid':true}
	let query = {}
	let categories = await getCategories(zone);
	if(zone && zone != 'ALL')query['category'] = {"$in":categories};
	return new Promise(resolve=>{
		rulescol.find(query, null, {'schedule_peroid':1}, 100000, 1, result => {
        	resolve(result.list);
        });
	});
}

const loadnewrules = async (zone) =>{
	let query = {'is_new':true}
	let categories = await getCategories(zone);
	if(zone && zone != 'ALL')query['category'] = {"$in":categories};
	return new Promise(resolve=>{
		rulescol.find(query, null, {'schedule_peroid':1}, 100000, 1, result => {
        	resolve(result.list);
        });
	});
}


const runcode = async (id, code, caller='scheduler') => {
	let sandbox = await getSandbox(id, caller);
	let ctx = vm.createContext(sandbox);
	return vm.runInNewContext(code, ctx);
}

const runscript = async (id, code, caller='scheduler') => {
	let sandbox = await getSandbox(id, caller);
	let script = new vm.Script(code);
	return script.runInNewContext(sandbox);
}

const evalProxy = async(code) =>{
	return eval(`(()=>{${code}})()`);
}

const runAsyncCodeUseEvalProxy = async (id, code, caller='scheduler') =>{
	let run_ticket = Math.ceil(Math.random() * 10000000);
	let s = new Date().getTime();
	logger.debug('start run '+id+' ticket: '+run_ticket);
	let sandbox = await getSandbox(id, caller);
	let proxy = new Proxy(sandbox, {
	    has(target, key) {
	      return true; 
	    }
	});
	let ret = await evalProxy.call(proxy, code);
	logger.debug('finish run '+id+' use eval proxy, cost: '+(new Date().getTime() - s)+'ms, ticket: '+run_ticket);
	return ret;
}

const runAsyncCodeUseProxyFunc = async (id, code, caller='scheduler') => {
	let run_ticket = Math.ceil(Math.random() * 10000000);
	let s = new Date().getTime();
	logger.debug('start run '+id+' ticket: '+run_ticket);
	let sandbox = await getSandbox(id, caller);
	let fn = new AsyncFunction('sandbox', `with(sandbox){${code}}`);
	let proxy = new Proxy(sandbox, {
	    has(target, key) {
	      return true; 
	    }
	});
	let ret = await fn(proxy);
	logger.debug('finish run '+id+' use proxy function, cost: '+(new Date().getTime() - s)+'ms, ticket: '+run_ticket);
	return ret;
}

const runAsyncCodeUseScript = async (id, code, caller='scheduler') => {
	let run_ticket = Math.ceil(Math.random() * 10000000);
	let s = new Date().getTime();
	logger.debug('start run '+id+' ticket: '+run_ticket);
	let ret = await runscript(id, `(async () =>{${code}})()`, caller);
	logger.debug('finish run '+id+' use vm script, cost: '+(new Date().getTime() - s)+'ms, ticket: '+run_ticket);
	return ret;
}

const runAsyncCode = async (id, code, caller='scheduler') => {
	let run_ticket = Math.ceil(Math.random() * 10000000);
	let s = new Date().getTime();
	logger.debug('start run '+id+' ticket: '+run_ticket);
	let ret = await runcode(id, `(async () =>{${code}})()`, caller);
	logger.debug('finish run '+id+' use vm, cost: '+(new Date().getTime() - s)+'ms, ticket: '+run_ticket);
	return ret;
}

/**
 * [save data to mongo]
 * @param  {[dict]} rule    [description]
 * @param  {[string]} version [description]
 * @param  {[dist]} data    [description]
 * @return {[promise]}         [resolve true: new recored, false: update record]
 */
const data2mongo = async (rule, version, data) => {
	if(typeof rule == 'string')rule = await loadrule(rule);
	let id = rule['_id'] + '-' + version;
	return new Promise(resolve=>{
		datascol.get(id,null,ret=>{
			let doc = {
				'name' : rule['name'],
				'rule' : ''+(typeof rule['_id'] == 'object' ? rule['_id'].valueOf() : rule['_id']),
				'category' : rule['category'],
				'version' : version,
				'updated' : new Date(),
				'show_desktop' : rule['show_desktop'] || false
			}
			if(data['message']){
				doc['message'] = data['message'];
				delete data['message'];
			}
			if(data['show']){
				doc['show'] = data['show'];
				delete data['show'];
			}
			for(let d in data){
				if(d.startsWith('$'))delete data[d];
			}
			if(!objectUtil.isEmpty(data))doc['values'] = data;
			if(!objectUtil.isEmpty(ret)){
				datascol.update(id, doc, false, false, _=>{
					resolve(false);
				});
			}else{
				doc['_id'] = id;
				doc['created'] = doc['updated'];
				datascol.save(doc, _=>{
					resolve(true);
				});
			}
		});
	});
}

const updateScheduleStatus = async (id, err_count) =>{
	let updoc = {'last_schecule':new Date()};
	if(err_count >=0 )updoc['error_count'] = err_count
	return new Promise(resolve=>{
		rulescol.update(id, updoc, false, false, _=>{
			resolve();
		});
	});
}

const markOldRule = async (id) =>{
	return new Promise(resolve=>{
		rulescol.update(id, {'is_new':false}, false, false, _=>{
			resolve();
		});
	});
}

const autoVersion = async (rule) =>{
	if(typeof rule == 'string')rule = await loadrule(rule);
	let schedule_start = rule['schedule_start'] || new Date(0);
	let version = rule['version'] ? await transformString(rule['version']) : generateVersion(schedule_start, rule['schedule_peroid']);
	return version;
}

const crawl = async (id, force, para_dict={}, caller='scheduler') => {
	let rule = await loadrule(id)
	let schedule_left = -1;// >0 : schedule regullarly, 0: schedule immedietely, <0 : DO NOT shedule anymore, it's invalidate
	let schedule_result;
	if(rule && !objectUtil.isEmpty(rule)){
		if(rule['valid'] === true){
			logger.debug('start to crawl '+id+', forced: '+(force?'yes':'no'));
			let now = new Date();
			let schedule_start = rule['schedule_start'] || new Date(0);
			let last_schecule = rule['last_schecule'] || new Date(0);
			if(force || now.getTime() >= schedule_start.getTime() || !rule['last_schecule'] ){
				if(rule['code']){
					let err = false;
					try{
						let result = await runAsyncCode(id, rule['code'], caller);
						if(result){
							if(typeof result == 'function'){
								schedule_result = await objectUtil.callFunction(result, para_dict);
							}else{
								if(typeof result != 'object')result = {'message':result};
								logger.info('crawled '+id+', result: '+result['message']);
								let version = result['$version'] || (await autoVersion(rule));
								schedule_result = result;
								let isnew = await data2mongo(rule, version, Object.assign({},result));
								if(isnew)logger.debug('crawl new data for '+id);
								else logger.debug('update crawled data for '+id);
							}
						}
					}catch(e){
						logger.error(id+' crawl error: '+e.toString());
						err = true;
					}
					let err_count = err ? (rule['error_count']||0 + 1) : 0;
					await updateScheduleStatus(id, err_count);
				}
			}else{
				logger.warn(id+', the first schedule is '+schedule_start+', the last scheduled is '+last_schecule+', and the conditions for re-schedule have not yet been met');
			}
		}else{
			logger.debug(id+' is invalidate rule, check it next round.');
		}
		schedule_left = calculateScheduleDelayTime(rule['schedule_start'], rule['schedule_peroid']);
		let t_date = new Date(new Date().getTime() + schedule_left);
		logger.debug(rule['_id']+' may crawl after '+schedule_left+' ms, that is '+stringUtil.dateFormat(t_date,'yyyy-MM-dd hh:mm:ss')+', schedule start at '+stringUtil.dateFormat(rule['schedule_start'],'yyyy-MM-dd hh:mm:ss')+', schedule peroid is '+rule['schedule_peroid']+'s');
	}
	return Promise.resolve([schedule_result, schedule_left]);
}

const procedure = async (id, para_dict={}, caller='scheduler')=>{
	let rets = await crawl(id, true, para_dict, caller);
	return rets[0];
}

const goCrawl = async (id) => {
	if(typeof id == 'object'){
		id = ''+id.valueOf();
	}
	let delay = (await crawl(id))[1];
	if(delay >= 0){
		let t_date = new Date(new Date().getTime() + delay);
		logger.debug('re-crawl '+id+' after '+ delay +'ms, that is '+stringUtil.dateFormat(t_date,'yyyy-MM-dd hh:mm:ss'));
		setTimeout(_=>{
			goCrawl(id);
		}, delay);
	}else{
		logger.debug(id+' not found in db, do not schedule anymore');
	}	
}


const calculateScheduleDelayTime = (schedule_start, schedule_peroid) =>{
	if(schedule_peroid<=0)return -1;
	let now_v = new Date().getTime();
	let schedule_start_v = schedule_start.getTime();
	let schedule_peroid_misd = schedule_peroid * 1000;

	let inc = 1;

	while(schedule_start_v + schedule_peroid_misd * inc <  now_v){
		inc++;
	}

	return (schedule_start_v + schedule_peroid_misd * inc) - now_v;
}


const doSchedule = async (rules) =>{
	let now = new Date();
	for(let rule of rules){
		let schedule_start = rule['schedule_start'] || new Date(0);
		let last_schecule = rule['last_schecule'] || new Date(0);
		let delay = 0;
		if(rule['valid']==true && rule['schedule_peroid']>0){
			if(now.getTime() >= schedule_start.getTime()){
				/*
				if(!rule['last_schecule']){
					delay = 0;
				}else{
					if(now.getTime() - last_schecule.getTime() >= rule['schedule_peroid']/1000){
						delay = last_schecule.getTime() + rule['schedule_peroid'] * 1000  - now.getTime();
					}
				}
				*/
				delay = calculateScheduleDelayTime(schedule_start, rule['schedule_peroid']);
			}else{
				delay = schedule_start.getTime() - now.getTime();
			}
		}
		await markOldRule(rule['_id']);
		let t_date = new Date(new Date().getTime() + delay);
		logger.info('crawl '+rule['_id']+' after '+delay+' ms, that is '+stringUtil.dateFormat(t_date,'yyyy-MM-dd hh:mm:ss')+', schedule start at '+stringUtil.dateFormat(schedule_start,'yyyy-MM-dd hh:mm:ss')+', schedule peroid is '+rule['schedule_peroid']+'s');
		if(delay >0)setTimeout(_=>{goCrawl(rule['_id']);},delay);
		else setImmediate(_=>{goCrawl(rule['_id']);});
	}
}

const schedule = async (zone) => {
	logger.debug('start schedule for zone '+zone);
	let rules = await loadrules(zone);
	await doSchedule(rules);
	checkAndLoadNewRules(zone);
}

const checkAndLoadNewRules = async (zone) =>{
	logger.debug('check new rules for zone '+zone);
	let rules = await loadnewrules(zone);
	if(rules && rules.length>0){
		logger.debug('check new rules, found '+rules.length+' new rules, load them...');
		await doSchedule(rules);
	}else logger.debug('check new rules, no new rule...');
	setTimeout(_=>{
		checkAndLoadNewRules(zone);
	},CHECK_NEW_RULES_INTERVAL);
}

process.on('message',msg=>{
	if(msg.startsWith('RELY-IN-')){
		let delayTime = parseInt(msg.replace('RELY-IN-',''));
		setTimeout(_=>{
			logger.info('report, I am alive!');
			process.send && process.send('REPORT-'+new Date().getTime());
		},delayTime);
	}
});

if(module.parent){
	module.exports = {
		'crawl' : crawl,
		'runAsyncCode' : runAsyncCode,
		'runAsyncCodeUseProxyFunc': runAsyncCodeUseProxyFunc,
		'runAsyncCodeUseEvalProxy': runAsyncCodeUseEvalProxy,
		'runAsyncCodeUseScript': runAsyncCodeUseScript,
		'getSandbox': getSandbox,
		'autoVersion': autoVersion,
		'data2mongo': data2mongo,
		'updateScheduleStatus': updateScheduleStatus,
		'loadrule': loadrule
	}
}else{
	(async () => {
		if(process.argv.length > 2){
			if(process.argv[2].length > 20)crawl(process.argv[2], true);
			else schedule(process.argv[2]);
		}else schedule('ALL');
		// await crawl('5ae194f5c8685440b10055ca',true);
		// let values = await getValuesByVersion('5ae2e375450137382befdd58','2018-04-27');
		// console.log(values);
	})();
}