<!DOCTYPE html>
<html lang="en">
<head>
  <title>WebSocket Echo Client</title>

  <link href="http://vjs.zencdn.net/5.11/video-js.min.css" rel="stylesheet">
  <script src="http://vjs.zencdn.net/5.11/video.min.js"></script>
 <script src="https://github.com/videojs/videojs-contrib-media-sources/releases/download/v4.4.3/videojs-contrib-media-sources.min.js"></script>
  <script src="https://github.com/videojs/videojs-contrib-hls/releases/download/v5.4.1/videojs-contrib-hls.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js"></script>
  <meta charset="UTF-8" />
</head>
<body>
  <div id="content_odd" style="display: inline-block"></div>
  <div id="content_even" style="display: inline-block"></div>

  <script>
  	var server_host = '127.0.0.1';
    var content_odd = document.getElementById('content_odd');
    var content_even = document.getElementById('content_even');
    var socket = new WebSocket('ws://' + server_host + ':15001');
    var connected = 0;
    socket.onopen = function () {

    }

    socket.onmessage = function(message){
    	var data = JSON.parse(message.data);
    	if(data.op == 'newStreaming'){
    		
    	}

    	switch(data.op){
    		case 'newStreaming':
    		connected++;
    		//Do Something for new streaming
    		if(connected % 2 == 1){
    			content_odd.innerHTML += '<video id="my_video_' + data.userID + '" class="video-js vjs-default-skin" controls preload="auto" width="320" height="240" data-setup="{}" autoplay> \
    				<source src="http://' + server_host + '/Sole/mvSource/' + data.userID + '_playlist.m3u8" type="application/x-mpegURL">\
  				</video>';
			}else{
				content_even.innerHTML += '<video id="my_video_' + data.userID + '" class="video-js vjs-default-skin" controls preload="auto" width="320" height="240" data-setup="{}" autoplay> \
    				<source src="http://' + server_host + '/Sole/mvSource/' + data.userID + '_playlist.m3u8" type="application/x-mpegURL">\
  				</video>';
			}

			var player[data.userID] = videojs('my_video_' + data.userID);
			break;
			case 'endStreaming':
			connected--;

			player[data.userID].dispose();
			var elem = document.getElementById('my_video_' + data.userID);
			elem.remove(elem);
			break;
    	}
    }

    socket.onclose = function(){

    }

    socket.onerror = function (error) {
        console.log('WebSocket error: ' + error);
    };
  </script>
</body>
</html>