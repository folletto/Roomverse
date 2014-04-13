/*
 * Widget
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
 * USAGE
 *
 * Just include the file and its methods can be accessed with the following syntax:
 *
 *   var w = new Widget(room, 'id', 'Title', 'html body');
 *
 */



/**************************************************************************************************** UI: Widget */
var Widget = function() { this.init.apply(this, arguments); } // Prototype-like Constructor
Widget.prototype = {
  
  template: {
    widget: '<aside class="widget <%= cssclass %>"><h1><%= title %></h1><%= content %></aside>'
  },
  
  init: function(room, cssclass, title, startContent) {
    //
    // This class provides the API for the modules to use the widgets
    // Yoinks this is awful code. But it's just to get the ball rolling.
    //
    
    this.room = room;
    this.cssclass = cssclass;
    this.title = title;
    this.content = startContent;
    
    this.update();
  },
  
  update: function() {
    //
    // Updates the widget with the available data
    //
    
    // Create template data
    var data = {
      cssclass: this.cssclass,
      title: this.title,
      content: this.content
    }
    
    // Make and append
    roomverse.rooms.rooms[this.room].dom.widgets.append(_.template(this.template.widget, data));
  }
}
