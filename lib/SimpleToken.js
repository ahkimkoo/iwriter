/**
 * simple code.
 * encode: 
 *    step 1: x * y = z 
 *    setp 2: reverse(base36(x).base36(z).base36(y))
 * decode:
 *    reverse(str)  =>  x.z.y
 *    x * y = z
 * 
 */

exports.generate =
    generate = () => {
        let x = parseInt(10 + Math.random() * 1000);
        let y = parseInt(10 + Math.random() * 1000);
        let z = x * y;
        let s1 = `${x.toString(36)}.${z.toString(36)}.${y.toString(36)}`;
        return s1.split("").reverse().join("");
    }


exports.verify =
    verify = (code) => {
        let ret = false;
        let tcode = code.split("").reverse().join("");
        let tsplitArr = tcode.split('.');
        if (tsplitArr.length == 3) {
            let x = parseInt(tsplitArr[0], 36);
            let z = parseInt(tsplitArr[1], 36);
            let y = parseInt(tsplitArr[2], 36);
            if (x > 9 && y > 9 && x * y == z) ret = true;
        }
        return ret;
    }

if (!module.parent){
	if(process.argv.length > 2){
		console.log(`Code ${process.argv[2]} is validate: ${verify(process.argv[2])}`);
	}else console.log('Generate code: '+generate());
}