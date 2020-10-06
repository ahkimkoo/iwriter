# Intelligent-writer部署说明

该项目的详细说明请参照[[Intelligent-writer]]

## 环境

* Nodejs v8.11.1， 必须是7.9以上的版本，否则不支持promise/await表达式项目将无法运行;
* Mongodb v3.4.4，　必须是3.2以上的版本，否则不支持exprired项目无法正常运行；
* 需要一个独立域名，公网可以直接访问，如果是通过nginx做反向代理，需要配置websocket穿透（参考 www.ucaimi.com）。

## 第一步：克隆代码

项目GIT地址：https://github.com/ahkimkoo/iwriter.git


## 第二步：确认setting-pro.json的生产环境mongodb配置正确

## 初始化mongodb数据

### 索引

```shell
db.liveworkers.createIndex({"checkin":1},{expireAfterSeconds:30});
```

### 管理员数据

```shell
db.manager_group.insert({ "_id" : ObjectId("5b04e5b8d84a670065549454"), "group_name" : "guests", "group_path" : [ "^/datas/(?:list|view).*$" ], "summary" : "外来访客", "updated" : "2018-05-23 12:05:03" });
db.manager_group.insert({ "_id" : ObjectId("5af157d184a6a263517a7206"), "group_name" : "api", "group_path" : [ "/provider/.*" ], "summary" : "对外接口", "updated" : "2018-05-08 15:54:57" });
db.manager_group.insert({ "_id" : ObjectId("5ae004c85f2291267e8d7d85"), "group_name" : "viewer", "group_path" : [ "/datas/list.*", "/datas/view.*", "/datas/forcerun.*", "/$" ], "summary" : "查看数据", "updated" : "2018-09-12 18:03:44" });
db.manager_group.insert({ "_id" : ObjectId("5b1755cdc6a08e00768cfe0c"), "group_name" : "script", "group_path" : [ "^/provider/show/.*" ], "summary" : "内容片段引用", "updated" : "2018-06-06 11:32:29" });
db.manager_group.insert({ "_id" : ObjectId("5ac3150f01a3af29e01fff46"), "group_name" : "root", "group_path" : [ ".*" ], "updated" : "2018-04-03 13:45:51", "summary" : "所有权限" });

db.manager.insert({ "_id" : ObjectId("5c0a257fc16a4e7c97aee5b7"), "username" : "admin", "password" : "123456+", "nickname" : "admin", "avatar" : "/img/avatar.png", "group_name" : [ "root" ], "first_log_in" : false, "updated" : "2018-12-07 15:53:47" }
);
```



## 第三步：运行web服务

```bash
node run.js -e pro -p 8811
```

## 第四步：配置数据分区

进入web界面，高级设置-》动态配置文件-》创建文件data_zone，内容如下：

```bash
{ 
    "_id" : ObjectId("5ae416de020f8c6d3ecf6646"), 
    "name" : "data_zone", 
    "data_zone" : [
        {
            "id" : "default", 
            "name" : "财经简讯", 
            "categories" : [
                "常规数据", 
                "平台数据", 
                "快讯数据", 
                "盘后汇总"
            ]
        }, 
        {
            "id" : "industry", 
            "name" : "行业数据", 
            "categories" : [
                "行业报告"
            ]
        }, 
        {
            "id" : "liteapi", 
            "name" : "微服务", 
            "categories" : [
                "微接口", 
                "通用函数"
            ]
        }
    ], 
    "updated" : "2019-04-29 17:46:54", 
    "description" : "数据分区"
}
```

## 第五步：运行爬虫进程

进入web界面，进入数据工厂－》运行服务器　选择某个分区启动爬虫进程，进入页面需要账号验证，初始化账号:admin，　密码:123456+ 。