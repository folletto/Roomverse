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
 * Manages the users and the UI for each room.
 *
 */


var RoomUsers = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
RoomUsers.prototype = {
  
  template: {
    trayBadge: '<span class="rv-chat-tray-users"><span class="rv-chat-tray-users-count"></span> <div class="rv-chat-users-list"></div></span>',
    notify: '<div class="rv-users-notify"><%= message %></div>',
    userItem: '<div class="rv-users-list-user" data-user="<%= user %>"><%= user %></div>',
  },
  
  init: function(room, data) {
    //
    // Create DOM elements.
    //
    
    // ****** Init instance variables
    this.roomName = data.room;
    this.roomId = data.id;
    this.users = [];
    this.dom = {
      tray: $('.rv-chat.' + this.roomId + ' .rv-chat-tray'),
      trayUsersCount: null,
    };
    
    // Add tray item
    if (roomverse.isRoom(this.roomName)) {
      this.dom.tray.html(_.template(this.template.trayBadge, {}));
      this.dom.trayUsersCount = this.dom.tray.find('.rv-chat-tray-users-count');
      
      // Bind
      this.bindAllDOM();
    }
  }, 
  
  join: function(users) {
    //
    // One or more users joined the room.
    //
    var dictUsers = this.toDictionary(users);
    
    // Merge the new users in, new one overwrites old.
    this.users = this.usersMerge(this.users, dictUsers);
    
    // Update UI
    this.trayUpdate(this.users);
    
    // Show a notification
    this.showNotify(users.join(', ') + ' joined');
  },
  
  part: function(users) {
    //
    // One or more users left the room.
    //
    var dictUsers = this.toDictionary(users);
    
    // Removes the departing users out.
    this.users = this.usersRemove(this.users, dictUsers);
    
    // Update UI
    this.trayUpdate(this.users);
    
    // Show a notification
    this.showNotify(users.join(', ') + ' parted');
  },
  
  trayUpdate: function(users) {
    //
    // Updates the tray UI
    //
    this.dom.trayUsersCount.text(this.dictLength(users) + ' users');
    
    var htmlList = "";
    for (var user in users) {
      htmlList += _.template(this.template.userItem, { user: user });
    }
    
    this.dom.trayUsersCount.parent().find('.rv-chat-users-list').html(htmlList);
  },
  
  showNotify: function(message) {
    //
    // Briefly shows a user-related message
    //
    
    // ****** Append
    this.dom.tray.parents('.rv-chat').append(_.template(this.template.notify, { 'message': message }));
    
    var NOTIFICATION_TIMEOUT = 2 * 1000;
    setTimeout(function() {
      var $notification = this.dom.tray.parents('.rv-chat').find('.rv-users-notify');
      $notification.fadeOut(300, function() {
        $notification.remove();
      });
    }.bind(this), NOTIFICATION_TIMEOUT)
  },
  
  bindAllDOM: function() {
    //
    // Bind events
    //
    
    // ****** Bind send event to all future user names
    this.dom.tray.on('click', '.rv-users-list-user', function userClickToChat() {
      // Open a new room with the user
      var roomForUser = roomverse.normalizeName($(this).data('user'));
      
      if (roomForUser != roomverse.normalizeName(roomverse.userid)) {
        roomForUser = '@' + roomForUser;
        roomverse.rooms.addIfNotExists(roomForUser);
        roomverse.rooms.setActive(roomForUser);
      }
    });
  },
  
  /********** Data manipulation */
  usersMerge: function(dict1, dict2, fx) {
    //
    // Merge two dictionaries{}.
    //
    var obj = dict1;
    
    for (var key in dict2) {
      if (dict2.hasOwnProperty(key)) {
        obj[key] = dict2[key];
        if (fx) fx(key, obj[key]); // callback
      }
    }
    
    return obj;
  },
  usersRemove: function(dictOriginal, dictRemove, fx) {
    //
    // Subtract two dictionaries{}.
    //
    var obj = dictOriginal;
    
    for (var key in dictRemove) {
      if (obj.hasOwnProperty(key) && dictRemove.hasOwnProperty(key)) {
        if (fx) fx(key, obj[key]); // callback
        delete obj[key];
      }
    }
    
    return obj;
  },
  toDictionary: function(a) {
    //
    // Converts an array[] to a dictionary{}
    //
    return a.reduce(function(obj, k) { obj[k] = {}; return obj; }, {});
  },
  dictLength: function(dict) {
    //
    // Length of the dictionary
    //
    var out = 0;
    for (var k in dict) {
      if (dict.hasOwnProperty(k)) {
         out++;
      }
    }
    return out;
  }
}
