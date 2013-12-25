/*
 * Emitter Mixin
 * Extends any object with emitter (emit/on) functionalities.
 *
 * Copyright (C) 2013 Davide 'Folletto' Casali <folletto AT gmail DOT com>
 * BSD licensed.
 *
 ******************************************************************************************
 *
 * Usage: 
 *
 *   Emitter(obj);
 *
 *   Creates a mixin with obj, that after the call behaves like an emitter.
 *
 * Examples:
 *
 *   Emitter(myObject); // Transforms a single object
 *   Emitter(MyClass.prototype); // Transforms a prototype for all future usages
 * 
 */


/**************************************************************************************************** Mixer */
var Emitter = function (obj) {
  
  // Roughly avoid bad stuff happening
  if (obj && !obj.hasOwnProperty('on')) {
    // Mixin
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
  }
  
  return obj;
}
module.exports = Emitter;


/**************************************************************************************************** Emitter */
Emitter.prototype = {
  
  on: function(event, fx) {
    //
    // Associates a callback to an event
    //
    this._callbacks = this._callbacks || {}; // Safeguard
    
    if (!this._callbacks.hasOwnProperty(event)) this._callbacks[event] = new Array();
    
    this._callbacks[event].push(fx);
  },
  
  onMany: function(obj, parent) {
    //
    // Uses a dictionary to associate multiple event callbacks at once, with correct binding
    //
    for (var event in obj) {
      this.on(obj[event].bind(parent));
    }
  },
  
  once: function(event, fx) {
    //
    // Execute a specific callback only once for that event
    //
    this._callbacks = this._callbacks || {}; // Safeguard
    
    var self = this; // because bind() makes the function un-off-able (it's wrapped)
    this.on(event, function onceCallback() {
      self.off(event, onceCallback);
      fx.apply(this, arguments);
    });
  },
  
  has: function(event) {
    //
    // Checks if an event has callbacks
    //
    this._callbacks = this._callbacks || {}; // Safeguard
    
    if (this._callbacks.hasOwnProperty(event) && this._callbacks[event].length > 0) return this._callbacks[event].length;
    else return false;
  },
  
  emit: function(event, data) {
    //
    // Emit an event
    // Works also as a synchronous filter: if the called function returns modified data, 
    // it will be piped into the next function, thus creating a chain.
    //
    this._callbacks = this._callbacks || {}; // Safeguard
    
    if (this.has(event)) {
      var fxs = this._callbacks[event].slice(0); // mid-emit changes won't affect result for this emit
      for (var fxidx in fxs) {
        ret = fxs[fxidx](data);
        if (ret !== undefined) data = ret; // if action isn't a filter (no return) ensures preservation
      }
    }
    
    return data;
  },
  
  off: function(event, fx) {
    //
    // Remove listeners.
    // Works at three levels: 1/ remove everything 2/ remove all from event 3/ remove function from event
    //
    this._callbacks = this._callbacks || {}; // Safeguard
    
    if (event === undefined) {
      // ****** Remove everything
      this._callbacks = {};
    } else if (fx === undefined) {
      // ****** Remove all from event
      if (this.has(event)) {
        delete this._callbacks[event];
      }
    } else {
      // ****** Remove specific function from event
      if (this.has(event)) {
        this._callbacks[event].splice(this._callbacks[event].indexOf(fx), 1); // find the function and cut it out
        if (this._callbacks[event].length === 0) delete this._callbacks[event];
      }
    }
  }
}