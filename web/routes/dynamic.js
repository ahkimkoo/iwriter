const mongo = require('../../lib/mongo-ndbc.js');
const mimeTypes = require('../../lib/mime-types.js');

const isEmpty = function(obj){
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) return false;
    }
    return true;
}

module.exports = function(router, settings) {
	router.get('/dynamic/:colname/:filename',(req,res)=>{
		let collection_name = req.params.colname.replace('-','_');
		let filename = req.params.filename;
		let extname;
		let dot_pos = filename.lastIndexOf('.');
		if(dot_pos>=0) extname = filename.substring(dot_pos);
		let col = new mongo.MongoCollection(settings['mongo_connect_url'], collection_name, 1);
		col.get({'name':filename}, ['code','language'], result => {
			if(result && !isEmpty(result)){
				if(!extname)extname = result['language'];
				let memetype = mimeTypes.lookup(extname) || 'application/octet-stream';
				res.set('Content-Type', memetype);
		        res.end(result?result['code']:'');
			}else{
				res.status(404).end();
			}
        });
	});
}