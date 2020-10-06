const crawler = require('../../processer/crawler.js');
const RULE_ID = 'weather';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		const APIKEYS = [
	'a07876819a2d10fa19f3b52d350b19e3',
	'58c0ec31a4680ce970fbaaeed3bf2198',
	'9b918bbbbbd0797537e43ce87b6f71a4',
	'b109ae039294fb19da41cf0de7dcacd6',
	'c8817ea421373d658012c8f76b6c06f6',
	'361b9c3f7a1273add4be749b95e75e73',
	'b6575ae2b0be8bfbe6139185440040f3',
	'2331c1312f67ec9fdeb2be60cc1d6218',
	'bea0c50eaca99200db7497a845141a67',
	'51d5e6e7d73d4c41a557018161c2526b',
	'c6b5f8efaa25610d78800cebfa914e87',
	'762e85db0bff40b01ffcd3dca6aac122',
	'0f7f08bde2ab486d89764b73cf44958f',
	'75447eda71b86920117e25c5cba2f287',
	'7ff0a7ba42af87c99b31fea24be7c21c',
	'f1fdfb8d50407accbdfad979ebf8aa27'
];

const getApiKey = function(){
	return APIKEYS[parseInt(Math.random()*APIKEYS.length)];
}

/**
 * @param  latitude, eg: 31.23333
 * @param  longitude, eg: 121.466667
 * @return ({ weather: 'Clouds',
 * description: '多云',
 * icon: 'http://openweathermap.org/img/w/04d.png',
 * temperature: 9,
 * pressure: 1031,
 * humidity: 66,
 * temperature_max: 9,
 * temperature_min: 9,
 * city: 'Shanghai Shi',
 * cityid: 1796231,
 * country: 'CN',
 * rain: {},
 * snow: {},
 * time: Tue Feb 23 2016 14:00:00 GMT+0800 (CST) })
 */
const current = async function(latitude=31.23333, longitude=121.466667){
	let appid = getApiKey();
	var options = {
	  hostname: 'api.openweathermap.org',
	  port: 80,
	  path: `/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${appid}&units=metric&lang=zh_cn&cnt=10&cluster=yes`,
	  method: 'GET',
	  headers: {}
	};
    
    return new Promise(resolve=>{
        request(`http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${appid}&units=metric&lang=zh_cn&cnt=10&cluster=yes`, 
        function (error, response, body) {
            if(!error && response.statusCode==200){
                try{
        	  		res_body = JSON.parse(body);
        		    if(res_body && res_body['weather'])resolve({
        		    	'weather' : res_body['weather'][0]['main'],
        		    	'description' : res_body['weather'][0]['description'],
        		    	'icon' : `http://openweathermap.org/img/w/${res_body['weather'][0]['icon']}.png`,
        		    	'temperature' : res_body['main']['temp'],
        		    	'pressure' : res_body['main']['pressure'],
        		    	'humidity' : res_body['main']['humidity'],
        		    	'temperature_max' : res_body['main']['temp_max'],
        		    	'temperature_min' : res_body['main']['temp_min'],
        		    	'rain' : res_body['rain']||{},
        		    	'snow' : res_body['snow']||{},
        		    	'city' : res_body['name'],
        		    	'cityid' : res_body['id'],
        		    	'country' : res_body['sys']['country'],
        		    	'time' : new Date(res_body['dt']*1000)
        		    });
        	    	else resolve({});
        	  	}catch(e){
        	  		resolve({'error':e.toString()});
        	  	}
            }else resolve({});
        });
    });
}

/*return current(31.23333, 121.466667);*/

return current;


/*embed script end*/
	}
}

(async ()=>{
	let result = await evalFuc();
	if(typeof result == 'function'){
		console.log(RULE_ID+' is Function');
	}else{
		if(typeof result != 'object')result = {'message':result};
		console.log('crawled '+RULE_ID+', result: '+result['message']);
		let version = result['$version'] || (await crawler.autoVersion(RULE_ID));
		let isnew = await crawler.data2mongo(RULE_ID, version, Object.assign({},result));
		await crawler.updateScheduleStatus(RULE_ID, -1);
		if(isnew)console.log('crawl new data for '+RULE_ID);
		else console.log('update crawled data for '+RULE_ID);
	}
	process.exit(0);
})();