'use strict'

const jsonEditor = require('./json-editor.js');

module.exports = function (router, settings) {

    jsonEditor.set(
        router,
        settings,
        'Manager',
        'manager', [{
            'key': 'username',
            'label': '用户名'
        }, {
            'key': 'nickname',
            'label': '昵称'
        }, {
            'key': 'group_name',
            'label': '所属组'
        }], ['username'],
        'updated',
        'username', {
            'username': 1
        },
        '/admin/manager/', {
            'username': 'manager',
            'password': '123456',
            'nickname': 'nickname',
            'avatar': '/img/avatar.png',
            'group_name': ['viewer'],
            'first_log_in': true
        }
    );

    jsonEditor.set(
        router,
        settings,
        '用户组权限管理',
        'manager-group', [{
                'key': 'group_name',
                'label': '组名'
            },
            {
                'key': 'summary',
                'label': '说明'
            }
        ], ['group_name'],
        'updated',
        'group_name', {
            'group_name': 1
        },
        '/admin/manager-group-', {
            'group_name': '',
            'group_path': [],
            'summary': ''
        }
    );
}