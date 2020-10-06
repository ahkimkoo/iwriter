const vm = require('vm');
const {NodeVM} = require('vm2');
const mongo = require('mongodb');

var g = 0;
var code = `g+=1;return q+g;`;
var q = 100;


console.time('eval');
console.log('eval=>', eval(`(()=>{${code}})()`));
console.timeEnd('eval');
console.log('eval::g:::>', g);
console.log('-------------------------------------------------------------');

console.time('directly');
console.log('directly=>', (function(){
  g+=1;return q+g;
})());
console.timeEnd('directly');
console.log('directly::g:::>', g);
console.log('-------------------------------------------------------------');

const evalProxy = async(code) =>{
  return eval(`(()=>{${code}})()`);
}

console.time('eval_proxy');
let sandbox0 = {q,g,NodeVM,mongo};
let proxy0 = new Proxy(sandbox0, {
    has(target, key) {
      return true; 
    }
});
evalProxy.call(proxy0, code).then(ret=>{
  console.log('eval_proxy=>', ret);
  console.timeEnd('eval_proxy');
  console.log('eval_proxy::g:::>', g);
  console.log('-------------------------------------------------------------');
});

console.time('Function');
var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
new AsyncFunction('q', 'g', code)(q, g).then(ret=>{
	console.log('Function=>', ret);
	console.timeEnd('Function');
	console.log('Function::g:::>', g);
  console.log('-------------------------------------------------------------');
});

console.time('Proxy');
var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
var sandbox = {q,g,NodeVM,mongo};
const fn = new AsyncFunction('sandbox', `with(sandbox){${code}}`);
const proxy = new Proxy(sandbox, {
    has(target, key) {
      return true; 
    }
});

fn(proxy).then(ret=>{
	console.log('Proxy=>', ret);
	console.timeEnd('Proxy');
	console.log('Proxy::g:::>', g);
  console.log('-------------------------------------------------------------');
});

console.time('vm_script');
var sandbox3 = {q,g,NodeVM,mongo};
var script = new vm.Script(`(async () =>{${code}})()`);
(script.runInNewContext(sandbox3)).then(ret=>{
  console.log('vm_script=>', ret);
  console.timeEnd('vm_script');
  console.log('vm_script::g:::>', g);
  console.log('-------------------------------------------------------------');
});

console.time('vm');
var sandbox2 = {q,g,NodeVM,mongo};
var ctx = vm.createContext(sandbox2);
(vm.runInNewContext(`(async () =>{${code}})()`, ctx)).then(ret=>{
	console.log('vm=>', ret);
	console.timeEnd('vm');
	console.log('vm::g:::>', g);
  console.log('-------------------------------------------------------------');
});

// console.time('vm2');
// const vm2 = new NodeVM({
//     'sandbox': sandbox,
//     'require': {
//         'external': true,
//         'builtin': [],
//         'root': "./"
//     }
// });

// (vm2.run(`module.exports = async () =>{${code}}`)()).then(ret=>{
// 	console.log('vm2=>', ret);
// 	console.timeEnd('vm2');
// 	console.log('vm2::g:::>', g);
// });

/*
function evalute(code,sandbox) {
  sandbox = sandbox || Object.create(null);
  const fn = new Function('sandbox', `with(sandbox){return (${code})}`);
  const proxy = new Proxy(sandbox, {
    has(target, key) {
      // 让动态执行的代码认为属性已存在
      return true; 
    }
  });
  return fn(proxy);
}
*/