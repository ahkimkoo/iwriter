const mongo = require('../lib/mongo-ndbc.js');
const settings = require('../settings-' + (process.env.profile || 'dev') + '.json');
const configcol = new mongo.MongoCollection(settings['mongo_connect_url'], 'config', 5);


let instance_dict = {};

const isEmpty = function(obj){
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
}

class DynamicConfig{ 
    constructor(name, expired) {
        if(!instance_dict.hasOwnProperty(name)){
              instance_dict[name] = this;
              this.name = name;
              this.expired = expired*1000;
              this._refresh_data(true,()=>{
              	Promise.resolve(instance_dict[name]);
              });
        }
        return instance_dict[name];
    }

    _refresh_data(loop){
    	let self = this;
    	return new Promise(resolve=>{
    		configcol.get({'name':self.name}, null, result => {
				if(result && !isEmpty(result)){
					self.json = result;
					if(loop)setTimeout(()=>{self._refresh_data(true)}, self.expired);
					resolve(result);
				}else {
					if(loop)setTimeout(()=>{self._refresh_data(true)}, self.expired/2);
					resolve(null);
				} 
		    });
    	});
    }

    get(){
    	let self = this;
    	if(self.json && !isEmpty(self.json)){
    		return Promise.resolve(self.json);
    	}else {
    		return self._refresh_data(false);
    	}
    }
}

exports.Instance = DynamicConfig;