/*
 * Pawn Manager
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
 * Socket.io channels used:
 *   bridge: system operations
 *   message: all messages, marked with sender / channel
 * 
 */


// ****** River
// This connects to the channel subsystem
var River = require('./river');


 
 
var Pawn = module.exports.Pawn = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Pawn.prototype = {
  
  init: function(config, configPawn, socket, db) {
    //
    // Initialize the server-side pawn to manage the rooms
    //
    
    // ****** Instance variables
    this.river = null;
    this.socket = null;
    this.userid = configPawn.userid || "^ThePawn";
    this.configPawn = configPawn || {};
    this.db = null;
    
    // River
    this.setRiver(new River(config.pipe, this.userid, configPawn.password));
    
    // Socket
    this.setSocket(socket);
    
    // DB
    this.db = db.getSocketListener(socket);
  },
  
  restore: function(config, configPawn, socket) {
    //
    // Restore a pawn from limbo
    //
    this.setSocket(socket);
    
    // This should restore latest room status, not the initial one... but let's start somewhere
    //TODO: fix this to a proper restore
    for (var i in this.configPawn.rooms) {
      this.listenersForRiver['room-join'].call(this, this.configPawn.rooms[i]);
      this.river.getUsers(this.configPawn.rooms[i]);
    }
  },
  
  destroy: function() {
    //
    // Called on disconnect. Let's clean up our rooms.
    //
    this.river.destroy();
    delete this.river;
  },
  
  
  /**************************************************************************************************** Listeners: Client */
  // This dictionary contains all the listeners for the client emitted events
  listenersForClient: {
    
    'message': function(packet) {
      //console.log(packet);
      this.river.say(packet.room, packet.text);
    },
    
    'meta': function() {
      // TODO: this will do an internal room broadcast
    }
    
  },
  
  
  /**************************************************************************************************** Listeners: River */
  // This dictionary contains all the listeners for the pipe emitted events
  listenersForRiver: {
    
    'ready': function() {
      this.river.joinChannel(this.configPawn.rooms);
    },
    
    'message': function(message) {
      this.socket.emit('message', { userid: message.userid, room: message.room, text: message.text });
    },
    
    'room-join': function(channel) {
      this.socket.emit('room-join', channel );
    },
    
    'users-join': function(roomAndUsers) {
      this.socket.emit('users-join', roomAndUsers);
    },
    
    'users-part': function(roomAndUsers) {
      this.socket.emit('users-part', roomAndUsers);
    }
       
  },
  
  
  /**************************************************************************************************** Bind Events */
  setSocket: function(socket) {
    //
    // Set a new socket. Used when restoring pawns from limbo.
    //
    this.socket = socket;
    
    for (var eventName in this.listenersForClient) {
      this.socket.on(eventName, this.listenersForClient[eventName].bind(this));
    }
  },
  
  setRiver: function(river) {
    //
    // Set all the river events
    //
    this.river = river;
    
    for (var eventName in this.listenersForRiver) {
      this.river.on(eventName, this.listenersForRiver[eventName].bind(this));
    }
  }
}

