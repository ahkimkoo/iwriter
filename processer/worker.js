const {spawn,fork} = require('child_process');
const os = require('os');
const path = require('path');
const mongo = require('../lib/mongo-ndbc.js');
const getSocketIO = require('../web/socket.io.handle.js').getSocketIO;
const DynamicConfig = require('../lib/DynamicConfig.js');
const stringUtil = require('../lib/string-util.js');
const textHelper = require('./text-helper.js');
const logger = require('../lib/LogUtil.js').logger;

const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');
const workercol = new mongo.MongoCollection(settings['mongo_connect_url'], 'liveworkers', 5);

const data_zone = new DynamicConfig.Instance('data_zone', 300);

const CHECK_IN_PEROID = 30;

// zone: {'proc':child_process,'start_time':longvalue}
var workers = {};

const getZoneName = async (zone, des = false) =>{
	let data_zone_ret = await data_zone.get();

	let datazones = data_zone_ret ? data_zone_ret['data_zone'] : [];

	let name = 'unknown';
	if(zone == 'ALL')name = '所有';
	else{
		for(let z of datazones){
			if(z['id'] == zone){
				name = z['name'];
				if(des) name += '（'+z['categories'].slice(0,10).join('，')+'）'; 
				break
			}
		}
	}

	return Promise.resolve(name);
}

const getLiveWorkers = async () =>{
	let ret = [];
	for(let w of Object.keys(workers)){
		let zoneName = await getZoneName(w);
		ret.push([w, zoneName, textHelper.getAppropiateDateDescription(workers[w]['start_time'])]);
	}
	return ret;
}

const getCloudLiveWorkers = async () =>{
	return new Promise(resolve=>{
		workercol.find({},null,{'created':-1},10000,1,ret=>{
			resolve(ret.list);
		});
	});
}

const getMixedLiveWorkers = async () =>{
	let cloud_live_workers = await getCloudLiveWorkers();
	for(let i=0; i<cloud_live_workers.length; i++){
		if(workers.hasOwnProperty(cloud_live_workers[i]['_id']))cloud_live_workers[i]['own'] = true;
		else cloud_live_workers[i]['own'] = false;

		cloud_live_workers[i]['livetime'] = textHelper.getAppropiateDateDescription(cloud_live_workers[i]['created']);
		cloud_live_workers[i]['checkin'] = stringUtil.dateFormat(cloud_live_workers[i]['checkin'],'yyyy-MM-dd hh:mm:ss');
	}
	return cloud_live_workers;
}

const checkWorkExist = async (zone) =>{
	let cloud_live_workers = await getCloudLiveWorkers();
	let cloud_live_workers_zone = cloud_live_workers.map(x=>x['_id']);
	return (zone=='ALL' && cloud_live_workers.length>0) ||cloud_live_workers_zone.indexOf(zone) >= 0 ||  cloud_live_workers_zone.indexOf('ALL') >= 0;
}


const checkIn = async (zone, fist_time=false) =>{
	if(workers.hasOwnProperty(zone)){
		let zonename = workers[zone]['zonename'];
		let hostname = workers[zone]['hostname'];
		let pid = workers[zone]['pid'];
		let address = workers[zone]['address'];
		let doc = {
					'host' : hostname,
					'pid' : pid,
					'address' : address,
					'zone' : zonename,
					'checkin' : new Date()
				};
		doc['created'] = fist_time ? new Date() : new Date(workers[zone]['start_time']); 
		return new Promise(resolve=>{
			workercol.update(
				zone,
				doc,
				false,
				true,
				_=>{
					logger.debug('checkin worker '+zone+' on '+hostname+', pid '+pid+', address: '+address);
					resolve();
				}
			);
		});
	}else{
		logger.debug(zone+' not in local process, do not check in anymore');
	}	
}

const kickOut = async (zone) =>{
	let kill = workers[zone]['kill'];
	delete workers[zone];
	return new Promise(resolve=>{
		workercol.remove(
			zone,
			_=>{
				logger.debug('worker '+zone+' was took out from liveworkers');
				resolve(kill);
			}
		);
	});
}

const regWorker = async (zone, worker, address) =>{
	let hostname = os.hostname();
	let zonename = await getZoneName(zone,true);
	let pid = worker.pid;

	workers[zone] = {
		'proc' : worker,
		'start_time' : new Date().getTime(),
		'hostname' : hostname,
		'pid' : pid,
		'zonename' : zonename,
		'address' : address
	};

	return checkIn(zone, true).then(_=>{
		worker.send('RELY-IN-'+(CHECK_IN_PEROID - 5)*1000);
	});	
}

const runWorker = async (zone='ALL', address='') =>{
	if(await checkWorkExist(zone))return false;
	else{
		let  worker = spawn(
			'node',
			['processer/crawler.js',zone], 
			{
				// 'shell':'/bin/bash', 
				'cwd':path.resolve(__dirname,'..'), 
				stdio: [null, null, null, 'ipc'],
				'env':{
					'service': 'worker',
                    'child_no': Object.keys(workers).length,
                    'profile': process.env.profile,
                    'HOME': path.resolve(__dirname)
                }
			}
			);

		worker.stderr.on('data', (data) => {
			if(getSocketIO())getSocketIO().to(zone).emit('log', data.toString().replace(/\[[\d]+m/g,''));
		});
		
		
		worker.stdout.on('data', (data) => {
			if(getSocketIO())getSocketIO().to(zone).emit('log', data.toString().replace(/\[[\d]+m/g,''));
		});

		worker.on('message',data=>{
			if(data.startsWith('REPORT-')){
				checkIn(zone).then(_=>{
					worker.send('RELY-IN-'+(CHECK_IN_PEROID - 5)*1000);
				});
			}else logger.debug('message from child: '+data);
		});

		worker.on('close', (code) => {
		  logger.error(`crawler ${zone} child process closed with code ${code}`);
		  if(getSocketIO())getSocketIO().to(zone).emit('log', `${zone} child process closed with code ${code}`);
		  kickOut(zone).then(kill=>{
	  		if(!kill){
			  	logger.info(`restart crawler ${zone} in 1 min.`);
			  	if(getSocketIO())getSocketIO().to(zone).emit('log', `restart crawler ${zone} in 1 min.`);
			  	setTimeout(_=>{
			  		runWorker(zone, address);
			  	}, 60000);
			}
		  });	  
		});

		worker.on('SIGHUP', () => {
		  logger.error('Got SIGHUP signal.');
		});

		worker.on('error', (err) => {
			logger.error('worker '+zone+' error:'+err);
		  	if(getSocketIO())getSocketIO().to(zone).emit('log', 'worker process error:'+err);
		});

		worker.on('exit', (code) => {
			logger.error('worker '+zone+' exit, code:'+code);
		  	if(getSocketIO())getSocketIO().to(zone).emit('log', 'worker exit. code: '+code);
		});

		return regWorker(zone, worker, address);
	}
}

const killWorker = (zone) =>{
	if(workers.hasOwnProperty(zone)){
		workers[zone]['kill'] = true;
		workers[zone]['proc'].kill('SIGHUP');
	}
}

if(module.parent){
	module.exports = {
		'runWorker' : runWorker,
		'killWorker' : killWorker,
		'getLiveWorkers':getMixedLiveWorkers
	}
}else{
	runWorker('default');
}