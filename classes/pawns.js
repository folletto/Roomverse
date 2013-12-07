/*
 * Pawns Collection Manager
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
 * This class manages the various pawns launched by the app.
 * 
 */

// Let the children come to me.
var pawn = require('./pawn');
 
var Pawns = module.exports.Pawns = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Pawns.prototype = {
  
  reconnectTimeout: 10000, // in milliseconds
  
  init: function(config) {
    //
    // Prepare the pawns manager
    //
    this.config = config;
    
    this.pawns = {};
    this.limbo = {};
  },
  
  new: function(id, configPawn, socket) {
    //
    // Creates a new pawn and associates it to the internal dictionary
    //
    if (this.limbo.hasOwnProperty(id)) {
      // Pawn in limbo, pick up again!
      this.pawns[id] = this.limbo[id];
      delete this.limbo[id];
      
      this.pawns[id].restore(this.config, configPawn, socket); // Restore (socket connection, ...)
      
    } else if (!this.pawns.hasOwnProperty(id)) {
      // New pawn, create
      this.pawns[id] = new pawn.Pawn(this.config, configPawn, socket);
      
    } else {
      // Whops. Pawn already there.
      // Return same connection. Wonder if it's the right thing to do... probably and error would be better?
    }
    
    return this.pawns[id];
  },
  
  destroyWithHope: function(id) {
    //
    // This functions removes the pawn but hopes the user is just refreshing, thus coming back shortly
    // It keeps the connection open for a few seconds
    //
    var self = this;
    
    if (this.pawns.hasOwnProperty(id)) {
      // Set in limbo
      this.limbo[id] = this.pawns[id];
      delete this.pawns[id];
      
      // Destruction timeout
      setTimeout(function() {
        if (self.limbo.hasOwnProperty(id)) {
          // Still in limbo? Sorry kid, destroying...
          self.destroy(id);
        }
      }, this.reconnectTimeout);
    }
  },
  
  destroy: function(id) {
    //
    // Removes a pawn
    //
    if (this.pawns.hasOwnProperty(id)) {
      this.pawns[id].destroy();
      delete this.pawns[id];
    }
  }
}