const amqplib = require('amqplib');

const consume = async (connect_url, in_exchange, in_queue, handler) => {
    return amqplib.connect(connect_url)
    .then(conn=>{
        return conn.createChannel()
        .then(ch=>{
            return ch.assertExchange(in_exchange, 'fanout', {'durable': true})
                    .then(_=>{
                        return ch.assertQueue(in_queue, {'exclusive': false})
                                .then(q=>{
                                    return ch.bindQueue(q.queue, in_exchange, '')
                                    .then(_=>{
                                        return ch.prefetch(2);
                                    })
                                    .then(_=>{
                                        return ch.consume(q.queue, async function(msg) {
                                            await handler(msg.content.toString());
                                            ch.ack(msg);
                                        }, {
                                            noAck: false
                                        });
                                    });   
                                });
                    }).catch(conn.close)
        });
    }).catch(err=>{
        return Promise.reject(err);
    });
}

/*
* break out while idel limitation exceeded.
 */
const consumeOnce = async (connect_url, in_exchange, in_queue, idel_limit, handler) => {
    if(!idel_limit || idel_limit<=100)idel_limit = 200;
    return amqplib.connect(connect_url)
    .then(conn=>{
        return conn.createChannel()
        .then(ch=>{
            return ch.assertExchange(in_exchange, 'fanout', {'durable': true})
                    .then(_=>{
                        return ch.assertQueue(in_queue, {'exclusive': false})
                                .then(q=>{
                                    return ch.bindQueue(q.queue, in_exchange, '')
                                    .then(_=>{
                                        return ch.prefetch(1);
                                    })
                                    .then(_=>{
                                        return new Promise(resolve=>{
                                            let idel =  true;
                                            let consume_count = 0;
                                            let timer;
                                            let itvr = setInterval(_=>{
                                                if(idel){
                                                    ch.close();
                                                    conn.close();
                                                    clearInterval(itvr);
                                                    resolve(consume_count);
                                                }
                                            }, idel_limit);
                                            ch.consume(q.queue, async function(msg) {
                                                idel = false;
                                                if(timer){
                                                    clearTimeout(timer);
                                                    timer = null;
                                                }
                                                await handler(msg.content.toString());
                                                consume_count++;
                                                ch.ack(msg);
                                                timer = setTimeout(_=>{
                                                    idel = true;
                                                }, idel_limit);
                                            }, {
                                                noAck: false
                                            });
                                        });
                                    });   
                                });
                    }).catch(err=>{
                        conn.close();
                        Promise.reject(err);
                    });
        });
    }).catch(err=>{
        return Promise.reject(err);
    });
}

const publish = async (connect_url, out_exchange, data) => {
    return amqplib.connect(connect_url)
    .then(conn=>{
        return conn.createConfirmChannel().then(ch=>{
            return ch.assertExchange(out_exchange, 'fanout', {'durable': true}).then(ok=>{
                if(typeof data == 'object')data = JSON.stringify(data);
                return ch.publish(out_exchange, '', new Buffer(data), {'deliveryMode': true});
            }).finally(_=>{
                ch.close();
                return Promise.resolve();
            });
        }).finally(_=>{
            conn.close();
            return Promise.resolve();
        });
    }).catch(err=>{
        return Promise.reject(err);
    });
}

exports.consume = consume;
exports.consumeOnce = consumeOnce;
exports.publish = publish;