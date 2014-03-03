/*
 * Alpha Release Notification Module
 * This file is part of Roomverse.
 *
 ******************************************************************************************
 *
 * Modules are loaded once, just the first time.
 * Attach them to specific events using action.on();
 *
 */

module.Alpha = function() {
  
  action.on('rooms-add', function(room) {
    var w = new Widget(room, 'alpha', 'Alpha Release', 
      '<p>This version is an alpha release, it\'s missing critical features. Please refer to GitHub for the current status.</p>' +
      '<p>This widget is loaded for: <br/><strong>' + room + '</strong></p>'
    );
    
  });
  
}