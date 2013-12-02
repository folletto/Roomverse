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
 *
 */
 
 $(document).ready(function() { wb.init(config); });

var wb = {

  socket: null,
  
  userid: "You",

  dom: {},
  
  chats: {},
  activeChat: null,

  /**************************************************************************************************** Init */
  init: function(config) {    
    this.socket = io.connect('http://localhost', { 'sync disconnect on unload': true });
    
    this.userid = config.userid;
    
    if (this.socket) {
      // If the backend wrapper class is there, initialize
      this.bindDOM();
      this.bindSocket();
    }
  },

  bindDOM: function(messageBoxId, chatsId, roomsId, widgetsId) {
    var self = this;
    chatsId = chatsId || "wb-chats";
    roomsId = roomsId || "wb-rooms";
    widgetsId = widgetsId || "wb-widgets";
    
    this.dom = {
      chats: $("#" + chatsId)
    }

    // ****** Bind send event to all future chat textfields
    this.dom.chats.on('keyup', 'input.wb-messagebox', function keyupEventSend() {
      if(event.keyCode == 13){
        var box = $(this);
        var room = box.data("room");
        
        self.send(room, box.val());
        box.val("");
      }
    });



  },

  bindSocket: function(socket) {
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
    this.dom.chats.removeClass("wait");
    
    if (!this.chats[room]) {
      this.chats[room] = new WBRoom(this.dom.chats, { room: room });
    }
    
    if (!this.activeChat) {
      // ****** First chat, set active
      this.chats[room].focus();
      this.activeChat = room;
    }
    
    this.chats[room].appendItem(userid, text);
  }
};


/**************************************************************************************************** UI: Chat */
var WBRoom = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
WBRoom.prototype = {
  
  template: {
    roomList: '<li class="<%= room %>"><%= room %></li>',
    log: '<div class="wb-chat <%= room %>"> <h2><%= room %></h2> <ul class="chat-log"></ul> <div class="chat-messagebox"><input class="wb-messagebox" data-room="<%= room %>" type="text" /></div> </div>',
    logItem: '<li><span class="wb-message-nick"><%= userid %></span> <span class="wb-message-text"><%= text %></message></li>'
  },
  
  init: function(parent, data) {
    //
    // Create DOM elements.
    //
    
    // ****** Create instance variables
    this.dom = {
      self: null,
      parent: null,
      listItem: null
    };
    
    // ****** Initialize room list
    var roomList = $("#wb-room-list");
    roomList.append(_.template(this.template.roomList, data));
    this.dom.listItem = roomList.children('li.' + data.room);
    
    console.log(this);
    console.log(this.dom.listItem);
    
    this.dom.listItem.click(this.clickListItem.bind(this));
    
    // ****** Initialize chat log
    this.dom.parent = _.isString(parent) ? $(parent) : parent; // let's get the jQuery object
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
    var boolWasScrolled = ((this.dom.self.children('.chat-log').scrollTop() + this.dom.self.children('.chat-log').height()) >= this.dom.self.children('.chat-log').prop('scrollHeight'));
    
    // ****** Append
    this.dom.self.children('.chat-log').append(_.template(this.template.logItem, data));
    
    // ****** Scroll to bottom if the chat wasn't scrolled up manually
    if (boolWasScrolled) {
      this.dom.self.children('.chat-log').scrollTop(this.dom.self.children('.chat-log').prop('scrollHeight'));
    }
  },
  
  /**************************************************************************************************** Events */
  clickListItem: function() {
    
    // Reset
    this.dom.listItem.parent().children('li').removeClass('active');
    this.dom.parent.children('.wb-chat').removeClass('active');
    
    // Activate
    this.focus();
    
  },
  
  /**************************************************************************************************** Other */
  focus: function() {
    this.dom.listItem.addClass("active");
    this.dom.self.addClass("active");
  }
}



