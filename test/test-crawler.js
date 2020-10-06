const {spawn,fork} = require('child_process');
const path = require('path');

process.env.profile = 'dev';

let rule = '5aea817e6135ff3e93b58d8a'

// const runCrawler = (rule) => {
// 	let worker = spawn(
// 		'node',
// 		['processer/crawler.js',rule], 
// 		{
// 			// 'shell':'/bin/bash', 
// 		    'cwd':path.resolve(__dirname,'..'), 
// 			stdio: [null, null, null, 'ipc'],
// 			'env':{
// 				'service': 'worker',
// 	            'child_no': 0,
// 	            'profile': process.env.profile,
// 	            'HOME': path.resolve(__dirname)
// 	        }
// 		}
// 		);

// 	worker.stderr.on('data', (data) => {
// 		console.error('stderr: '+data.toString());
// 	});


// 	worker.stdout.on('data', (data) => {
// 		console.log('stdout: '+data.toString());
// 	});


// 	worker.on('exit', (code) => {
// 	  console.error('exit. code: '+code);
// 	});
// }

// setTimeout(runCrawler, 1000, rule);
// 
// 
const crawler = require('../processer/crawler.js');
(async function(){
	let code1  = `function fibonacci(n){if(n==0 || n == 1){return n;}else{return fibonacci(n-1) + fibonacci(n-2);}}return fibonacci(5);`;
	let code2  = `function fibonacci(n){if(n==0 || n == 1){return n;}else{return fibonacci(n-1) + fibonacci(n-2);}}return fibonacci(40);`;
	let code3  = `function fibonacci(n){if(n==0 || n == 1){return n;}else{return fibonacci(n-1) + fibonacci(n-2);}}return fibonacci(45);`;
	console.log(await crawler.runAsyncCode('rule#1', code1));
	console.log(await crawler.runAsyncCodeUseProxyFunc('rule#1', code1));
	console.log(await crawler.runAsyncCodeUseEvalProxy('rule#1', code1));
	console.log(await crawler.runAsyncCodeUseScript('rule#1', code1));
	console.log(await crawler.runAsyncCode('rule#2', code2));
	console.log(await crawler.runAsyncCodeUseProxyFunc('rule#2', code2));
	console.log(await crawler.runAsyncCodeUseEvalProxy('rule#2', code2));
	console.log(await crawler.runAsyncCodeUseScript('rule#2', code2));
	console.log(await crawler.runAsyncCode('rule#3', code3));//78124
	console.log(await crawler.runAsyncCodeUseProxyFunc('rule#3', code3));//78076
	console.log(await crawler.runAsyncCodeUseEvalProxy('rule#3', code3));//78336
	console.log(await crawler.runAsyncCodeUseScript('rule#3', code3));
})()