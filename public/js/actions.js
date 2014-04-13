/*
 * Actions
 * Centralized manager of actions emit/on.
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
 *   action.emit('action-name', parameters);
 *   action.on('action-name', function() { ... });
 *   action.onMany(actionsAndFunctions, functionsBinding);
 *   action.once('action-name', function() { ... });
 *   action.has('action-name');
 *   action.off('action-name', function); // can accept zero or more parameters
 *
 */


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
