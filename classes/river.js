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

  init: function(config, nick, password, fx) {
    //
    // Initialize the river class to manage the channels
    //
    console.log("~~~river~~~ Starting for %s...", nick);

    this.nick = nick || "^WB-Pawn";
    this.onReady = fx || this.onReady;

    // ****** Let's IRC
    config.userName = this.nick;
    config.realName = this.nick + " (WB Test Client)";
    if (password) config.password = password;
    /*var configIRC = {
      userName: this.nick,
      realname: this.nick + " (WB Test Client)",
      port: config.port,
      channels: [],
      
      secure: config.secure,
      sasl: config.sasl,
      
    };
    if (password) configIRC.password = password;*/
    this.ircc = new irc.Client(config.server, this.nick, config);

    // ****** Binding season
    this.ircc.addListener('error', this._listenErrors.bind(this)); // avoid the IRC client to terminate
    this.ircc.addListener('registered', this._listenRegistered.bind(this)); // triggered when connected
    this.ircc.addListener('message', this._listenMessage.bind(this)); // messages
    this.ircc.addListener('names', this._listenNames.bind(this)); // names
    //this.ircc.addListener('raw', this._listenRaw.bind(this)); // raw, use for debug
  },
  
  destroy: function() {
    //
    // Closing? Close IRC.
    //
    //console.log("~~~river~~~ Killing IRC");
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
    
    if (channels) {
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
    }
  },

  leaveChannel: function(channel, fx) {
    console.log("~~~river~~~ Leaving #" + channel);
    this.ircc.part('#' + channel, fx);
  },

  say: function(channel, text) {
    if (this.ircc) {
      this.ircc.say("#" + channel, text);
    }
  },
  
  getUsers: function(channel) {
    if (this.ircc) {
      this.ircc.send('NAMESX', channel);
    }
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
  
  _listenNames: function(channel, nicks) {
    // Triggered when asking list of users
    console.log('channel: ', nicks);
  },
  
  _listenRaw: function(message) {
    // Mostly used for debug...
    console.log(message);
  }
}