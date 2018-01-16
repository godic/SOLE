var server_host = '127.0.0.1';

var hasFlash = ((typeof navigator.plugins != "undefined" &&
  typeof navigator.plugins["Shockwave Flash"] == "object") ||
  (window.ActiveXObject &&
    (new ActiveXObject("ShockwaveFlash.ShockwaveFlash")) != false));

var player = new Array();
var socket = new WebSocket('ws://' + server_host + ':15001');

var connected = 0;

init();

function init(){
  var content_odd = document.getElementById('content_odd');
  var content_even = document.getElementById('content_even');
  
  socket.onopen = function () {
  	socket.send(JSON.stringify({
  		op: 'join',
  		href: window.location.href
  	}));
    console.log("websocket connected");
  }

  socket.onmessage = function(message){
    var data = JSON.parse(message.data);

    switch(data.op){
      case 'newStreaming':
        connected++;


        if(connected % 2 == 1){
          content_odd.appendChild(newStreaming(data.userID));
        }else{
          content_even.appendChild(newStreaming(data.userID));
        }
        
        createVideo(data.userID);
      break;
      case 'endStreaming':
        connected--;

        player[data.userID].dispose();
        player[data.userID] = null;
      break;
      case 'chat':
        addChat(data.chatter, data.message)
      break;
    }
  }

  socket.onclose = function(){

  }

  socket.onerror = function (error) {
      console.log('WebSocket error: ' + error);
  };
}

function createVideo(userID){
  //Do Something for new streaming

  if(hasFlash)
    player[userID] = videojs('stream_' + userID, {techOrder: ['flash']});
  else
    player[userID] = videojs('stream_' + userID);

  player[userID].ready(function(){
    var mvPlayer = player[userID];
    console.log('video is ready');
    mvPlayer.play();
  });
}

function newStreaming(userID){
  var videoElement = document.createElement('video');
  var sourceElement = document.createElement('source');

  videoElement.setAttribute('id', 'stream_' + userID);

  videoElement.appendChild(sourceElement);

  videoElement.setAttribute('class', 'video-js vjs-default-skin videoContent');
  videoElement.autoplay=true;
  videoElement.controls=true;

  sourceElement.setAttribute('src', 'http://' + server_host + '/Sole/mvSource/' + userID + '_playlist.m3u8');
  sourceElement.setAttribute('type', 'application/x-mpegURL');

  return videoElement;
}

function sendChat(){
  var userID = document.getElementById('chat_ID');
  var msg = document.getElementById('chat_message');

  var data = JSON.stringify({
    op: 'chat',
    chatter: userID.value,
    message: msg.value
  });

  socket.send(data);
  msg.value="";
}

function addChat(chatter, message){
  var chatLog = document.getElementById('chat_log');
  chatLog.innerHTML+='<p style="margin:0; padding:0"><b>' + chatter + ' : </b>'+message+'</p>';
  chatLog.scrollTop = chatLog.scrollHeight;
}