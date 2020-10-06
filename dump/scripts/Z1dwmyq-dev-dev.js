const crawler = require('../../processer/crawler.js');
const RULE_ID = 'Z1dwmyq';
const PROFILE = 'dev';
process.env.profile = PROFILE;

const evalFuc = async () => {
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
/*embed script begin*/
		let pic  = await snapshotByElement('http://index.1688.com/alizs/keyword.htm?userType=purchaser&cat=66','//em[contains(text(),"医药、保养")]','.new>div.content:nth-child(2)',[0,0,0,-87],'url',{
    'headers':{'Cookie':'ali_ab=116.226.123.107.1526977142602.2; cna=Hn6BE1q1by8CAXTie2ucKIt8; hng=CN%7Czh-CN%7CCNY%7C156; lid=successage; ali_apache_track=c_mid=b2b-32409292|c_lid=successage|c_ms=1; last_mid=b2b-32409292; __last_loginid__=successage; _cn_slid_=y8GBorYscR; ali_beacon_id=116.226.123.107.1528767167142.966248.3; JSESSIONID=9L78Okkv1-o80a1KaIyhGKDTcPr6-z1QnwxQ-lioq; cookie2=1ec6e267a14cf0b3a365b98617679bba; t=e69c6d20ce1c4b0ae90f9cdb4dbd9d02; _tb_token_=ae777e357665; _alizs_cate_info_=15; _alizs_area_info_=1001; _alizs_user_type_=purchaser; alicnweb=touch_tb_at%3D1531729470542; _csrf_token=1531730502808; csg=7dc4f36d; ali_apache_tracktmp=c_w_signed=Y; tbsnid=FX7g8AkF8VJdZA5TozLdiK%2Be4u482q2rW5pO6YOCt6s6sOlEpJKl9g%3D%3D; _is_show_loginId_change_block_=b2b-32409292_true; _old_loginId_=b2b-successage; _current_loginId=successage; __cn_logon__=false; _tmp_ck_0=%2B6NHYr3ApFyIVPtVKGdSKk4JHREfIsy2%2FSeE50f7l%2By0xmFhcl3JiyWgfR%2FLkpwerskbIy9P1Lqt5cpr5bPaJlpjZ%2F%2BIMILV6acFPlk6bp5bsIimNVdIbEnfQ8ZLFHbEMkHlxjMfHT2C4LH88VuggjWLGjTh74xuVWtfrGnEfll2HIYCmeCoPxU6X2J8WPxtzncvbQ5bPnHHkvjlqjpLk%2BWnTPhj%2Bxrj8l%2BiBYDFJdmbdmS58wqQUYrXh8iTxPxeh96suVvKf9HD6lFM4rH1%2FQgccilLc%2FLAAoW4NNSaXAhtQ9AjSPSwrHYCp0XwgCjLglTfalp%2FXBw5IeJTHjKJwrzgpziJKM7mAPLwdUjre2X%2FeUrvmCSrHdIbwlSH8ovkr4BptszQJc5urySYVuwSsNadl3s8T%2Fc95qG6jn4t%2Feb%2FKY3hnnHvhN5GHM0rWWAd; isg=BPn5lDHGhqQd8lp_WanyUAL0CGwTruyWFKdzdRsudSCfohk0Y1b9iGfQIO7xAYXw'}
});

if(pic)return {'show':'<img src="'+pic+'" />'}
else return null;
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