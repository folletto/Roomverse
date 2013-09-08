/*
 * WordBridge
 *
 */

var express = require('express')
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var irc = require('irc');
var river = require('./classes/river');


io.set('log level', 1);



// ****** HTTP + Express
// This initializes the server and creates the hooks for the express pages
server.listen(3000);
app.use(express.static(__dirname + "/public"));



// ****** River
// This connects to the channel subsystem
var r = new river.River("^ThePawn");
r.onReady = function() {
  r.joinChannel("wbtestchannel");
}


// ****** Socket.io
// This connects to the client
io.sockets.on('connection', function (socket) {

  r.onReceive = function(channel, nick, text, data) {
    socket.emit("bridge", { from: nick, to: channel, message: text});
  }

  socket.on('bridge', function (data) {
    console.log(data);
    r.say("wbtestchannel", data.message);
  });

});
