/*
 * WordBridge: Pawn
 *
 * This is the individual user connected to the socket. It handlers pretty much everything (oh dear).
 *
 */


// ****** River
// This connects to the channel subsystem
var river = require('./river');


 
 
var Pawn = module.exports.Pawn = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Pawn.prototype = {
  
  socket: null,
  r: null,
  
  nickname: "",
  
  init: function(config, socket) {
    //
    // Initialize the server-side pawn to manage the channels
    //
    var self = this;
    
    // Socket.io
    this.socket = socket;
    this.nickname = config.pawn.nickname || "^ThePawn";
    
    
    // River
    this.r = new river.River(config, this.nickname);
    this.r.onReady = function() {
      self.r.joinChannel(config.pawn.channels, function(channel) {
        self.socket.emit("bridge", { channel: "wbtestchannel", nick: "System", text: "Joined #" + channel });
      });
    }
    
    this.r.onReceive = function(channel, nick, text, data) {
      self.socket.emit("bridge", { channel: channel, nick: nick, text: text });
    }
    
    this.socket.on('bridge', function(data) {
      console.log(data);
      self.r.say("wbtestchannel", data.text);
    });
  },
  
  destroy: function() {
    //
    // Called on disconnect. Let's clean up our channels.
    //
    this.r.destroy();
    delete r;
  }
}