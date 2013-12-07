/*
 * Client Library
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
 * Requires
 *   Socket.io
 *   jQuery
 *   Backbone
 *
 */
 
 $(document).ready(function() { wb.init(config); });

var wb = {

  socket: null,
  userid: "You",
  rooms: null,

  /**************************************************************************************************** Init */
  init: function(config) {    
    this.socket = io.connect('http://localhost', { 'sync disconnect on unload': true });
    this.userid = config.userid;
    
    if (this.socket) {
      // If the backend wrapper class is there, initialize
      this.bindAllDOM();
      this.bindAllSocket();
    }
    
    action.emit('ready');
  },

  bindAllDOM: function(roomListId, chatsId, widgetsId) {
    //
    // Binds the various events to the DOM.
    //
    var self = this;
    roomListId = roomListId || "wb-room-list";
    chatsId = chatsId || "wb-chats";
    widgetsId = widgetsId || "wb-widgets";
    
    this.rooms = new Rooms(roomListId, chatsId, widgetsId);
    
    // ****** Bind send event to all future chat textfields
    this.rooms.dom.chats.on('keyup', 'input.wb-messagebox', function keyupEventSend() {
      if(event.keyCode == 13){
        var box = $(this);
        var room = box.data("room");
        
        self.send(room, box.val());
        box.val("");
      }
    });
  },
  
  bindAllSocket: function(socket) {
    this.socket.on("bridge", this.bridgeReceive.bind(this));
    this.socket.on("message", this.messageReceive.bind(this));
  },
  
  /****** Bridge */
  bridgeReceive: function(packet) {
    console.log(packet);
  },
  
  bridgeSend: function(text) {
    wb.socket.emit("bridge", { room: "", userid: "", text: text });
  },
  
  /****** Message */
  messageReceive: function(packet) {
    wb.receive(packet.room, packet.userid, packet.text, packet);
  },

  messageSend: function(room, text) {
    wb.socket.emit("message", { room: room, userid: this.userid, text: text });
  },


  /**************************************************************************************************** Actions */
  send: function(room, text) {
    if (text) {
      console.log("<- " + text);
      this.messageSend(room, text);
      this.roomEcho(room, "you", text);
    }
  },

  receive: function(room, userid, text, packet) {
    console.log("-> " + text);
    this.roomEcho(room, userid, text);
  },


  /**************************************************************************************************** DOM */
  roomEcho: function(room, userid, text) {
    this.rooms.addIfNotExists(room);
    
    // ****** Write text to room
    text = action.emit('room-echo-' + room, text);
    this.rooms.chats[room].appendItem(userid, text);
    
    // ****** Write notification number if not active
    if (this.rooms.activeChat != room) {
      this.rooms.chats[room].notify(1);
    }
  }
};


/**************************************************************************************************** UI: Room Manager */
var Rooms = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Rooms.prototype = {
  
  init: function(roomListId, chatsId) {
    //
    // Prepare the rooms manager.
    //
    
    // ****** Init instance variables
    this.dom = {
      list: $('#' + roomListId),
      chats: $('#' + chatsId),
    };
    
    this.chats = {}; // holds the Room object
    
    this.activeChat = null;
  },
  
  addIfNotExists: function(room) {
    var self = this;
    
    if (!this.chats.hasOwnProperty(room)) {
      // ****** Create the room UI
      this.chats[room] = new Room(this, { room: room });
      
      // ****** Then load the modules (so they can do stuff with the UI)
      modules.loadForRoom(room, function(room) {
        // And allow the modules to load at a proper time
        action.emit('rooms-new', room);
        
        // If no chat was active, let's activate the first
        if (!self.activeChat) {
          self.dom.chats.removeClass("wait");
          self.setActive(room);
        }
      });
    }
  },
  
  remove: function(room) {
    if (this.chats.hasOwnProperty(room)) {
      delete this.chats[room];
      action.emit('rooms-remove', room); 
    }
  },
  
  setActive: function(room) {
    this.chats[room].focus();
    this.activeChat = room;
  }
}

/**************************************************************************************************** UI: Room */
var Room = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Room.prototype = {
  
  template: {
    roomList: '<li class="<%= room %>"><%= room %><span class="notifications"></span></li>',
    log: '<div class="wb-chat <%= room %>"> <h2><%= room %></h2> <ul class="chat-log"></ul> <div class="chat-messagebox"><input class="wb-messagebox" data-room="<%= room %>" type="text" /></div> </div>',
    logItem: '<li><span class="wb-message-nick"><%= userid %></span> <span class="wb-message-text"><%= text %></message></li>'
  },
  
  init: function(rooms, data) {
    //
    // Create DOM elements.
    //
    
    // ****** Init instance variables
    this.dom = {
      self: null,
      parent: null,
      listItem: null
    };
    this.roomName = data.room;
    this.rooms = rooms;
    this.notifications = 0;
    
    // ****** Initialize room list
    this.rooms.dom.list.append(_.template(this.template.roomList, data));
    this.dom.listItem = this.rooms.dom.list.children('li.' + data.room);
    
    this.dom.listItem.on('click', this.clickListItem.bind(this));
    
    // ****** Initialize chat log
    this.dom.parent = this.rooms.dom.chats;
    this.dom.parent.append(_.template(this.template.log, data)); 
    
    this.dom.self = this.dom.parent.children('.wb-chat.' + data.room); // and again let's store the jQuery object
  },
  
  
  /**************************************************************************************************** DOM */
  appendItem: function(userid, text) {
    //
    // Appends a new chat log item to the DOM element.
    //
    var data = {
      'userid': userid,
      'text': text
    }
    
    // ****** Was this scrolled?
    var SCROLL_TOLERANCE_OFFSET = 10;
    var boolWasScrolled = ((this.dom.self.children('.chat-log').scrollTop() + this.dom.self.children('.chat-log').height()) >= this.dom.self.children('.chat-log').prop('scrollHeight') - SCROLL_TOLERANCE_OFFSET);
    
    // ****** Append
    this.dom.self.children('.chat-log').append(_.template(this.template.logItem, data));
    
    // ****** Scroll to bottom if the chat wasn't scrolled up manually
    if (boolWasScrolled) {
      this.dom.self.children('.chat-log').scrollTop(this.dom.self.children('.chat-log').prop('scrollHeight'));
    }
  },
  
  notify: function(increment) {
    if (increment > 0) {
      console.log(this.notifications);
      // Increment of the specified amount
      this.notifications = this.notifications + increment;
      this.dom.listItem.children(".notifications").html(this.notifications);
    } else {
      // No increment, clear
      this.notifications = 0;
      this.dom.listItem.children(".notifications").html("");
    }
  },
  
  /**************************************************************************************************** Events */
  clickListItem: function() {
    
    // Reset
    this.dom.listItem.parent().children('li.active').removeClass('active');
    this.dom.parent.children('.wb-chat.active').removeClass('active');
    
    // Activate
    this.rooms.setActive(this.roomName);
  },
  
  /**************************************************************************************************** Other */
  focus: function() {
    this.notify(0);
    this.dom.listItem.addClass("active");
    this.dom.self.addClass("active");
  }
}


/**************************************************************************************************** Actions Engine */
// Action doesn't require init and is self contained.
var action = {
  
  actions: {},
  
  on: function(actionid, fx) {
    if (!this.actions.hasOwnProperty(actionid)) this.actions[actionid] = new Array();
    
    this.actions[actionid].push(fx);
  },
  
  has: function(actionid) {
    if (this.actions.hasOwnProperty(actionid) && this.actions[actionid].length > 0) return this.actions[actionid].length;
    else return false;
  },
  
  emit: function(actionid, data) {
    if (this.has(actionid)) {
      for (var fxidx in this.actions[actionid]) {
        newData = this.actions[actionid][fxidx](data);
        if (newData !== undefined) data = newData; // if action isn't a filter (no return) ensures preservation
      }
    }
    
    return data;
  },
  
  removeListener: function(actionid, fx) {
    if (this.has(actionid)) {
      for (var fxidx in this.actions[actionid]) {
        this.actions[actionid].splice(fxidx, 1);
      }
      if (this.actions[actionid].length === 0) delete this.actions[actionid];
    }
  },
  
  removeAllListeners: function(actionid) {
    if (actionid === undefined) {
      // Remove all
      this.actions = {};
    } else {
      // Remove all from specified actionid
      if (this.has(actionid)) {
        delete this.actions[actionid];
      }
    }
  }
}

/**************************************************************************************************** Modules Engine */
// Module doesn't require init and is self contained.
var module = {}; // will contain modules list, it's outside to simplify module syntax
var modules = {
  
  rooms: {},
  path: '/modules/',
  
  loadForRoom: function(room, fx) {
    //
    // Loads all the modules required by this room
    // Launches the callback fx() when all the modules are loaded
    //
    
    // Modules always loaded
    var globalModules = [
      'parseUrl',
      'test'
    ];
    
    var readyCountBack = globalModules.length;
    for (var i in globalModules) {
      this.loadModule(globalModules[i], function(moduleName, needsInit) {
        // Loaded for the first time. Initialize it.
        if (needsInit) module[moduleName]();
        
        // When all modules are loaded, callback ready!
        if (--readyCountBack === 0) fx(room);
      });
    }
  },
  
  loadModule: function(name, fx, force) {
    //
    // Load a module if it hasn't been loaded before.
    //
    
    force = force || false; // force load
    var url = this.path + name + ".js";
    
    if (module.hasOwnProperty(name) && !force)  {
      // Already loaded, just callback with false saying it was cached
      fx(name, false);
    } else {
      // If the module hasn't been loaded yet, load it  
      jQuery.getScript(url)
        .done(function(script, textStatus) {
          // Success! Callback with boolean true saying it was loaded.
          fx(name, true);
        })
        .fail(function(jqxhr, settings, exception) {
          // This includes both load errors and parse errors
          if ('parsererror' == settings) {
            console.log('Error parsing: "' + url + '".');
          } else {
            console.log('Unable to load module: "' + url + '" (' + settings + ', ' + jqxhr.statusText + ').');
            console.log(jqxhr);
          }
        });      
    }
  }
}

