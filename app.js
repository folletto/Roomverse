/*
 * WordBridge
 *
 */

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var irc = require('irc');
var pawn = require('./classes/pawn');
var config = require('./config.json');

console.info(config);

io.set('log level', 1);



// ****************************************************************************************************
// ****** Middleware

// Post data
app.use(express.bodyParser());

// Sessions
var SESSION_SECRET = 'chumbawamba';
var EXPRESS_SID_KEY = 'express.sid';
var cookieParser = express.cookieParser(SESSION_SECRET);
var sessionStore = new express.session.MemoryStore();
app.use(cookieParser);
app.use(express.session({
  store: sessionStore,
  cookie: { 
    httpOnly: true
  },
  key: EXPRESS_SID_KEY
}));

// Jade
app.engine('jade', require('jade').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');



// ****************************************************************************************************
// ****** HTTP + Express
server.listen(3000);
app.use(express.static(__dirname + "/public"));



// ****************************************************************************************************
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


// ****************************************************************************************************
// ****** Sharing sessions
//
// Socket.io Authorization -> https://github.com/LearnBoost/socket.io/wiki/Authorizing
// Sessions bridge -> https://github.com/leeroybrun/socketio-express-sessions/blob/master/server.js
// 
io.set('authorization', function wb_authorization(data, callback) {
  
  // Cookies?
  if (data.headers.cookie) {
    
    // Getting into the guts of Express 3.0:
    // Call the initialized cookieParser(req, res, next) and handle its next() function call.
    // Express cookieParser(req, res, next) is used initialy to parse data in "req.headers.cookie".
    // Here our cookies are stored in "data.headers.cookie", so we just pass "data" to the first argument of function
    cookieParser(data, {}, function(parseErr) {
      if(parseErr) { return callback('Error parsing cookies.', false); }
      
      // Get the SID that has been decoded by cookieParser into data
      var sessionid = (data.signedCookies && data.signedCookies[EXPRESS_SID_KEY]) ||
                      (data.cookies && data.cookies[EXPRESS_SID_KEY]);
      
      // Now let's load the session
      sessionStore.load(sessionid, function(err, session) {
        if (!err) {
          if (session) {
            data.session = session; // GAME ON, connecting the Express session. Look: socket.handshake.session
            callback(null, true); // Required to start the connection. 
          } else {
            callback('error: undefined session', false);
          }
        } else {
          callback('error: ' + err, false);
        }
      });
    });
  }
});



// ****************************************************************************************************
// ****** Socket.io
// This connects to the client
io.sockets.on('connection', function wb_iosocket(socket) {
  
  // Create the connected object.
  // TODO: maybe a pawn manager class?
  var p = new pawn.Pawn(config, socket);
  console.info(socket.handshake.session);
  
  socket.on('disconnect', function(data) {
    // TODO: make a softer disconnect with a timeout for reconnection
    p.destroy();
    delete p;
  });
  
});


