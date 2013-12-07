/*
 * WordBridge
 * Modular real-time discussion platform.
 *
 * Copyright (C) 2013 Davide 'Folletto' Casali <folletto AT gmail DOT com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 ******************************************************************************************
 *
 * This is the main application launcher.
 * 
 * Install with:
 *   npm install
 *
 * Run with:
 *   node app.js
 * 
 */


var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var irc = require('irc');
var pawns = require('./classes/pawns');
var config = require('./config.json');

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
    userid: req.session.userid || 'pawnpawnpawn',
    rooms: req.session.rooms || config.defaults.rooms || 'wordbridge-bots'
  });
});

app.all('/c', function(req, res) {
  
  // Session
  req.session.userid = req.body.userid;
  req.session.rooms = req.body.rooms;
  req.session.password = req.body.password;
  
  res.render('c', {
    userid: req.body.userid,
    rooms: req.body.rooms
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
//
// This prepare the pawns and initializes them when the socket events arrives
//
var pawns = new pawns.Pawns(config);

io.sockets.on('connection', function wb_iosocket(socket) {
  
  // ****** Connect
  var configPawn = {
    userid: socket.handshake.session.userid,
    rooms: socket.handshake.session.rooms && socket.handshake.session.rooms.split(" "),
    password: socket.handshake.session.password
  };
  pawns.new(configPawn.userid, configPawn, socket); // add a better ID by using SHA on the password?
  
  
  // ****** Disconnect
  socket.on('disconnect', function(data) {
    pawns.destroyWithHope(configPawn.userid);
    //pawns.destroy(configPawn.userid);
  });
  
});


