/*
 * WordBridge
 *
 */

var express = require('express')
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

app.use(express.static(__dirname + "/public"));

app.get('/ver', function (req, res) {
  //res.sendfile(__dirname + '/x.html');
  res.send("Realtime Haikus.")
});

io.sockets.on('connection', function (socket) {

  socket.emit("bridge", { message: "Welcome to our humble server." });

  socket.on('bridge', function (data) {
    console.log(data);
  });
});