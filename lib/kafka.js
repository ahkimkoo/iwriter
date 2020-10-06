const { Kafka } = require('kafkajs')

const publish = async (brokers, topic, data, client_id='iw') => {
	let kafka = new Kafka({
	  'clientId': client_id,
	  'brokers': brokers
	});
	let producer = kafka.producer();

	await producer.connect();
	await producer.send({
		topic: topic,
		messages: [
		  { value: JSON.stringify(data) }
		]
	});
	await producer.disconnect();
}

const consume = async (brokers, topic, handler, groupid='iwg', client_id='iw') => {
	let kafka = new Kafka({
	  'clientId': client_id,
	  'brokers': brokers
	});
	let consumer = kafka.consumer({ 'groupId': groupid });
	await consumer.connect()
	await consumer.subscribe({ topic: topic, 'fromBeginning': true });
	await consumer.run({
	    'eachMessage': async ({ topic, partition, message }) => {
	        // console.log({
	        //     key: message.key.toString(),
	        //     value: message.value.toString(),
	        //     headers: message.headers,
	        // });
	        await handler(message.value.toString());
	    },
	});
}

const consumeOnce = async (brokers, topic, handler, idel_limit=30000, groupid='iwg', client_id='iw') => {
	let kafka = new Kafka({
	  'clientId': client_id,
	  'brokers': brokers
	});
	let consumer = kafka.consumer({ 'groupId': groupid });
	await consumer.connect()
	await consumer.subscribe({ topic: topic, 'fromBeginning': true });
	let idel =  true;
    let consume_count = 0;
    let timer;
    
    return new Promise(resolve=>{
    	let itvr = setInterval(async(_)=>{
	        if(idel){
	        	await consumer.stop();
	            await consumer.disconnect();
	            clearInterval(itvr);
	            resolve(consume_count);
	        }
	    }, idel_limit);

	    consumer.run({
	    	'autoCommit': false,
		    'eachMessage': async ({ topic, partition, message }) => {
		        idel = false;
	            if(timer){
	                clearTimeout(timer);
	                timer = null;
	            }
		        await handler(message.value.toString());
		        await consumer.commitOffsets([{topic, partition, 'offset':(parseInt(message.offset)+1).toString()}]);
		        consume_count++;
		        timer = setTimeout(_=>{
	                idel = true;
	            }, idel_limit);
		    },
		});
    });
}

exports.consume = consume;
exports.consumeOnce = consumeOnce;
exports.publish = publish;


// (async()=>{
	// publish(['192.168.1.10:9092'], 'test', {'message':'ok....'});
	// consume(['192.168.1.10:9092'], 'test', (msg)=>{
	// 	console.log(msg);
	// });
	// let c = await consumeOnce(['192.168.1.10:9092'], 'test', (msg)=>{
	// 	console.log(msg);
	// },30000);
	// console.log('count:', c);
	// process.exit(1);
// })()