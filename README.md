# Intelligent-writer


## 一、概述

聚合写作就是从一些网站、程序接口获取数据，再根据一些规则对数据进行加工，最后得出可用的数据（一段话或者是格式化存储的若干值）。聚合写作与爬虫的区别是抓取处理存储同步完成，即完成的ETL过程。聚合写作包括很多个数据项目，由于每种项目数据加工过程差异较大，无法使用一种简单的描述语言（如DSL或者JSON）来完成规则配置，因此采用动态脚本的方式，每个数据项都有一个独立的动态脚本，一些通用的功能将被写到系统函数中，动态脚本直接调用，每个动态脚本运行时会启动单独的一个VM空间，两个脚本之间互不影响， 动态脚本负责数据的抓取和转换，在动态脚本的末尾通过return语句返回结果，最终的结果由主系统负责统一存储。

以下是该系统的一些术语：

* 调度周期

每个数据项都可以设置定时运行的周期，用秒表示。从调度起始时间开始，每一个调度周期轮回时会运行动态脚本。

* 数据版本

每一轮调度周期运行产生的数据为一个版本，在下一个周期之前反复运行产生的结果为同一个版本，在数据库中会覆盖同一版本前一次的结果。可以为版本号设定一个规则（可以使用魔法变量），如果不设定版本规则，默认的版本号是调度的周期号（第一期是1，第二期为2，以此类推），也可以在动态脚本的返回值中用"$version"的字段返回自定义版本号。

* 代码版本

动态脚本可以在web界面编写和调试，每个数据项有两种版本，测试代码和正式代码，在web ide界面对测试代码进行调试，正常后发布成正式代码，数据项每次调度运行使用的是正式代码。

* Web IDE

在线代码编辑器，在线编辑js代码，语法高亮，自动格式化，在线运行，自动保存。

* Wiki 

在线编辑和查看markdown格式的文档，主要是对核心函数的描述文档，后台编写说明，在web ide界面可以查看wiki

* 数据分区、类别

数据分区是一级大分类，类别是二级分类。分类的目的是数据项变多以后通过分类筛选查看会比较有效，分布式运行时每个进程可以选择一个分区来运行。分区和类别可以通过web后台的编辑动态配置文件进行修改。


*项目GIT仓库地址：https://github.com/ahkimkoo/iwriter.git*

## 二、运行

先启动web项目，然后通过web界面启动聚合爬虫。聚合条目较多的情况下，单个爬虫进程负载过重，因此聚合规则有数据分区的概念，录入规则时需要选择所属的分区，启动爬虫时也选择相应的分区，一个分区不能同时启动两个爬虫进程，否则会出现调度错乱。

* 启动web

<pre><code class="text">
node run.js -e dev -p 8811
</code></pre>

其中-e dev是环境参数，dev,test,pro分别对应配置文件settings-dev.json, settings-test.json, settings-pro.json。-p 8811是启动的web端口。

* 启动爬虫

在web界面“服务器”菜单中启动爬虫进程

首次运行参考[第一次部署说明](First-Deploy.md)

## 三、动态脚本说明

### 动态脚本说明
每个动态脚本都负责一个数据抽取项目的数据下载和转化过程。每个动态脚本都运行在独立的沙箱内，相互不影响，动态脚本返回最终的抽取数据，由主程序完成存储环节。

### 运行环境

nodejs v8.11.1， 可使用async/await语句

### 返回结果

动态脚本最后一句必须是return 语句，返回抓取结果，抓取结果有以下几种类型：
#### json对象
 必须包含message(文本)或者show（html格式），如果有$version字段，将会覆盖根据规则定义自动产生的数据版本；
#### 字符串
自动格式化为JSON对象，字符串作为message字段的值
#### function函数类型
表示该类数据可以被外部接口调用，调用产生的结果不存数据库

### 魔法变量
魔法变量在字符串中用$ { 名字 } 的方式引用，在动态脚本中可以直接使用
* RULE 当前规则ID
* CALLER 程序调用者，viewer数据查阅者，scheduler调度器，coder编码人
* YEAR 年
* MONTH 月
* DATE 日
* DAY 星期
* HOUR 时
* MINUTE 分
* SECOND 秒
* TIMESTAMP 时间戳YYMMDDhhmms
* NOW 时间值毫秒
* YYMMDD 月日年（今天）
* BYYMMDD 月日年（昨天）
* AYYMMDD 月日年（明天）

### 常用函数
Nodejs内置函数可以直接使用
以下是一些非常好用的函数，可以直接使用

#### 网络请求函数
* getJson(url, option) 

请求地址获得json数据，返回的是一个Promise对象，使用await获取最终的json对象

option的参数和[request](https://github.com/request/request) 参数一致，有几个特殊参数作如下说明：

(1)encoding : 在request模块可使用的为utf-8,ascii等，如果返回的页面有乱码，此参数值设置为gbk, gb2312就能解决问题

(2)jsonp : 默认为空，如果是jsonp地址，这里写出jsonp callback的函数名以保证正确返回json数据。

* getDocument(url, option)

请求地址获得html文档，返回的对象是经过html解析的，可以通过使用类似于jquery的方式来查询dom节点，具体用法请查阅[cheerio](https://github.com/cheeriojs/cheerio) 。

option的参数和[request](https://github.com/request/request) 参数一致，有几个特殊参数作如下说明：

(1)encoding : 在request模块可使用的为utf-8,ascii等，如果返回的页面有乱码，此参数值设置为gbk, gb2312就能解决问题

(2)parse : 是否要解析成cheerio对象，默认为true，如果设置为false,将返回网页源代码

* getBrowserDocument(url, test, option)

请求地址获得phtomjs模拟浏览器渲染后的文档，test是一个正则表达式，表示满足该条件后才返回文档。返回的对象是经过html解析的，可以通过使用类似于jquery的方式来查询dom节点，具体用法请查阅[cheerio](https://github.com/cheeriojs/cheerio) 。

option的参数说明：

(1)parse : 是否要解析成cheerio对象，默认为true，如果设置为false,将返回网页源代码；

(2)loadimages : 是否载入图片，默认为false。

* getChromeDocument((url, test, option) 请求地址获得chrome浏览器渲染后的文档, test用来测试页面是否加载完成，可以为css选择符，xpath表达式，函数（相当于在浏览器执行可使用浏览器对象document,window等），test需要返回一个truely的值表示加载完成。函数最终的返回对象是页面内evaluated结果或者文档的dom节点cheerio 。 

option参数说明： 

(1)parse : 是否要解析成cheerio对象，默认为true，如果设置为false,将返回网页源代码 ；

(2)loadimages : 是否载入图片，默认为false；

(3)timeout: 页面超时时间，默认为60000；

(4)evaluate:这是一个在页面内执行的js表达式或者函数，通常用来抽取一些信息，如果有evaluate，函数最终的返回值就是evaluate在页面内执行后的返回结果。

(5)waitUntil:等待页面加载完成的判别方式，取值为load或domcontentloaded，默认为load。

(6)body: 需要post方式发送请求时指定发送的数据，字符串型。

(7)viewport: 屏幕分辨率设置，例如{'width' : 1920,'height' : 1080}，详细参数参照[page.setViewport(viewport)](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagesetviewportviewport)
  

* snapshotByPosition(url, test = 'body', rect, encoding='base64', options = {})

指定页面位置，返回截图。参数rect是指定的举行位置[左，上，右，下]，encoding取值为base64, binary, uri, url，其中uri返回datauri格式，url返回七牛图片地址，options与getChromeDocument一致，默认载入图片。

* snapshotByElement(url, test = 'body', selector, offset=[0, 0, 0, 0], encoding='base64', options = {})

指定页面上的元素，返回截图，参数selector是css选择符指定要截图的元素，offset是给指定元素位置加偏移量之后截图，其余参数与snapshotByPosition相同。

* retryCheck(checkFun, interval, max_times, delay, startTime)

反复检查直到满足条件再继续执行下一步，checkFun是一个返回Promise的函数，检测是否满足条件返回相应的resolve(true|false)， interval是检测周期（毫秒）， max_times最多检测多少遍，delay是返回前延迟（毫秒），整个函数最终返回Promise对象，resolve的参数值true|false代表最终检测是否满足条件。

#### 文本处理函数
* pnSyntax (value, positive_sytax, negative_sytax)

根据正负值返回相应的词语，例如pnSytax(-1.1, '涨幅', '跌幅')

* percentSyntax(value, keep_point)

将数字转换成百分表达语句，例如percentSytax(0.25)返回“25%”, keep_point为true表示保留所有小数点位数，如果是数字，表示保留相应的小数点位数。

* quoteChange(base_value, changed_value)

两个数字的变化比例，常用于涨跌计算，返回小数，正数是涨，负数是跌

* quoteChangeSyntax(base_value, changed_value, positive_syntax='涨', negative_syntax='跌', keep_point=2)

生成涨跌描述，返回结果如“涨10%”， keep_point是小数保留几位，如果不保留设为false

* dateFormat(date, format)

日期格式化函数，date是一个Date类型， format是日期格式，'yyyy-MM-dd hh:mm:sss.S'， 返回字符串

* lookForPreviousNDay(dayn, skipweeks=0)

获取以前的某个星期几(dayn), skipweeks是跳过几周，返回一个Date对象

* lookForNextNDay = function(dayn, skipweeks=0)

获取以后的某个星期几(dayn), skipweeks是跳过几周，返回一个Date对象

* getTextFromHtml(html)

去掉html标签，返回文本

* table2array(cheerio_dom, query, keep_html)

将表格解析为Array， cheerio_dom是一个cheerio对象，query是表格的查询语句（jquey），keep_html，表示返回html，函数返回二维数组

* array2table(arr, include_header = false, class_name = 'iw_data_table')

将数组转换成html table, include_header表示第一行是否为表头，class_name是table的样式名，函数返回字符串

#### 数据访问函数
* getLastValues(RULE, exclude_version)

返回当前规则的上一次（即上一版本）数据，参数RULE是固定用法，表示当前规则，exclude_version是当前版本号，如果没有填写表示返回最后一个版本，如果填写为'DEFAULT'系统按照调度周期或者规则里面指定的version规则生成当前规则。
返回的数据包括，上一版本抓取的自定义字段，以及message, version, updated, created字段。这是一个async函数，返回Promise对象，建议使用await语句。

* getValuesByVersion(RULE, version)

获取某个规则指定版本的数据，如果是当前规则，可以用RULE，否则填写具体的规则ID，version是特定的版本号。返回的数据包括，指定版本抓取的自定义字段，以及message, version, updated, created字段。这是一个async函数，返回Promise对象，建议使用await语句。

* getPreviousNValues(RULE, n)

获取某个规则N个版本之前的数据，如果是当前规则，可以用RULE，否则填写具体的规则ID，n表示几个版本之前，本函数指定的数据不等同于取n个自然日之前数据，加入版本号按照自然日取名，取5个版本之前的数据，一旦其中有一个自然日没有数据，就会编程取6个自然日之前的数据，以此类推。返回的数据包括，指定版本抓取的自定义字段，以及message, version, updated, created字段。这是一个async函数，返回Promise对象，建议使用await语句。

#### 其他函数
* sendMail(address, subject, text, html, config={}, sender)

发送邮件，address为收件人地址，列表格式，例如：['"Hero" <hero@mail.com>']，subject是邮件标题，text是纯文本内容，html是富文本内容,　config是邮箱服务器配置，举例：

```js
{
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: 'x@mail.com',
        pass: 'pass123'
    }
}
```
sender是发件人，格式：'"Hero" <hero@mail.com>'

* sendMQ(connecturl, exchange, data) 

发送消息到rabbitmq, connecturl是连接地址，例如：amqp://user:password@host:5672/vhost，exchange是mq的exchange, data为发送的数据，可以是字符串或者json对象。

* consumeMQ(connecturl, exchange, queue, idel_limit, handler)

消费rabbitmq消息, 此函数不是常规的消费伺服机，超过一定时间后没有消息会断开连接返回结果。 connecturl是连接地址，例如：amqp://user:password@host:5672/vhost，exchange是mq的exchange, queue为队列名, idel_limit是最大等待时间，单位毫秒，超过这个时间没有接到消息会断开连接返回结果。handler是一个消费消息的处理函数，形如 handle(msg), msg为消息体，字符串，该函数需要返回一个promise。

* publishKafka(brokers, topic, data, client_id)

发送消息到kafka，例如：
```js
publishKafka(['192.168.1.10:9092'], 'test', {'message':'ok....'});
```

* consumeKafka(brokers, topic, handler, idel_limit, groupid, client_id)

消费kafka消息, 此函数不是常规的消费伺服机，超过一定时间后没有消息会断开连接返回结果。例如：
```js
let c = await consumeOnce(['192.168.1.10:9092'], 'test', (msg)=>{
  console.log(msg);
},30000); 
console.log('count:', c);
````

* sleep(ms)

sleep函数, 单位毫秒，返回promise对象，建议用户await语句。

### 可用模块
动态脚本中可以引用一下模块进行高级自定义开发

* [request](https://github.com/request/request) : 用于普通的http/https请求, 名称request

* [cheerio](https://github.com/cheeriojs/cheerio) : 用于解析html文档, cheerio

* [phantomjs-node](http://amirraminfar.com/phantomjs-node/) : phantomjs的nodejs绑定，用来请求动态网页，名称phantom

* [iconv](https://github.com/ashtuchkin/iconv-lite): 引入iconv-lite，处理编码，名称iconv

* [mysql](https://github.com/mysqljs/mysql):引入mysql模块访问数据库

* [mongodb](https://github.com/mongodb/node-mongodb-native):引入mongodb模块访问数据库

* [redis](https://github.com/NodeRedis/node_redis):引入redis模块访问数据库

* [elasticsearch](https://github.com/elastic/elasticsearch-js):引入elasticsearch模块访问搜索引擎

* [nodejieba](https://github.com/yanyiwu/nodejieba)引入nodejieba做中文分词

* [crypto](https://nodejs.org/api/crypto.html) 引入nodejs的crypto模块

* [seneca](http://senecajs.org/) 引入nodejs微服务框架，用法：let seneca_client = seneca().client({'type': 'http', 'port': 8260, 'host': '127.0.0.1'});

### 本地调试

该功能仅面向项目的原生开发人员

在某些情况下遇到在线调试代码困难时，可以将脚本导出到项目中，作为原生脚本调试

导出动态脚本

```
node dump/dump.js -e dev -r Z2f4Mdq -v dev
```
以上命令是将规则Z2f4Mdq在dev服务器环境下的调试(dev)脚本导出到dump/scripts下

运行导出的脚本

```
node dump/scripts/Z2f4Mdq-dev-dev.js
```

使用以下命令可以导出所有动态脚本到本地

```
node dump/dumpall.js -e pro -v dev
```

## 四、mongodb数据库

* 测试环境

test/iwriter

* 生产环境
mongodb.server.net/iwriter

###. 规则维护的整体JSON格式（rules）

```json
{
    "_id":"系统产生ID",

    "name":"数据项目名称",

    "description":"说明",

    "category":"数据类目",/*用于worker执行是区分任务*/

    "version": "数据的版本号，可以引用上面字段和魔法变量，用${变量}的方式",

    "code": "动态代码",

    "dev_code":"开发代码，未发布的代码",

    "schedule_start": "2018-1-2 18:00",
    /*调度开始时间*/

    "schedule_peroid": 30, /*调度周期，单位为秒*/

    "error_count":0,/*连续错误次数*/

    "last_schecule":"2018-1-2 18:00",/*最后一次调度执行的时间*/

    "show_desktop":false,/*是否在桌面上显示*/

    "code_changed":false,/*代码有变动*/

    "valid":true,

    "is_new":false/*刚添加的规则*/

}
```

### 数据抓取结果（datas）

```json
{
    "_id" : "系统产生ID",

    "rule" : "对应rules的id",
    
    "name":"数据项目名称",

    "category":"数据类目",

    "version": "数据的版本号",

    "message": "写作内容",

    "created":"2018-1-2 15:00",/*该版初次抓取*/

    "updated": "2018-1-2 18:00",/*该版本最近抓取*/

    "show_desktop":false,/*是否在桌面上显示*/

    "valid":true,

    "values":{}/*自定义的摘取结果*/

}
```

### 说明文档（wiki）

```json
{

    "_id":"wiki name",

    "content":"wiki content"
}
```

### 在线爬虫进程(liveworkers)

维护在线的爬虫进程状态，使用了mongodb的ttl索引

```bash
db.liveworkers.createIndex({"checkin":1},{expireAfterSeconds:30});
```

数据结构

```json
{
   "_id" : "zone name",
   "host" : "主机名",
   "pid"  : 6677, /*process id*/
   "address" : "http://host:port",/*socket io address*/
   "zone" : "zone name",/*zone name*/
   "created" : Date,/*created time*/
   "checkin" : Date/*last check in time*/
}
```

### 个人订阅（subscribe）

存储了个人订阅条目信息

```json
{
  "_id":"userid",
  "rules":['rule_id','rule_id'],
  "updated":Date()
}
```


### 其他集合

manager和manager_group存放管理员及权限信息

## 五、URL规范

| 前缀 | 说明 |
| - | - |
| /profile | 个人中心（订阅、修改密码） |
| /datas/ | 数据广场 |
| /rules/ | 数据工厂（规则设置、服务器） |
| /admin/ | 管理员设置 |
| /config/ | 动态文件配置 |
| /provider/ | 对外json(p)接口 |

### 其中对外接口地址为：

* 获取某个规则的数据

http://user:password@host:port/provider/get/:rule??pagesize=20&pagenum=1&version=

* 动态执行某个规则（返回结果是函数型的规则）

http://user:password@host:port/provider/call/:rule

请求方式可以是GET或者POST，传入参数值，参数名需要参照具体的动态脚本函数

以上接口都支持json/jsonp方式请求

其中:rule为规则ID,网址可以加参数pagesize, pagenum, version(指定版本)， 返回格式示例：

```json
{
  "data": {
    "count": 1, 
    "list": [
      {
        "_id": "5add3ca78fbd414c9becdaad-2018-04-26", 
        "created": "2018-04-27 08:45:56", 
        "message": "【两融余额数据】截至04月26日，上交所融资余额报5961.78亿元，较前一交易日减少8.41亿元；深交所融资余额报3899.33亿元，较前一交易日增加7.14亿元；两市合计9861.11亿元，较前一交易日减少1.28亿元。", 
        "show_desktop": true, 
        "updated": "2018-04-27 08:45:56", 
        "version": "2018-04-26"
      }
    ], 
    "pagenum": 1, 
    "pagesize": 20
  }, 
  "meta": {
    "_id": "5add3ca78fbd414c9becdaad", 
    "category": "快讯常规数据", 
    "name": "两融余额数据", 
    "schedule_peroid": 86400, 
    "schedule_start": "2018-04-24 08:45:54"
  }
}
```

* 嵌入页面显示（作为js文件引入）

http://user:password@host:port/provider/show/:rule

此接口用于html页面中嵌入显示数据，只返回一个版本的数据。
参数说明：
version是指定数据版本，留空表示不指定版本返回最后版本数据；
bind是绑定一个html元素，将返回内容渲染到指定元素上。
使用方法：
在页面源代码引入js代码
```html
<script src="http://user:password＠iw.domain.com/provider/show/5ae2ee16f4df240d1ced9f87?version=&bind="></script>
```

## 六、系统架构及扩展性说明

Intelligent Writer的核心部件有３个：

* Nodejs Web IDE，在线编辑和调试脚本，由于程序是动态增加和修改的，系统本身有很多延展性，除了聚合网文产生写作内容，系统向外提供了微接口，承担一些简单而需要快速实现的接口服务端；
* 动态脚本沙箱环境，每个动态脚本都有独立安全的沙箱环境，保证系统的稳健性；
* 动态脚本的定时调度运行系统，这是聚合写作最根本的功能，编写脚本后设定调度周期，系统在到达调度周期时会运行脚本。运行的结果会存入数据库，也就产生了聚合写作的内容，一般情况下每个周期产生的数据为一个版本，无论在一个周期内被运行了多少次都为相同的版本号。定时调度程序比较消耗计算机资源，所以调度任务可以运行在多台机器上，一条聚合写作的脚本只能由一台机器调度运行，为了防止多台计算机交叉重复调度的问题，聚合写作的脚本有分类和分区，分布式运行的一个调度程序只能选择一个数据分区运行。调度程序的运行直接在web界面操作。

### 应用场景

* 聚合写作
开发人员根据写作需求编写脚本，脚本定时调度产生写作内容提供给编辑人员查阅。平台上数据项较多，每个编辑人员都可以只订阅自己关心的那些数据条目，并且在工作台页面调整显示的顺序。

* 运维监测
动态脚本沙箱开放了访问数据库(mongodb,mysql,redis)的功能，通过编写脚本实现系统状态监测，定时运行产生报告，可以在脚本中加入发送邮件功能主动通知相关人员。

* 微服务接口
动态脚本编写为返回函数的方式，该函数可以被外部系统通过http json/jsonp的方式访问，函数的参数通过http post参数传递，也就实现了可以动态编程的微服务API系统，适用于一些背后逻辑不复杂但是需要快速实现的接口。