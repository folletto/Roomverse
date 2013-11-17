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
  
  init: function(config, socket) {
    //
    // Initialize the server-side pawn to manage the channels
    //
    var self = this;
    
    // Socket.io
    this.socket = socket;
    
    
    // River
    this.r = new river.River(config, "^ThePawn");
    this.r.onReady = function() {
      self.r.joinChannel("wbtestchannel", function() {
        self.socket.emit("bridge", { channel: "wbtestchannel", nick: "System", text: "Joined #wbtestchannel" });
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