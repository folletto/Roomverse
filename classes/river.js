/*
 * WordBridge
 *
 * Communication class to whatever system is in place to handle the channels
 * Right now... let's say IRC.
 *
 */

var irc = require('irc');

var IRC_SERVER = "chat.freenode.net";

var River = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
River.prototype = {

  ircc: null,
  nick: "",

  onReady: null,

  init: function(nick, onReady, onReceive) {
    //
    // Initialize the river class to manage the channels
    //
    console.log("~~~river~~~ starting...");

    this.nick = nick || "^WB-Pawn";
    this.onReady = onReady || this.onReady;
    this.onReceive = onReceive || this.onReceive;

    // ****** Let's IRC
    this.ircc = new irc.Client(IRC_SERVER, this.nick, {
      userName: this.nick,
      realname: "WB Test Client",
      port: 6667,
      channels: [],
    });

    // ****** Binding season
    this.ircc.addListener('error', this._listenErrors.bind(this)); // avoid the IRC client to terminate
    this.ircc.addListener('registered', this._listenRegistered.bind(this)); // triggered when connected
    this.ircc.addListener('message', this._listenMessage.bind(this)); // messages
  },


  /**************************************************************************************************** API */
  joinChannel: function(channel) {
    console.log("~~~river~~~ joining #" + channel);
    this.ircc.join('#' + channel, this.listendChannelJoin.bind(this));
  },

  leaveChannel: function(channel) {
    console.log("~~~river~~~ leaving #" + channel);
    this.ircc.part('#' + channel);
  },

  say: function(channel, text) {
    this.ircc.say("#" + channel, text);
  },


  /**************************************************************************************************** Events */
  // These events should be re-bound to external functions.
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

  _listenChannelJoin: function(nick, to, text, message) {
    console.log("~~~river~~~ Joined.");
  }
}

module.exports.River = River;