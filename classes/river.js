/*
 * WordBridge: River
 *
 * Communication class to whatever system is in place to handle the channels
 * Right now... let's say IRC.
 *
 */

var irc = require('irc');

var River = module.exports.River = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
River.prototype = {

  ircc: null,
  nick: "",

  onReady: null,

  init: function(config, nick, onReady, onReceive) {
    //
    // Initialize the river class to manage the channels
    //
    console.log("~~~river~~~ Starting...");

    this.nick = nick || "^WB-Pawn";
    this.onReady = onReady || this.onReady;
    this.onReceive = onReceive || this.onReceive;

    // ****** Let's IRC
    this.ircc = new irc.Client(config.irc.server, this.nick, {
      userName: this.nick,
      realname: "WB Test Client",
      port: config.irc.port,
      channels: [],
      
      secure: config.irc.secure,
      sasl: config.irc.sasl,
      //password: 'username:password',
    });

    // ****** Binding season
    this.ircc.addListener('error', this._listenErrors.bind(this)); // avoid the IRC client to terminate
    this.ircc.addListener('registered', this._listenRegistered.bind(this)); // triggered when connected
    this.ircc.addListener('message', this._listenMessage.bind(this)); // messages
  },
  
  destroy: function() {
    //
    // Closing? Close IRC.
    //
    var self = this;
    this.ircc.disconnect(":)", function() {
      delete self.ircc;
    });
  },


  /**************************************************************************************************** API */
  
  /****** Calls */
  joinChannel: function(channel, fx) {
    console.log("~~~river~~~ Joining #" + channel);
    this.ircc.join('#' + channel, fx || this._listenChannelJoin.bind(this));
  },

  leaveChannel: function(channel, fx) {
    console.log("~~~river~~~ Leaving #" + channel);
    this.ircc.part('#' + channel, fx);
  },

  say: function(channel, text) {
    this.ircc.say("#" + channel, text);
  },


  /****** Events */
  onReady: function() {
    console.log("~~~river~~~ Server ready. Nothing to do.");
  },

  onReceive: function(channel, nick, text, data) {
    console.log("~~~river~~~ Received a message. Nothing to do.");
  },


  /**************************************************************************************************** Handle IRC */
  _listenErrors: function(message) {
    console.log("~~~river~~~ ERROR!");
    console.log(message);
  },

  _listenRegistered: function(message) {
    console.log("~~~river~~~ Ready.");
    this.onReady();
  },

  _listenMessage: function(nick, to, text, message) {
    this.onReceive(to, nick, text, message);
  },

  _listenChannelJoin: function(nick, message) {
    console.log("~~~river~~~ Joined " + message.args[0]);
  }
}