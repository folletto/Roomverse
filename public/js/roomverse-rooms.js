/*
 * Rooms
 * This file is part of Roomverse.
 *
 * Copyright (C) 2014 Davide 'Folletto' Casali <folletto AT gmail DOT com>
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
 * Manages individual Room objects.
 *
 */


var Rooms = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Rooms.prototype = {
  
  init: function(roomListId, roomsId, sidebarId) {
    //
    // Prepare the rooms manager.
    //
    
    // ****** Init instance variables
    this.dom = {
      list: $('#' + roomListId),
      rooms: $('#' + roomsId),
      sidebar: $('#' + sidebarId),
    };
    
    this.rooms = {}; // holds the Room object
    
    this.activeChat = null;
  },
  
  addIfNotExists: function(room) {
    var self = this;
    room = roomverse.normalizeName(room);
    
    if (!this.rooms.hasOwnProperty(room)) {
      // ****** Create the room UI
      this.rooms[room] = new Room(this, { room: room });
      
      // ****** Then load the modules (so they can do stuff with the UI)
      modules.loadForRoom(room, function(room) {
        // And allow the modules to load at a proper time
        action.emit('rooms-add', room);
        
        // If no chat was active, let's activate the first
        if (!self.activeChat) {
          self.dom.rooms.removeClass("wait");
          self.setActive(room);
        }
      });
    }
  },
  
  remove: function(room) {
    if (this.rooms.hasOwnProperty(room)) {
      delete this.rooms[room];
      action.emit('rooms-remove', room); 
    }
  },
  
  setActive: function(room) {
    //
    // Set the active room
    //
    
    // Remove focus
    this.rooms[room].blur();
    
    // Focus
    this.rooms[room].focus();
    this.activeChat = room;
  }
}