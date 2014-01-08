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
    this.socket = io.connect('', { 'sync disconnect on unload': true });
    this.userid = config.userid;
    
    // ****** Backend is present, initialize
    if (this.socket) {
      this.bindAllDOM();
      this.bindAllSocket();
    }
    
    // ****** Let's go with the first round of modules!
    modules.loadOnReady(function loadOnReadyCallback() {
      action.emit('ready');
    }.bind(this));
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
    //
    // Set all the IRC client events.
    //
    for (var eventName in this.listenersForServer) {
      this.socket.on(eventName, this.listenersForServer[eventName].bind(this));
    }
  },
  
  /**************************************************************************************************** Listeners for IRC */
  // This dictionary contains all the listeners for the pipe emitted events
  listenersForServer: {
    
    'message': function(packet) {
      console.log("-> " + packet.text);
      this.roomEcho(packet.room, packet.userid, packet.text);
    },
    
    'users-join': function(roomAndUsers) {
      //console.log(channelAndUsers);
      $("." + roomAndUsers.room + ".wb-chat-users").text(roomAndUsers.length);
    }
    
  },
  

  /**************************************************************************************************** Actions */
  send: function(room, text) {
    if (text) {
      console.log("<- " + text);
      this.socket.emit("message", { room: room, userid: this.userid, text: text });
      this.roomEcho(room, "you", text);
    }
  },


  /**************************************************************************************************** DOM */
  roomEcho: function(room, userid, text) {
    this.rooms.addIfNotExists(room);
    
    // ****** Write text to room
    text = this.sanitizeHTML(text); // this could be an action, but in this specific case I want to be sure
    text = action.emit('room-echo-' + room, text);
    this.rooms.chats[room].appendItem(userid, text);
    
    // ****** Write notification number if not active
    if (this.rooms.activeChat != room) {
      this.rooms.chats[room].notify(1);
    }
  },
  
  /**************************************************************************************************** Other */
  sanitizeHTML: function(string) {
    return string.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
    room = room.toLowerCase();
    
    if (!this.chats.hasOwnProperty(room)) {
      // ****** Create the room UI
      this.chats[room] = new Room(this, { room: room });
      
      // ****** Then load the modules (so they can do stuff with the UI)
      modules.loadForRoom(room, function(room) {
        // And allow the modules to load at a proper time
        action.emit('rooms-add', room);
        
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
    log: '<div class="wb-chat <%= room %>"> <h2><%= room %><span class="wb-chat-users"></span></h2> <ul class="chat-log"></ul> <div class="chat-messagebox"><input class="wb-messagebox" data-room="<%= room %>" type="text" /></div> </div>',
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
    // Reset notifications
    this.notify(0);
    
    // Bring the UI elements up
    this.dom.listItem.addClass("active");
    this.dom.self.addClass("active");
    
    // Focus on messagebox too
    this.dom.self.find('.wb-messagebox').focus();
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
  
  onMany: function(obj, parent) {
    for (var actionid in obj) {
      this.on(obj[actionid].bind(parent));
    }
  },
  
  once: function(actionid, fx) {
    var self = this; // because bind() makes the function un-off-able (it's wrapped)
    this.on(actionid, function onceCallback() {
      self.off(actionid, onceCallback);
      fx.apply(this, arguments);
    });
  },
  
  has: function(actionid) {
    if (this.actions.hasOwnProperty(actionid) && this.actions[actionid].length > 0) return this.actions[actionid].length;
    else return false;
  },
  
  emit: function(actionid, data) {
    if (this.has(actionid)) {
      var fxs = this.actions[actionid].slice(0); // mid-emit changes won't affect result for this emit
      for (var fxidx in fxs) {
        ret = fxs[fxidx](data);
        if (ret !== undefined) data = ret; // if action isn't a filter (no return) ensures preservation
      }
    }
    
    return data;
  },
  
  off: function(actionid, fx) {
    if (actionid === undefined) {
      // ****** Remove everything
      this.actions = {};
    } else if (fx === undefined) {
      // ****** Remove all from action
      if (this.has(actionid)) {
        delete this.actions[actionid];
      }
    } else {
      // ****** Remove specific function from action
      if (this.has(actionid)) {
        this.actions[actionid].splice(this.actions[actionid].indexOf(fx), 1); // find the function and cut it out
        if (this.actions[actionid].length === 0) delete this.actions[actionid];
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
  globalModules: [
    'ParseUrl',
    'UserMetaTimezone',
    'Test'
  ],
  
  moduleBeingLoaded: {},
  
  loadOnReady: function(fx) {
    //
    // Load the first batch of modules.
    // These are the ones that can run at the very beginning before any room is loaded
    //
    this.loadModules(this.globalModules, function loadOnReadyCallback() {
      fx();
    }.bind(this));
  },
  
  loadForRoom: function(room, fx) {
    //
    // Loads all the modules required by this room
    // Launches the callback fx() when all the modules are loaded
    //
    
    //TODO: load list of room-specific modules
    var roomModules = this.globalModules; // let's reuse the global ones for now
    
    // Load
    this.loadModules(roomModules, function loadForRoomCallback() {
      fx(room);
    }.bind(this));
  },
  
  loadModules: function(list, fx) {
    //
    // Loads all the modules in the list
    //
    var readyCountBack = list.length;
    
    for (var i in list) {
      this.loadModule(list[i], function(moduleName) {
        // All modules loaded, let's go ahead!
        if (--readyCountBack === 0) {
          // Room modules are ready to run, callback
          fx();
        }
      }.bind(this));
    }
  },
  
  loadModule: function(name, fx, force) {
    //
    // Load a module if it hasn't been loaded before.
    //
    force = force || false; // force load
    var url = this.path + name + ".js";
    
    if (module.hasOwnProperty(name) && !force)  {
      // ****** Already loaded
      // Just callback
      fx(name);
    } else if (this.moduleBeingLoaded.hasOwnProperty(name)) {
      // ****** In loading queue
      // Delay callback until module is loaded
      this.moduleBeingLoaded[name].push(fx);
    } else {
      // ****** Requires loading
      // Create the module immediately in the class, so the system knows it's being loaded
      this.moduleBeingLoaded[name] = new Array();
      
      // If the module hasn't been loaded yet, load it
      jQuery.getScript(url)
        .done(function(script, textStatus) {
          // Success! Initialize module
          module[name]();
          
          // Callback this and all the queued ones
          fx(name);
          for (var i in this.moduleBeingLoaded[name]) {
            // Call initialization queue
            this.moduleBeingLoaded[name][i](name);
          }
          delete this.moduleBeingLoaded[name];
        }.bind(this))
        .fail(function(jqxhr, settings, exception) {
          // This includes both load errors and parse errors
          if ('parsererror' == settings) {
            console.log('Error parsing: "' + url + '".');
          } else {
            console.log('Unable to load module: "' + url + '" (' + settings + ', ' + jqxhr.statusText + ').');
            console.log(jqxhr);
          }
        }.bind(this));      
    }
  }
}

