var http = require('http');
var server = require('websocket').server;
var url = require('url');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var portDistributionServer_port = 15000, webSocketServer_port = 15001;

var server_host = '127.0.0.1';

var mvSourceRoute_Slash = 'C:/xampp/htdocs/Sole/mvSource';
var mvSourceRoute_BSlash = 'C:\\xampp\\htdocs\\Sole\\mvSource';

var socket = new server({
    httpServer: http.createServer().listen(webSocketServer_port,'0.0.0.0')
});

var streamers = new Array(55 + 1);

var clients = [];

http.createServer(function(req, res) {
    var parsedURL = url.parse(req.url);

    if(parsedURL.pathname == '/favicon.ico'){
        console.log('favicon request ignored');
    }
    else if(parsedURL.pathname == '/connectServer'){
        var idx;

        for(var i=0; i<10; i++){
            if(streamers[i] == undefined){
                idx = i;
                break;
            }
        }

        var param = parseQuery(parsedURL.query);

        var openPort = idx * 100 + 60000;
        streamers[idx] = {
            port: openPort,
            op: 'newStreaming',
            userID: param['userID']
        };

        var foo = new openFFMPEG(param['userID'], openPort);

        var json = JSON.stringify(streamers[idx]);

        setTimeout(function(){

            for(var i=0; i<clients.length; i++){
                clients[i].send(json);
            }
        }, 10000);

        console.log('new connection at port ' + openPort + ' userID ' + param['userID']);

        res.writeHead(200, {'Content-Type': 'text/plain'});

        res.write(json);
        res.end();
    }else if(parsedURL.pathname == '/disconnectServer'){
        var param = parseQuery(parsedURL.query);

        var user = findUser(param['port']);
        user.op = 'endStreaming';
        var json = JSON.stringify(user);

        for(var i=0; i < clients.length; i++){
            clients[i].send(json);
        }

        var idx = (parseInt(param['port']) - 60000) / 100;
        streamers[idx] = undefined;

        exec('(for %i in (' + mvSourceRoute_Slash + '/mvSource/*.ts) do @echo file \'%i\') > ' + mvSourceRoute_Slash + '/mvSource/fileList.txt');
        generateFFMPEG(param['userID']);
        exec('DEL /Q ' + mvSourceRoute_BSlash + '\\mvSource\\*.ts ' + mvSourceRoute_BSlash + '\\mvSource\\*.txt ' + mvSourceRoute_BSlash + '\\mvSource\\*.m3u8');

        console.log('disconnection at port ' + param['port']);
    }

}).listen(portDistributionServer_port, '0.0.0.0');

function findUser(port){
    for(var i=0; i<streamers.length;i++){
        if(streamers[i] == undefined)
            continue;
        else if(streamers[i].port == port){
            return streamers[i];
        }
    }
}

function parseQuery(query){
    var pattern = /[a-z]*=[a-z0-9]*/i;
    var parsedQuery = pattern.exec(query);
    var obj = {};
    for(var i = 0; i < parsedQuery.length; i++){
        var split = parsedQuery[i].split('=');
        obj[split[0].trim()] = split[1].trim();
    }

    return obj;
}

function cmd_process(cmd, args, cb_stdout, cb_stderr, cb_end){
    var child = spawn(cmd, args);
    var me = this;
    me.exit = 0;
    me.stdout="";
    child.stdout.on('data', function(data) {cb_stdout(me, data) });
    child.stderr.on('data', function(data) {cb_stderr(me, data) });
    child.stdout.on('end', function() { cb_end(me) });
}

function generateFFMPEG(userID){
    var FFMPEG_command = 'FFMPEG';
    var FFMPEG_args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', mvSourceRoute_Slash + '/mvSource/fileList.txt',
        '-c', 'copy',
        mvSourceRoute_Slash + '/' + userID
    ]
    var foo = new cmd_process(FFMPEG_command, FFMPEG_args,
        function(me, buffer){

        }, function(me, buffer){

        }, function(){
            
    }); 
}

function openFFMPEG(userID, sourcePort){
    var FFMPEG_command = 'FFMPEG';
    var FFMPEG_args = [
        '-i', 'tcp://127.0.0.1:' + sourcePort + '?listen',
        '-codec:v', 'copy',
        '-codec:a', 'copy',
        '-map', '0',
        '-f', 'ssegment',
        '-segment_list_type', 'hls',
        '-segment_list_size', '5',
        '-segment_time', '1',
        '-segment_list_entry_prefix', 'http://' + server_host + '/Sole/mvSource/',
        '-segment_list', mvSourceRoute_Slash + '/' + userID + '_playlist.m3u8',
        '-segment_list_flags', '+live', mvSourceRoute_Slash + '/' + userID + '_out%03d.ts'
    ];
    var foo = new cmd_process(FFMPEG_command, FFMPEG_args,
        function(me, buffer){

        }, function(me, buffer){

        }, function(){
            
        });
}

socket.on('request', function(request) {
    if(clients.length < 100){
        var connection = request.accept(null, request.origin);
        console.log(request.origin);
        clients.push(connection);

        for(var i=0; i<streamers.length; i++){
            if(streamers[i] != undefined){
                var json = JSON.stringify(streamers[i]);
                connection.send(json);
            }
        }

        connection.on('message', function(message) {

        });

        connection.on('close', function(connection) {
            var index = clients.indexOf(connection);
            clients.splice(index, 1);

            console.log('connection closed');
        });
    }else{
        request.reject(null, request.origin);
    }
}); 