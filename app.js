/*
 * WordBridge
 *
 */

var express = require('express')
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var irc = require('irc');

/********** IRC Wraps */

var ssss = null; // DIRTY

var ircc = new irc.Client("chat.freenode.net", "^Follettoid", {
  userName: "^Folletto",
  realname: "Follettoid // Test Client",
  port: 6667,
  channels: [],
});

ircc.addListener("raw", function (message) {
  if (message.command != "rpl_motd") {
    //console.log(".", message);
  }

  if (message.command == "MODE") {
    irccPrepare();
  }
});

ircc.addListener("+mode", function (channel, by, mode, argument, message) {
  console.log("****");
  console.log("****");
  console.log("****");
  console.log("+", message);
});

ircc.addListener("message", function (from, to, message) {
  console.log(from + ' => ' + to + ': ' + message);
});

ircc.addListener("message#wbtestchannel", function (nick, message) {
  ssss.emit("bridge", { from: nick, to: "#wbtestchannel", message: message});
});

ircc.addListener('error', function(message) {
  console.log('error: ', message);
});

function irccPrepare() {
  ircc.join('#wbtestchannel');
}





/********** Server */
server.listen(3000);

app.use(express.static(__dirname + "/public"));

app.get('/ver', function (req, res) {
  //res.sendfile(__dirname + '/x.html');
  res.send("Realtime Haikus.")
});

io.sockets.on('connection', function (socket) {
  ssss = socket;

  socket.emit("bridge", { message: "Welcome to our humble server." });

  socket.on('bridge', function (data) {
    console.log(data);
    ircc.say("#wbtestchannel", data.message);
  });
});