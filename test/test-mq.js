const mq = require('../lib/RabbitMQ.js');

(async ()=>{
	if(process.argv.length > 2){
		mq.publish('amqp://user:passwd@mq:5672/fenews', 'test_xchange', process.argv[2]);
	}else{
		mq.consumeOnce('amqp://user:passwd@mq:5672/fenews', 'test_xchange','test_queue', 10000, async(msg)=>{
			return console.log(msg);
		}).then(c=>{
			console.log('consume count:', c);
		}).catch(e=>{
			console.error('console error: ', e);
		});
	}
})()
