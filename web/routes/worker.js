const worker = require('../../processer/worker.js');
const DynamicConfig = require('../../lib/DynamicConfig.js');
const mailer = require('../../lib/mailer.js');
const mq = require('../../lib/RabbitMQ.js');

const checkInterval = 60000;//1 min
const notifyThreshold = 5;//notify while exceed 5 times
const notifyTimesLimit = 2;
var chekNullTimes = 0;
var notifyTimes = 0;

const mail2admin = (subject, text, body, mail_receiver, mail_sender, mail_conf) =>{
	return new Promise(resolve=>{
		mailer.send(
			mail_receiver, 
			subject, 
			text, 
			body, 
			mail_conf, 
			mail_sender
		).then(_=>{
			resolve(true);
		}).catch(e=>{
			resolve(false);
		});
	});
}

const sendWechat2admin = (message, mq_receiver, mq_conf) =>{
	return new Promise(resolve=>{
		mq.publish(
			mq_conf['connect_url'],
			mq_conf['exchange'],
			{
				'to':mq_receiver,
				'message':message
			}
		).then(_=>{
			resolve(true);
		}).catch(e=>{
			resolve(false);
		});
	});
}

const checkWorker = (project_name, mail_receiver, mail_sender, mail_conf, mq_receiver, mq_conf) =>{
	worker.getLiveWorkers().then(workers=>{
		if(workers.length<1)chekNullTimes++;
		else {
			chekNullTimes = 0;
			notifyTimes = 0;
		}
		if(chekNullTimes>=notifyThreshold && notifyTimes<notifyTimesLimit){
			mail2admin(
				project_name+'没有启动任何worker',
				chekNullTimes+'次检查发现'+project_name+'没有启动任何worker， 请检查！', 
				null, 
				mail_receiver, 
				mail_sender, 
				mail_conf
				).then(ok=>{
					sendWechat2admin(
						'☑'+project_name+(notifyTimes>0?'还是':'')+'没有启动任何worker， 请检查！',
						mq_receiver, 
						mq_conf
					).then(ok=>{
						notifyTimes++;
						setTimeout(checkWorker, checkInterval, project_name, mail_receiver, mail_sender, mail_conf, mq_receiver, mq_conf);
					});	
				});
		}else {
			setTimeout(checkWorker, checkInterval, project_name, mail_receiver, mail_sender, mail_conf, mq_receiver, mq_conf);
		}
	})
}

module.exports = function (router, settings) {
	let logger = settings.logger;

	if(settings['check_worker']){
		checkWorker(
			settings['project_name'],
			settings['check_worker_mail_receiver'],
			settings['check_worker_mail_sender'],
			settings['mail_config'],
			settings['check_worker_wechat_receiver'],
			settings['check_worker_mq_config']
			);
	}

	let data_zone = new DynamicConfig.Instance('data_zone', 300);

	const getZones = function(){
		return data_zone.get().then(data_zone_ret=>{
			let zones = {'ALL':'所有数据分区'};
			if(data_zone_ret){
				let datazones = data_zone_ret['data_zone'];
				for(let z of datazones){
					zones[z['id']] = z['name']+'（'+z['categories'].join('，')+'）';
				}
			}else{

			}
			return Promise.resolve(zones);
		});
	}

	router.get('/worker/list', function (req, res) {
		getZones().then(zones=>{
			worker.getLiveWorkers().then(workers=>{
				res.render('worker/list',{
			    	'workers' : workers,
			    	'zones' : zones
			    });
			});
		});
	});

	router.post('/worker/run', function (req, res) {
		let zone = req.body.zone;
		worker.runWorker(zone, req.protocol + "://" + req.get('host')).then(resolve=>{
			res.redirect('/worker/list');
		});
	});

	router.get('/worker/kill/:zone', function (req, res) {
		let zone = req.params.zone;
		worker.killWorker(zone);
	    res.redirect('/worker/list');
	});

	router.get('/worker/view/:zone', function (req, res) {
		let zone = req.params.zone;
		getZones().then(zones=>{
			res.render('worker/view',{
				'zone' : zone,
				'name' : zones[zone]
			});
		});
	});

	router.get('/worker/console', function (req, res) {
		res.render('worker/console');
	});
}