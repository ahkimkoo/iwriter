const stream = require("stream");
const fs = require('fs');
const path = require('path');

const crawler = require('../../processer/crawler.js');
const RULE_ID = 'test';
const PROFILE = 'pro';
process.env.profile = PROFILE;

const file = path.resolve(__dirname,'tags.csv');
console.log(file);

const sleep = (ms) =>{
  return new Promise(resolve => setTimeout(resolve, ms));
}

const appendLine = (arr) => {
    fs.appendFileSync(file, arr.join(',')+new Buffer('\xEF\xBB\xBF', 'binary')+'\n');
}

(async ()=>{
	let sandbox = await crawler.getSandbox(RULE_ID,'coder');
	with(sandbox){
	/*embed script begin*/
		fs.truncateSync(file);
		for(let i = 97; i<=122; i++){
			let alpha = String.fromCharCode(i);
			let y = 1;
			while(true){
				let url = `https://www.leiphone.com/tags-${alpha}/${y}.html`;
				console.log(url);
				let doc = await getDocument(url);
				let max_page = 1;
				if(doc){
					doc('.list>a').each((i, ele)=>{
						let alink = doc(ele);
						appendLine([alink.text()]);
						// console.log(alink.text());
						max_page = parseInt(doc('.pages>a:last-of-type').text());
					});
				}
				await sleep(10000);
				if(y >= max_page)break;
				y++;
			}
		}
	/*embed script end*/
	}
	process.exit(0);
})();