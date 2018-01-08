<?php
	$i = 0;
	$host = 'localhost';
	$port = 7385;

	$listenSocket = null;


	openListenSocket();

	connectWebSocket();

	function openListenSocket(){
		global $listenSocket, $host, $port;

		$listenSocket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
		if(socket_bind($listenSocket, $host, $port) == FALSE)
			echo('Bind Failed!');

		if(socket_listen($listenSocket) == FALSE)
			echo('Listen Failed!');
	}

	function connectWebSocket(){
		global $listenSocket, $host, $port;

		$connection = socket_accept($listenSocket);
		if($connection == FALSE)
			echo('Accept Failed!');
		else
			echo('Listen on '. $host . ':' . $port);		

		webSocketHandShake($connection);
	}

	function webSocketHandShake($connection){		
		global $host, $port;

		$buf = '';

		socket_recv($connection, $buf, 2048, MSG_PEEK);

		$r = array();

		preg_match("/Sec-WebSocket-Key: ([^, ]+)\r\n/", $buf, $r);

		$secKey = $r[1];
		$secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
		$upgrade  = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
		"Upgrade: websocket\r\n" .
		"Connection: Upgrade\r\n" .
		"WebSocket-Origin: $host\r\n" .
		"WebSocket-Location: ws://$host:$port/WebSocketDaemon.php\r\n".
		"Sec-WebSocket-Accept:$secAccept\r\n\r\n";

		socket_write($connection,$upgrade,strlen($upgrade));

	}
?>