/*
 * SocketDB, server side
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
 * This is the server interface for the mirror client library.
 *
 * Requires:
 *   LevelUp
 *   LevelDown
 * 
 * The client passes the following:
 *   this.socket.emit('db', { op: 'put', namespace: [], key: key, value: value });
 *   this.socket.emit('db', { op: 'get', namespace: [], key: key });
 *   this.socket.emit('db', { op: 'del', namespace: [], key: key });
 *
 */



/******************************************************************************** DB Syntax Sugar */
var db = module.exports = function() {
  /* 
   * Syntax sugar to do clean calls.
   */
  if (db.levelup) {
    // ****** Return the remote DB accessor
    return new LevelDBTable(db.levelup, Array.prototype.slice.call(arguments, 0)); // makes sure is Array
  } else {
    // ****** Set the Socket.io socket first
    console.log("Please connect a LevelUp object to the db first: db.levelup(levelup);");
    return;
  }
}

db.levelup = function(levelup) {
  /*
   * Attach the LevelUp object, using its API.
   */
  this.levelup = levelup;
}

db.getSocketListener = function(socket) {
  /*
   * Create and return a new listener object.
   */
  return new SocketDBListener(socket, this.db);
}


/******************************************************************************** DB Table Accessor */
var LevelDBTable = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
LevelDBTable.prototype = {
  
  init: function(levelup, table) {
    /*
     * Constructor.
     * Get the LevelUp object and the array of the virtual tables ['table', 'sub-table', ...].
     */
    this.levelup = levelup; // socket.io socket
    this.table = table; // this is an array
  },
  
  put: function(key, value, fx) {
    if (this.levelup) {
      //console.log("DB ())) put:", key, value);
      this.levelup.put(this.prefix(key), value, fx);
    } else {
      fx(false);
    }
  },
  
  get: function(key, fx) {
    if (this.levelup) {
      //console.log("DB ())) get:", key);
      this.levelup.get(this.prefix(key), fx);
    } else {
      fx(false);
    }
  },
  
  del: function(key, fx) {
    if (this.levelup) {
      //console.log("DB ())) del:", key);
      this.levelup.del(this.prefix(key), fx);
    } else {
      fx(false);
    }
  },
  
  prefix: function(string) {
    /*
     * Adds the prefix to the key to emulate tables
     */
    return this.table.join('.') + '.' + string;
  }
}



/******************************************************************************** DB Socket Listener */
// This is made to be created for each user connection, independent from the rest.
var SocketDBListener = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
SocketDBListener.prototype = {
  
  init: function(socket, db) {
    /*
     * Configure. 
     * Get the Socket.io object and the LevelDB database object.
     */
    
    // Init
    this.socket = socket;
    this.db = db;
    
    // Listen
    this.socket.on('db', this.onDatabase.bind(this));
  },
  
  onDatabase: function(data, fx) {
    /*
     * Answers to 'db' messages.
     */
    if (data.op === 'put') {
      // ****** PUT
      db(data.table).put(data.key, data.value, function(err, value) {
        if (fx) fx(value);
      }.bind(this));
      
    } else if (data.op === 'get') {
      // ****** GET
      db(data.table).get(data.key, function(err, value) {
        if (fx) fx(value); // Send data back
      }.bind(this));
      
    } else if (data.op === 'del') {
      // ****** DEL
      db(data.table).del(data.key, function(err, value) {
        if (fx) fx(value);
      }.bind(this));
    }
  }
}