const poolModule = require('generic-pool');
const redis = require('redis');

const redis_commands = require('./redis-commands.json');

let instances = {};

class RedisHelper {
    constructor(host, port, db, poolsize) {
    	let key = `${host}:${port}#${db}`;
        poolsize = poolsize||50;
    	if(!instances.hasOwnProperty(key)){
    		instances[key] = this;

    		this.redis_pool = poolModule.Pool({
			    name     : 'redis',
			    create   : function(callback) {
			        let redis_cli = redis.createClient(port,host);
			        redis_cli.select(db,function(error){
			            callback(error,redis_cli);
			        })
			    },
			    destroy  : function(client) {
			        client.quit();
			        client=null;
			    },
			    max      : poolsize,
			    min      : 0,
			    idleTimeoutMillis : 30000,
			    log : false
			});

    		this.wrapper();
    	}
    	return instances[key];
    }

    getClient(callback) {
        let self = this;
        self.redis_pool.acquire(function(err, client) {
            callback(err, client);
        });
    }

    releaseClient(client) {
        let self = this;
        self.redis_pool.release(client);
    }

    execute(cmd,...args){
        let cbfn = args.splice(args.length-1,1)[0];
        let self = this;
        self.redis_pool.acquire(function(err, client) {
            client[cmd].apply(client, args.concat(function(...vals){
                self.redis_pool.release(client);
                cbfn.apply(self, vals);
            }));
        });
        return self;
    }

    wrapper(){
        let self = this;
    	for(let c in redis_commands){
    		if(redis_commands.hasOwnProperty(c)){
    			self[c] = (...args) => {
		            return self.execute(c, ...args);
		        }
    		}
    	}
    }
}

module.exports = RedisHelper;