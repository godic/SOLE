var http = require('http');
var server = require('websocket').server;
var url = require('url');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var portDistributionServer_port = 15000, webSocketServer_port = 15001;
var basePort = 10000;

var server_host = '127.0.0.1';

var mvSourceRoute_Slash = 'C:/xampp/htdocs/Sole/mvSource';
var mvSourceRoute_BSlash = 'C:\\xampp\\htdocs\\Sole\\mvSource';

var socket = new server({
    httpServer: http.createServer().listen(webSocketServer_port, '0.0.0.0')
});

var streamers = new Array(55 + 1);

var clients = [];
var processes = [];
var room = [];

http.createServer(function(req, res) {
    var requestURL = url.parse(req.url);
    var URLpath = requestURL.pathname.slice(1);
    var URLquery = requestURL.query;

    if(URLpath == '/favicon.ico'){
        console.log('favicon request ignored');
    }else{
        console.log(URLpath + '(' + URLquery + ');');
        eval(URLpath + '(res,\'' + URLquery + '\');');
    }
}).listen(portDistributionServer_port, '0.0.0.0');

function getStreaming(res, requestQuery){
    res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});

    var cnt = 0;
    var list = new Array();

    for(var index in room){
        cnt++;
        list.push(room[index]);

        if(cnt >= 10)
            break;
    }

    res.write(JSON.stringify(list));
    res.end();
}

function connectServer(res, requestQuery){
    var idx;

    for(var i=0; i<10; i++){
        if(streamers[i] == undefined){
            idx = i;
            break;
        }
    }

    var param = parseQuery(requestQuery);

    console.log(param);

    var openPort = idx * 100 + basePort;
    var curStreamers = {
        port: openPort,
        op: 'newStreaming',
        userID: param['userID'],
        roomName: param['roomName']
    };

    processes[idx] = openFFMPEG(param['userID'], openPort);

    var json = JSON.stringify(curStreamers);

    if(room[param['roomName']] == undefined){
        room[param['roomName']] = {
            roomName: param['roomName'],
            streamers:[],
            viewers:[]
        };

        console.log(room);
    }

    room[param['roomName']].streamers[param['userID']] = curStreamers;

    streamers[idx] = curStreamers;
    for(var i=0; i<room[param['roomName']].viewers.length; i++){
        room[param['roomName']].viewers[i].send(json);
    }

    console.log('new connection at port ' + openPort + ' userID ' + param['userID']);

    res.writeHead(200, {'Content-Type': 'text/plain'});

    res.write(json);
    res.end();
}

function disconnectServer(res, requestQuery){
    var param = parseQuery(requestQuery);

    console.log('disconnection at port ' + param['port']);

    var curRoom = findRoom(param['userID']);
    if(curRoom != undefined){
        curRoom.op = 'endStreaming';
        var json = JSON.stringify(curRoom.streamers[param['userID']]);

        for(var i=0; i < curRoom.viewers.length; i++){
          curRoom.viewers[i].send(json);
        }

        curRoom.streamers[param['userID']] = undefined;

        var idx = (parseInt(param['port']) - basePort) / 100;

        processes[idx].stdin.write('q');
        processes[idx] = null;

        exec('DEL /Q ' + mvSourceRoute_BSlash + '\\' + param['userID'] + '_*.ts ' + mvSourceRoute_BSlash + '\\' + param['userID'] + '_*.m3u8');
    }
}

function findRoom(userID){
    for(var i=0; i<room.length;i++){
        if(room[i] == undefined)
            continue;
        else if(room[i].streamers[userID] != undefined){
            return room[i];
        }
    }
}

function parseQuery(query){
    //var pattern = /[a-z]+=[a-z0-9]+/gi;
    var parsedQuery = query.split('&');

    //var parsedQuery = pattern.exec(query);
    console.log(parsedQuery);
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
    child.stdout.on('data', function(data) {cb_stdout(me,data) });
    child.stderr.on('data', function(data) {cb_stderr(me,data) });
    child.stdout.on('end', function() { cb_end(me) });

    return child;
}

function generateFFMPEG(userID){
    var FFMPEG_command = 'FFMPEG';
    var FFMPEG_args = [
        '-f', 'concat',
        '-safe', '0',
        '-i', mvSourceRoute_Slash + '/fileList.txt',
        '-c', 'copy',
        mvSourceRoute_Slash + '/' + userID
    ]
    var foo = new cmd_process(FFMPEG_command, FFMPEG_args,
        function(me, buffer){

        }, function(me, buffer){
        console.log(buffer.toString());
        }, function(){

    });
}

function openFFMPEG(userID, sourcePort){
    var ds = (new Date()).toISOString().replace(/[^0-9]/g, "").slice(0,14);
    var FFMPEG_command = 'FFMPEG';
    var FFMPEG_args = [
        '-i', 'udp://' + server_host + ':' + sourcePort,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv422p',
        '-c:a', 'aac',
        '-f', 'hls',
        '-hls_segment_type', 'mpegts',
        '-hls_flags', 'split_by_time',
        '-hls_time', '3',
        '-hls_list_size', '2',
        '-hls_base_url', 'http://' + server_host + '/Sole/mvSource/',
        '-hls_segment_filename', mvSourceRoute_Slash + '/' + userID + '_out%03d.ts',
        mvSourceRoute_Slash + '/' + userID + '_playlist.m3u8',
        mvSourceRoute_Slash + '/' + ds + '_' + userID + '_playlist.mp4'
    ];
    return cmd_process(FFMPEG_command, FFMPEG_args,
        function(me, buffer){
        console.log(buffer.toString());
        }, function(me, buffer){
        console.log(buffer.toString());
        }, function(){

        });
}

socket.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    console.log(request.origin);

    var roomName;

    connection.on('message', function(message) {
        
        var data = JSON.parse(message.utf8Data);

        switch(data.op){
            case 'join':
                var query = parseQuery(url.parse(data.href).query);
                roomName = query['roomName'];
                room[roomName].viewers.push(connection);
                
                for(var streamerIdx in room[roomName].streamers){
                    connection.send(JSON.stringify(room[roomName].streamers[streamerIdx]));
                }
            break;
            case 'chat':
                for(var i=0; i<room[roomName].viewers.length; i++){
                    room[roomName].viewers[i].send(JSON.stringify(data));
                }
            break;
        }
    
    });

    connection.on('close', function(connection) {
        var index = room[roomName].viewers.indexOf(connection);
        room[roomName].viewers.splice(index, 1);

        console.log('connection closed');
    });
});