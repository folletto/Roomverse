/*
 * WordBridge
 *
 */

var express = require('express')
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var irc = require('irc');
var pawn = require('./classes/pawn');



io.set('log level', 1);



// ****** Middleware
// Post data
app.use(express.bodyParser());

// Sessions
var SESSION_SECRET = 'chumbawamba';
app.use(express.cookieParser());
app.use(express.session({secret: SESSION_SECRET}));

// Jade
app.engine('jade', require('jade').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


// ****** HTTP + Express
server.listen(3000);
app.use(express.static(__dirname + "/public"));



// ****** Routing
app.get('/', function(req, res) {
  res.render('index', {
    nickname: req.session.nickname || 'pawnpawnpawn',
    channels: req.session.channels || 'wbtestchannel'
  });
});

app.all('/c', function(req, res) {
  
  // Session
  req.session.nickname = req.body.nickname;
  req.session.channels = req.body.channels;
  
  res.render('c', {
    nickname: req.body.nickname,
    channels: req.body.channels
  });
});



// ****** Socket.io
// This connects to the client
io.sockets.on('connection', function(socket) {
  
  // Create the connected object.
  // TODO: maybe a pawn manager class?
  var p = new pawn.Pawn(socket);
  
  socket.on('disconnect', function(data) {
    // TODO: make a softer disconnect with a timeout for reconnection
    p.destroy();
    delete p;
  });
  
});


