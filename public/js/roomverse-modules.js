/*
 * Modules
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
 *   modules.loadOnReady(callback); // pre-load all the global modules
 *   modules.loadForRoom('room', callback); // load all the modules for a room
 *
 */


var module = {}; // will contain modules list, it's outside to simplify module syntax
var modules = {
  
  rooms: {},
  path: '/modules/',
  globalModules: [
    'ParseUrl',
    'UserMetaTimezone',
    'Test',
    'Alpha'
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
    var url = this.path + name + '/' + name + '.js';
    
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