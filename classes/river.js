/*
 * River Channel Manager
 * This file is part of Roomverse.
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
var Emitter = require('./emitter');

var River = module.exports = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
River.prototype = {

  ircc: null,
  nick: "",

  init: function(config, nick, password) {
    //
    // Initialize the river class to manage the channels
    //
    Emitter(River.prototype); // Mixin
    
    console.log("~~~river~~~ Starting for %s...", nick);
    
    this.nick = nick || "^WB-Pawn";

    // ****** Let's IRC
    config.userName = this.nick;
    config.realName = this.nick + " (WB Test Client)";
    if (password) config.password = password;
    
    // ****** Binding season
    this.setIRC(new irc.Client(config.server, this.nick, config));
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
  
  /**************************************************************************************************** API */
  joinChannel: function(channels) {
    var self = this;
    
    if (channels) {
      if (channels.length > 0) {
        for (var i in channels) {
          console.log("~~~river~~~ Joining #" + channels[i]);
          this.ircc.join("#" + channels[i], function(nick, message) { 
            var channel = message.args[0].replace(/#/, "");
            self.emit('room-join', channel);
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
      this.ircc.send('NAMES', '#' + channel);
    }
  },
  
  
  /**************************************************************************************************** Listeners for IRC */
  // This dictionary contains all the listeners for the pipe emitted events
  listenersForIRC: {
    
    'error': function(message) {
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
    
    'registered': function(message) {
      this.emit('ready', message);
    },
    
    'message': function(nick, to, text, message) {
      //
      // Message receiver either from channel or user. 
      //
      if (to[0] == '#') {
        // Channel
        this.emit('message', { userid: nick, room: to.replace("#", ""), text: text });
      } else {
        // User
        this.emit('message', { userid: nick, room: "@" + nick, text: text });
      }
    },
    
    'names': function(channel, nicks) {
      //
      // Trigger the same callback as join
      //
      var users = [];
      for (var key in nicks) users.push(key);
      
      this.emit('users-join', { room: channel.replace("#", ""), users: users });
    },
    
    'join': function(channel, nick, message) {
      //
      // A user has joined
      //
      this.emit('users-join', { room: channel.replace("#", ""), users: [nick] });
    },
    
    'part': function(channel, nick, reason, message) {
      //
      // A user has parted
      //
      this.emit('users-part', { room: channel.replace("#", ""), users: [nick] });
    },
    
    'quit': function(nick, reason, channels, message) {
      //
      // A user quit (so, parted as well, but multiple channels), normalizing ping
      //
      for (var i in channels) {
        this.emit('users-part', { room: channels[i].replace("#", ""), users: [nick] });
      }
    },
    
    'kill': function(nick, reason, channels, message) {
      //
      // A user was killed by the server (so, parted as well, but multiple channels), normalizing ping
      //
      for (var i in channels) {
        this.emit('users-part', { room: channels[i].replace("#", ""), users: [nick] });
      }
    },
    
    'kick': function(nick, reason, channels, message) {
      //
      // A user was kicked, so, parted
      //
      this.emit('users-part', { room: channel.replace("#", ""), users: [nick] });
    },
    
    'raw': function(message) {
      // Mostly used for debug...
      //console.log(message);
    }
       
  },
  
  
  /**************************************************************************************************** Bind Events */
  setIRC: function(ircc) {
    //
    // Set all the IRC client events.
    //
    this.ircc = ircc;
    
    for (var eventName in this.listenersForIRC) {
      this.ircc.addListener(eventName, this.listenersForIRC[eventName].bind(this));
    }
  }
  
}