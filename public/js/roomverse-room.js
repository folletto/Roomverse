/*
 * Room
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
 * Manages one room.
 *
 */


var Room = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Room.prototype = {
  
  template: {
    roomList: '<li class="<%= id %>"><%= room %><span class="notifications"></span></li>',
    log: '<div class="rv-chat <%= id %>"> <div class="rv-chat-bar"><h2><%= room %></h2><span class="rv-chat-tray"></span></div> <ul class="chat-log"></ul> <div class="chat-messagebox"><input class="rv-messagebox" data-room="<%= room %>" type="text" /></div> </div>',
    logItem: '<li class="<%= type %>"><span class="rv-message-nick"><%= userid %></span> <span class="rv-message-text"><%= text %></message></li>',
    widgets: '<div class="rv-widgets <%= id %>"></div>'
  },
  
  init: function(rooms, data) {
    //
    // Create DOM elements.
    //
    
    // ****** Enrich data dictionary
    data.id = this.classidify(data.room);
    
    // ****** Init instance variables
    this.dom = {
      self: null,
      parent: null,
      listItem: null,
      widgets: null,
    };
    this.roomName = data.room;
    this.roomId = data.id;
    this.rooms = rooms;
    this.notifications = 0;
    this.users = null;
    
    // ****** Initialize room list
    this.rooms.dom.list.append(_.template(this.template.roomList, data));
    this.dom.listItem = this.rooms.dom.list.children('li.' + this.roomId);
    
    this.dom.listItem.on('click', this.clickListItem.bind(this));
    
    // ****** Initialize room log
    this.dom.parent = this.rooms.dom.rooms;
    this.dom.parent.append(_.template(this.template.log, data)); 
    
    // ****** Initialize room widgets
    this.rooms.dom.sidebar.append(_.template(this.template.widgets, data));
    
    // ****** Hook users
    this.users = new RoomUsers(this, data);
    
    // ****** And again let's store the jQuery object
    this.dom.self = this.dom.parent.children('.rv-chat.' + this.roomId); 
    this.dom.widgets = this.rooms.dom.sidebar.children('.rv-widgets.' + this.roomId);
  },
  
  
  /**************************************************************************************************** DOM */
  appendItem: function(userid, text) {
    //
    // Appends a new chat log item to the DOM element.
    //
    var data = {
      'type': (roomverse.userid == userid ? 'you' : 'other'),
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
    //this.dom.listItem.parent().children('li.active').removeClass('active');
    //this.dom.parent.children('.rv-chat.active').removeClass('active');
    //this.dom.widgets.parent().children('.rv-widgets.active').removeClass('active');
    
    // Activate
    this.rooms.setActive(this.roomName);
  },
  
  /**************************************************************************************************** Focus */
  focus: function() {
    //
    // Bring room to foreground
    //
    
    // Reset notifications
    this.notify(0);
    roomverse.globalNotificationUpdate();
    
    // Bring the UI elements up
    this.dom.listItem.addClass("active");
    this.dom.self.addClass("active");
    this.dom.widgets.addClass("active");
    
    // Focus on messagebox too
    this.dom.self.find('.rv-messagebox').focus();
  },
  
  blur: function() {
    //
    // Remove room focus
    //
    
    // This actually removes focus from every room, should probably do it just for this one?
    this.dom.listItem.parent().children('li.active').removeClass('active');
    this.dom.parent.children('.rv-chat.active').removeClass('active');
    this.dom.widgets.parent().children('.rv-widgets.active').removeClass('active');
  },
  
  /**************************************************************************************************** Other */
  classidify: function(name) {
    //
    // Get a name string and obtain a nice CSS-compatible class name
    //
    return name.replace(/[^a-z0-9]/g, function(s) {
        var c = s.charCodeAt(0);
        if (c == 32) return '-';
        if (c == 46) return '-dot-';
        if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
        return '__' + ('000' + c.toString(16)).slice(-4);
    });
  }
}
