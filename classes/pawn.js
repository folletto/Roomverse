/*
 * Pawn Manager
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
 * Socket.io channels used:
 *   bridge: system operations
 *   message: all messages, marked with sender / channel
 * 
 */


// ****** River
// This connects to the channel subsystem
var river = require('./river');


 
 
var Pawn = module.exports.Pawn = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Pawn.prototype = {
  
  init: function(config, configPawn, socket) {
    //
    // Initialize the server-side pawn to manage the rooms
    //
    
    // ****** Instance variables
    this.r = null;
    this.socket = null;
    this.userid = configPawn.userid || "^ThePawn";
    this.configPawn = configPawn || {};
    
    // River
    // this.r = river.RiverFactory.new('irc', username, password, riverConfig, function() {});
    this.r = new river.River(config.pipe, this.userid, configPawn.password, function() {
      // Ready
      this.r.joinChannel(this.configPawn.rooms, this.onJoinChannel.bind(this));
    }.bind(this));
    this.r.onReceive = this.onReceive.bind(this);
    
    // Socket
    this.setSocket(socket);
  },
  
  restore: function(config, configPawn, socket) {
    //
    // Restore a pawn from limbo
    //
    this.setSocket(socket);
    
    // This should restore latest room status, not the initial one... but let's start somewhere
    //TODO: fix this to a proper restore
    for (var i in this.configPawn.rooms) {
      this.onJoinChannel(this.configPawn.rooms[i]);
    }
  },
  
  destroy: function() {
    //
    // Called on disconnect. Let's clean up our rooms.
    //
    this.r.destroy();
    delete r;
  },
  
  /**************************************************************************************************** River */
  onJoinChannel: function(channel) {
    this.socket.emit("message", { userid: "Bridge", room: channel, text: "Joined #" + channel });
  },
  
  onReceive: function(channel, nick, text, data) {
    this.socket.emit("message", { userid: nick, room: channel, text: text });
  },
  
  
  /**************************************************************************************************** Listeners */
  // This dictionary contains all the listeners for the client emitted events
  // (the slightly different syntax is on purpose)
  listeners: {
    
    'message': function(packet) {
      console.log(packet);
      this.r.say(packet.room, packet.text);
    },
    
    'meta': function() {
      // TODO: this will do an internal room broadcast
    },
    
    'bridge-users': function() {
      // TODO
    }
    
  },
  
  
  /**************************************************************************************************** Socket */
  setSocket: function(socket) {
    //
    // Set a new socket. Used when restoring pawns from limbo.
    //
    this.socket = socket;
    
    for (var eventName in this.listeners) {
      this.socket.on(eventName, this.listeners[eventName].bind(this));
    }
  }
}

