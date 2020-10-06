const gritty = require('gritty');
/**
 * Created by cherokee on 15-4-2.
 */
var socketIo = null;

const getSocketIO = () =>{
    return socketIo;
}

const runServer = function(server, settings) {
    socketIo = require('socket.io')(server);
    gritty.listen(socketIo,{'prefix':settings['gritty_prefix']});

    let logger = settings['logger'];
    //socket io init
    socketIo.on('connection', function(socket) {
        let socketId = socket.id;
        let remoteAddress = socket.client.conn.remoteAddress || 'client';
        let idStr = `${socketId}(${remoteAddress})`;

        logger.debug(idStr + ' connected');

        // socket.on('event', function(data){
        //    settings['logger'].debug('somebody send event');
        // });
        socket.on('disconnect', function() {
            logger.debug(idStr + ' disconnected');
        });

        socket.on('join', function(room) {
            socket.join(room);
            logger.debug(idStr + ' join manager room '+room);
            socketIo.to(room).emit('log', idStr+' join room '+room+', waiting for log.');
        });

    });

}

module.exports = {
    'runServer' : runServer,
    'getSocketIO' : getSocketIO
}