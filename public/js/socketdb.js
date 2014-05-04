/*
 * SocketDB
 * Somewhat abstract layer for a LevelDB below.
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
 * USAGE
 *
 *   var db = <TODO> SocketDB(socket); // socket.io socket to use as communication channel
 *
 *   db('table', 'subtable', 'coff').put('key', 'value', function(err) { ... });
 *   db('table', 'subtable', 'coff').get('key', function(value) { ... });
 *   db('table', 'subtable', 'coff').del('key', function(err) { ... });
 *
 */




/******************************************************************************** DB Syntax Sugar */
var db = function() {
  /* 
   * Syntax sugar to do clean calls.
   */
  if (db.socket) {
    // ****** Return the remote DB accessor
    return new SocketDBTable(db.socket, Array.prototype.slice.call(arguments, 0)); // makes sure is Array
  } else {
    // ****** Set the Socket.io socket first
    console.log("Please connect a Socket.io socket to the db object first: db.listen(socket);");
    return;
  }
}

db.listen = function(socket) {
  /*
   * Attach the Socket.io object.
   */
  this.socket = socket;
}


/******************************************************************************** DB Table Accessor */
var SocketDBTable = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
SocketDBTable.prototype = {
  
  init: function(socket, table) {
    /*
     * Constructor.
     * Get the Socket.io object and the array of the virtual tables ['table', 'sub-table', ...].
     */
    this.socket = socket; // socket.io socket
    this.table = table; // this is an array
  },
  
  put: function(key, value, fx) {
    if (this.socket) {
      this.socket.emit('db', { op: 'put', table: this.table, key: key, value: value }, fx);
    } else {
      fx(false);
    }
  },
  
  get: function(key, fx) {
    if (this.socket) {
      this.socket.emit('db', { op: 'get', table: this.table, key: key }, fx);
    } else {
      fx(false);
    }
  },
  
  del: function(key, fx) {
    if (this.socket) {
      this.socket.emit('db', { op: 'del', table: this.table, key: key }, fx);
    } else {
      fx(false);
    }
  }
}

