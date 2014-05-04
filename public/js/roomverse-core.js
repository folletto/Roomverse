/*
 * Main client library
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
 * Requires
 *   Socket.io
 *   jQuery
 *   Backbone
 *
 */
 
 $(document).ready(function() { roomverse.init(config); });

var roomverse = {

  socket: null,
  userid: "You",
  rooms: null,

  /**************************************************************************************************** Init */
  init: function(config) {    
    this.socket = io.connect('', { 'sync disconnect on unload': true });
    this.userid = config.userid;
    
    // ****** Backend is present, initialize
    if (this.socket) {
      this.socket.on('connect', function messageConnected() {
        $('#status-message').text('');
      });
      this.socket.on('disconnect', function messageDisconnected() {
        $('#status-message').text('It seems the server stopped responding. Reload maybe?');
      });
      
      this.bindAllDOM();
      this.bindAllSocket();
      db.listen(this.socket);
    }
    
    // ****** Let's go with the first round of modules!
    modules.loadOnReady(function loadOnReadyCallback() {
      action.emit('ready');
    }.bind(this));
  },

  bindAllDOM: function(roomListId, roomsId, sidebarId) {
    //
    // Binds the various events to the DOM.
    //
    var self = this;
    roomListId = roomListId || "rv-room-list";
    roomsId = roomsId || "rv-chats";
    sidebarId = sidebarId || "rv-sidebar";
    
    this.rooms = new Rooms(roomListId, roomsId, sidebarId);
    
    // ****** Bind send event to all future chat textfields
    this.rooms.dom.rooms.on('keyup', 'input.rv-messagebox', function keyupEventSend() {
      if(event.keyCode == 13){
        var box = $(this);
        var room = box.data("room");
        
        self.send(room, box.val());
        box.val("");
      }
    });
  },
  
  bindAllSocket: function(socket) {    
    //
    // Set all the IRC client events.
    //
    for (var eventName in this.listenersForServer) {
      this.socket.on(eventName, this.listenersForServer[eventName].bind(this));
    }
  },
  
  /**************************************************************************************************** Listeners for IRC */
  // This dictionary contains all the listeners for the socket emitted events
  listenersForServer: {
    
    'message': function(packet) {
      packet.room = roomverse.normalizeName(packet.room);
      console.log('-> [' + packet.room + '] ' + packet.userid + ': ' + packet.text);
      this.roomEcho(packet.room, packet.userid, packet.text);
    },
    
    'room-join': function(room) {
      room = roomverse.normalizeName(room);
      this.rooms.addIfNotExists(room);
    },
    
    'users-join': function(roomAndUsers) {
      roomAndUsers.room = roomverse.normalizeName(roomAndUsers.room);
      
      if (this.rooms.rooms[roomAndUsers.room]) {
        // Avoid errors on room creation
        this.rooms.rooms[roomAndUsers.room].users.join(roomAndUsers.users);
      }
    },
    
    'users-part': function(roomAndUsers) {
      roomAndUsers.room = roomverse.normalizeName(roomAndUsers.room);
      this.rooms.rooms[roomAndUsers.room].users.part(roomAndUsers.users);
    },
    
  },
  

  /**************************************************************************************************** Actions */
  send: function(room, text) {
    if (text) {
      console.log('<- [' + room + '] ' + this.userid + ': ' + text);
      this.socket.emit("message", { room: room, userid: this.userid, text: text });
      this.roomEcho(room, this.userid, text);
    }
  },


  /**************************************************************************************************** DOM */
  roomEcho: function(room, userid, text) {
    this.rooms.addIfNotExists(room);
    
    // ****** Write text to room
    text = this.sanitizeHTML(text); // this could be an action, but in this specific case I want to be sure
    text = action.emit('room-echo-' + room, text);
    this.rooms.rooms[room].appendItem(userid, text);
    
    // ****** Write notification number if not active
    if (this.rooms.activeChat != room) {
      this.rooms.rooms[room].notify(1);
      this.globalNotificationUpdate();
    }
  },
  
  /**************************************************************************************************** Notifications */
  globalNotificationUpdate: function() {
    // 
    // Global notifications.
    // It's a bit dirty.
    //
    var total = 0;
    for (var room in this.rooms.rooms) {
      total = total + this.rooms.rooms[room].notifications;
    }
    
    if (total > 0) this.faviconUpdate('/assets/favicon-notify.png');
    else this.faviconUpdate('/assets/favicon-default.png');
  },
  
  faviconUpdate: function(src) {
    //
    // Support function to change the favicon on the fly.
    //
    document.head || (document.head = document.getElementsByTagName('head')[0]);
    
    var link = document.createElement('link');
    var oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    
    if (oldLink) document.head.removeChild(oldLink);
    document.head.appendChild(link);
  },
  
  /**************************************************************************************************** Other */
  sanitizeHTML: function(string) {
    return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  
  normalizeName: function(string) {
    //
    // Normalize the name in order to avoid chats not found for difference in capitalization
    //
    return string.toLowerCase();
  },
  
  isRoom: function(name) {
    //
    // True if the passed argument is a room, false if it's a user
    //
    return (name[0] != "@") ? true : false;
  }
};

