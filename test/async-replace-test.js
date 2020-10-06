const replaceAsync = (str, re, replacer) => {
  return Promise.resolve().then(() => {
    const fns = []
    str.replace(re, (m, ...args) => {
      fns.push(replacer(m, ...args))
      return m
    })
    return Promise.all(fns).then(replacements => {debugger;
      return str.replace(re, () => replacements.shift())
    })
  })
}

var str = '<img style="display:inline-block;" alt="汽车之家" src="https://x.autoimg.cn/m/images/640x480_picloading.png" data-src="https://m1.autoimg.cn/newsdfs/g30/M07/5D/A3/960x0_1_q40_autohomecar__ChcCSVw3ZESAPHT6AAsG8UAm0ak574.jpg" page="1" index="1">kkk<img style="display:inline-block;" alt="汽车之家" src="https://x.autoimg.cn/m/images/640x480_picloading.png" data-src="bbb" page="1" index="1">';

(async ()=>{
	let ret = await replaceAsync(str, /src="([^"]+)" data-src="([^"]+)"/g, (match, p1, p2, p3, offset, str)=>{
		return new Promise(resolve=>{
			setTimeout(_=>{
				resolve('src="'+p2+'"');
			},1000);
		});
 	});
 	console.log(ret);
})();