var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var server_host = '127.0.0.1';

module.exports = {
    clear: function(){
        exec('DEL /Q ' + mvSourceRoute_BSlash + '\\' + user.userID + '_*.ts ' + mvSourceRoute_BSlash + '\\' + user.userID + '_*.m3u8');
    },
    
    cmd_process: function (cmd, args, cb_stdout, cb_stderr, cb_end){
        var child = spawn(cmd, args);
        var me = this;
        me.exit = 0;
        me.stdout="";
        child.stdout.on('data', function(data) {cb_stdout(me,data) });
        child.stderr.on('data', function(data) {cb_stderr(me,data) });
        child.stdout.on('end', function() { cb_end(me) });
    },

    generateFFMPEG: function (userID){
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

        }, function(){

        });
    },

    openFFMPEG: function (userID, sourcePort){
    var ds = (new Date()).toISOString().replace(/[^0-9]/g, "").slice(0,14);
    var FFMPEG_command = 'FFMPEG';
    var FFMPEG_args = [
        '-i', 'tcp://' + server_host + ':' + sourcePort + '?listen',
        '-codec:v', 'libx264',
        '-codec:a', 'aac',
        '-map', '0',
        '-f', 'ssegment',
        '-segment_list_type', 'hls',
        '-segment_list_size', '5',
        '-segment_time', '1',
        '-segment_list_entry_prefix', 'http://' + server_host + '/Sole/mvSource/',
        '-segment_list', mvSourceRoute_Slash + '/' + userID + '_playlist.m3u8',
        '-segment_list_flags', '+live', mvSourceRoute_Slash + '/' + userID + '_out%03d.ts' /*,
        '-codec:v', 'copy',
        '-codec:a', 'copy',
        mvSourceRoute_Slash + '/' + userID + '_' + ds + '_out.mp4'*/
    ];
    var foo = new cmd_process(FFMPEG_command, FFMPEG_args,
        function(me, buffer){
            
        }, function(me, buffer){

        }, function(){

        });
    }
}