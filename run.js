const cluster = require('cluster');
const os = require('os');
const path = require('path');
const chalk = require('chalk');

////log setting////////////////////////////////////////////////////////////////////
const logging = require('./lib/logging.js');
////arguments parse///////////////////////////////////////////////////////////////
const userArgv = require('optimist')
    .usage('Usage: -e [dev|test|pro] -p [port] -h')
    .options('e', {
        'alias': 'env',
        'default': 'dev',
        'describe': 'Specify a environment(profile), dev|test|pro'
    })
    .options('p', {
        'alias': 'port',
        'default': 8811,
        'describe': 'Specify a service port, only for web service'
    })
    .options('h', {
        'alias': 'help',
        'describe': 'Help infomation'
    });

const options = userArgv.argv;
if (options['h']) {
    userArgv.showHelp();
    process.exit();
}
/////profile//////////////////////////////////////////////////////////////////
process.env.profile = process.env.profile || options['e'];
/////settings//////////////////////////////////////////////////////////////////
const settings = require('./settings-' + process.env.profile + '.json');
settings['port'] = options['p'];
////log level/////////////////////////////////////////////////////////////////
var log_level = 'DEBUG';
if (settings['log_level']) log_level = settings['log_level'];
const my_child_no = process.env.child_no || 0;

    ////web service////////////////////////////////////////////////////////////
const webService = function(n) {
    let webapp = new(require('./web/app.js'))(settings);

    let logger = logging.getLogger('web', log_level, my_child_no, settings['log_appender']);
    settings['port'] = parseInt(options['p']);
    settings['logger'] = logger;
    
    //number of worker
    let numCPUs = n || os.cpus().length;
    let workers = {};
    let worker_orders = {};
    if (cluster.isMaster) {

        cluster.on('listening', function(worker, address) {
            console.log(chalk.green.bold('Start new web worker, pid: ' + worker.process.pid + ', cluster No.' + worker_orders[worker.process.pid] + ', Address: ' + address.address + ":" + address.port));
        });

        cluster.on('exit', function(worker, code, signal) {
            //restart process while a process exit
            let child_no = worker_orders[worker.process.pid];
            console.log(chalk.bgWhite.red.bold('Web worker ' + worker.process.pid + ', No.' + worker_orders[worker.process.pid] + ' died'));
            delete workers[worker.process.pid];
            delete worker_orders[worker.process.pid];
            let new_worker = cluster.fork({
                'child_no': child_no
            });
            workers[new_worker.process.pid] = new_worker;
            worker_orders[new_worker.process.pid] = child_no;
        });

        //fork cluster members
        for (let i = 0; i < numCPUs; i++) {
            let worker = cluster.fork({
                'child_no': i + 1
            });
            workers[worker.process.pid] = worker;
            worker_orders[worker.process.pid] = i + 1;
        }
    } else {
        //start web service
        webapp.start();
    }
    //shutdown all cluster members while master shutdown
    process.on('SIGTERM', function() {
        for (let pid in workers) {
            process.kill(pid);
        }
        process.exit(0);
    });
}
////route/////////////////////////////////////////////////////////////////////

if( options['h']){
    userArgv.showHelp();
}else{
    webService(1);
}
