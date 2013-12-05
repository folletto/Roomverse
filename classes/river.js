/*
 * River Channel Manager
 * This file is part of WordBridge.
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
 * This is the abstraction library to allow for protocol-independent support.
 * 
 */

var irc = require('irc');

var River = module.exports.River = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
River.prototype = {

  ircc: null,
  nick: "",

  onReady: null,

  init: function(config, nick, password, onReady, onReceive) {
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
      password: password,
    });

    // ****** Binding season
    this.ircc.addListener('error', this._listenErrors.bind(this)); // avoid the IRC client to terminate
    this.ircc.addListener('registered', this._listenRegistered.bind(this)); // triggered when connected
    this.ircc.addListener('message', this._listenMessage.bind(this)); // messages
    //this.ircc.addListener('raw', this._listenRaw.bind(this)); // raw, use for debug
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


  /**************************************************************************************************** API
   * Try limiting the usage of the class to these methods.
   */
  
  /****** Calls */
  joinChannel: function(channels, fx) {
    var self = this;
    
    if (channels.length > 0) {
      for (var i in channels) {
        console.log("~~~river~~~ Joining #" + channels[i]);
        this.ircc.join("#" + channels[i], function(nick, message) { 
          var channel = message.args[0].replace(/#/, "");
          if (fx) fx(channel)
          else self._listenChannelJoin(channel);
        });
      }
    }
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
    //
    // Handle errors if possible, or fire them to the console.
    //
    
    if (message.command === 'err_passwdmismatch') {
      // ****** Password error
      console.log("Authentication Failed.");
    } else {
      // ****** Everything else
      console.log("~~~river~~~ ERROR----------------------------------------!");
      console.log(message);
    }
  },

  _listenRegistered: function(message) {
    console.log("~~~river~~~ Ready.");
    this.onReady();
  },

  _listenMessage: function(nick, to, text, message) {
    this.onReceive(to.replace("#", ""), nick, text, message);
  },

  _listenChannelJoin: function(channel) {
    console.log("~~~river~~~ Joined " + channel);
  },
  
  _listenRaw: function(message) {
    // Mostly used for debug...
    console.log(message);
  }
}