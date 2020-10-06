const crawler = require('../../processer/crawler.js');
const RULE_ID = 'get-163-music';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		/*
 * url
 */
 
async function get163music(url=''){
    let links = await getChromeDocument(url, 2000,{
        'evaluate' : _=>{
            let link_eles = document.getElementById('g_iframe').contentWindow.document.querySelectorAll('.m-table tr[id] span.txt>a[href]');
            let links = [];
            let linkstring = [];
            link_eles.forEach((ele,i)=>{
                let id =  ele.href.replace(/.*id=(\d+).*/,'$1');
                let title = ele.querySelector('b').title;
                let down_link = 'http://music.163.com/song/media/outer/url?id='+id+'.mp3'
                links.push([id,title,down_link]);
                linkstring.push('curl -L -o "songs/'+title.replace(/&[^;];/g,'').trim().replace(/\s+/g,'-').replace(/[^\u4e00-\u9fa5a-z0-9\-]+/ig,'')+'.mp3" "'+down_link+'"');
            });
            return linkstring.join(' && ');
        }
    });
    return links;
}

/*return await get163music('http://music.163.com/#/playlist?id=361122635');*/

return get163music;
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