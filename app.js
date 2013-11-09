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



// ****** Middleware
// Post data
app.use(express.bodyParser());

// Sessions
app.use(express.cookieParser());
app.use(express.session({secret: 'chumbawamba'}));

// Jade
app.engine('jade', require('jade').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// ****** HTTP + Express
server.listen(3000);
app.use(express.static(__dirname + "/public"));



// ****** Routing
app.get('/', function(req, res) {
  res.render('index');
});

app.all('/c', function(req, res) {
  res.render('c', {
    nickname: req.body.nickname,
    channel: req.body.channel
  });
});



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
    socket.emit("bridge", { channel: channel, nick: nick, text: text });
  }

  socket.on('bridge', function (data) {
    console.log(data);
    r.say("wbtestchannel", data.text);
  });

});
