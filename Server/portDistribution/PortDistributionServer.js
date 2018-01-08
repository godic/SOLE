var http = require('http');
var fs = require('fs');

var clients = [];

http.createServer(function(req, res) {
	clients.push(clients.length);

	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write('{port : clients.length}');
	res.end();

}).listen(55000);