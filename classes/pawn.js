/*
 * WordBridge: Pawn
 *
 * This is the individual user connected to the socket. It handlers pretty much everything (oh dear).
 *
 * Socket.io channels used:
 *   bridge: system operations
 *   message: all messages, marked with sender / channel
 */


// ****** River
// This connects to the channel subsystem
var river = require('./river');


 
 
var Pawn = module.exports.Pawn = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Pawn.prototype = {
  
  socket: null,
  r: null,
  
  userid: "",
  
  init: function(config, socket) {
    //
    // Initialize the server-side pawn to manage the rooms
    //
    var self = this;
    
    // Socket.io
    this.socket = socket;
    this.userid = config.pawn.userid || "^ThePawn";
    
    
    // River
    this.r = new river.River(config, this.userid);
    this.r.onReady = function() {
      self.r.joinChannel(config.pawn.rooms, function(channel) {
        self.socket.emit("message", { userid: "Bridge", room: channel, text: "Joined #" + channel });
      });
    }
    
    this.r.onReceive = function(channel, nick, text, data) {
      self.socket.emit("message", { userid: nick, room: channel, text: text });
    }
    
    this.socket.on('message', function(packet) {
      console.log(packet);
      self.r.say(packet.room, packet.text);
    });
  },
  
  destroy: function() {
    //
    // Called on disconnect. Let's clean up our rooms.
    //
    this.r.destroy();
    delete r;
  }
}