/*
 * Test Module
 * This file is part of WordBridge.
 *
 ******************************************************************************************
 *
 * Modules are loaded once, just the first time.
 * Attach them to specific events using action.on();
 *
 */

module.test = function() {
  
  action.on('rooms-new', function(room) {
    console.log('I\'m ALIVE for ' + room);
  });
  
}

