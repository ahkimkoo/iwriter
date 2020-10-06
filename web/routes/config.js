'use strict'

const jsonEditor = require('./json-editor.js');

module.exports = function (router, settings) {

    jsonEditor.set(
        router,
        settings,
        '配置文件',
        'config', 
        [{
            'key': 'name',
            'label': '名称'
        }, {
            'key': 'description',
            'label': '描述'
        }, {
            'key': 'updated',
            'label': '修改时间'
        }], 
        ['name'],
        'updated',
        'name', 
        {
            'name': 1
        },
        '/config/', {
            'name' : 'data_zone',
            'description':'数据分区',
            'data_zone':[
                {
                    'id' : 'default',
                    'name' : '妙点网络',
                    'categories' : ['早餐常规数据','早餐平台数据','快讯常规数据','其它']
                },
                {
                    'id' : 'test',
                    'name' : '外部服务',
                    'categories' : ['头条监控']
                }
            ]
        }
    );
}