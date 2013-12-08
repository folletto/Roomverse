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

module.Test = function() {
  
  action.on('ready', function() {
    console.log('[TestModule] Ready.');
  });
  
  action.on('rooms-add', function(room) {
    console.log('[TestModule] ' + room + ' is on!');
  });
  
}

