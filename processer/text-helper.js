const stringUtil = require('../lib/string-util.js');

const pnSyntax = (value, positive_syntax, negative_syntax) => {
    return value >= 0 ? positive_syntax : negative_syntax
}

const percentSyntax = (value, keep_point = true) => {
    let t_value = value * 100;
    if (keep_point) {
        if (typeof keep_point == 'number') t_value = t_value.toFixed(keep_point);
    } else t_value = parseInt(t_value);
    return `${t_value}%`;
}

const lookForPreviousNDay = function(dayn, skipweeks = 0) {
    let now = new Date();
    let delta = (now.getDay() - dayn + 7) % 7 * 86400000 + 86400000 * 7 * skipweeks;
    return new Date(now.getTime() - delta);
}

const lookForNextNDay = function(dayn, skipweeks = 0) {
    let now = new Date();
    let delta = Math.abs(now.getDay() - dayn - 7) % 7 * 86400000 + 86400000 * 7 * skipweeks;
    return new Date(now.getTime() + delta);
}

const quoteChange = function(base_value, changed_value) {
    return changed_value / base_value - 1;
}

const quoteChangeSyntax = function(base_value, changed_value, positive_syntax = '涨', negative_syntax = '跌', keep_point = 2) {
    let quote_change = quoteChange(base_value, changed_value);
    return pnSyntax(quote_change, positive_syntax, negative_syntax) + percentSyntax(Math.abs(quote_change), keep_point);
}

const getAppropiatePeroidDescription = (schedule_start, schedule_peroid) => {
    let result;
    if(schedule_peroid>0){
        let DAY_NAME = ['日', '一', '二', '三', '四', '五', '六'];
        let UP_NUMBER = ['', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十', '十一'];
        if (schedule_peroid > 86400 * 7 && schedule_peroid % 86400 == 0) result = '每隔' + schedule_peroid / 86400 + '天' + stringUtil.dateFormat(schedule_start, 'hh:mm');
        else if (schedule_peroid == 86400 * 7) result = '每周' + DAY_NAME[schedule_start.getDay()] + stringUtil.dateFormat(schedule_start, 'hh:mm');
        else if (schedule_peroid == 86400) result = '每天' + stringUtil.dateFormat(schedule_start, 'hh:mm');
        else if (schedule_peroid < 86400 && schedule_peroid % 3600 == 0) result = '每' + UP_NUMBER[schedule_peroid / 3600] + '小时' + stringUtil.dateFormat(schedule_start, 'mm分');
        else if (schedule_peroid < 3600 && schedule_peroid % 60 == 0) result = '每' + schedule_peroid / 60 + '分钟';
        else result = '每' + schedule_peroid + '秒';
    }else result='无';    
    return result;
}

const getAppropiateDateDescription = (val) => {
    let nowv = new Date().getTime();
    let delta = nowv - val;

    let MICROSECOND = 1;
    let SECOND = 1000 * MICROSECOND;
    let MINUTE = 60 * SECOND;
    let HOUR = 60 * MINUTE;
    let DAY = 24 * HOUR;

    let steps = [
        [DAY, '天'],
        [HOUR, '时'],
        [MINUTE, '分'],
        [SECOND, '秒'],
        // [MICROSECOND,'毫秒']
    ]

    let message = '';
    let left = delta;

    if (left < SECOND) {
        message = '刚刚';
    } else {
        for (let s of steps) {
            let v = Math.floor(left / s[0]);
            if (v >= 1) {
                message += `${v}${s[1]}`;
            }
            left = left % s[0];
        }
    }

    return message;
}

const getAppropiateDateAgoDescription = (val) => {
    let nowv = new Date().getTime();
    let delta = nowv - val;

    let MICROSECOND = 1;
    let SECOND = 1000 * MICROSECOND;
    let MINUTE = 60 * SECOND;
    let HOUR = 60 * MINUTE;
    let DAY = 24 * HOUR;

    let steps = [
        [DAY, '天'],
        [HOUR, '小时'],
        [MINUTE, '分钟'],
        [SECOND, '秒'],
        // [MICROSECOND,'毫秒']
    ]

    let message = '';
    let left = delta;

    if (left < SECOND) {
        message = '刚刚';
    } else {
        for (let s of steps) {
            let v = Math.floor(left / s[0]);
            if (v >= 1) {
                message += `${v}${s[1]}`;
                break;
            }
            left = left % s[0];
        }
        message += '前';
    }

    return message;
}

const array2table = (arr, include_header = false, class_name = 'iw_data_table') => {
    let html = '<table class="' + class_name + '">';
    for (let i = 0; i < arr.length; i++) {
        let row = arr[i];
        let tag = 'td';
        if (include_header && i == 0) tag = 'th';
        html += '<tr>';
        for (let col of row) {
            html += '<' + tag + '>' + col + '</' + tag + '>';
        }
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

if (module.parent) {
    module.exports = {
        'array2table': array2table,
        'pnSyntax': pnSyntax,
        'percentSyntax': percentSyntax,
        'quoteChange': quoteChange,
        'quoteChangeSyntax': quoteChangeSyntax,
        'lookForPreviousNDay': lookForPreviousNDay,
        'lookForNextNDay': lookForNextNDay,
        'getAppropiatePeroidDescription': getAppropiatePeroidDescription,
        'getAppropiateDateDescription': getAppropiateDateDescription,
        'getAppropiateDateAgoDescription': getAppropiateDateAgoDescription

    }
} else {
    (async() => {
        try {
            pnSytax(0.5, '涨', '跌')
        } catch (e) {
            console.log('ERR:::' + e);
        }
        process.exit();
    })();
}