/*
 * Parse Module
 * This file is part of WordBridge.
 *
 ******************************************************************************************
 *
 * Modules are loaded once, just the first time.
 * Attach them to specific events using action.on();
 *
 */

module.parseUrl = function() {
  
  action.on('rooms-new', function(room) {
    
    action.on('room-echo-' + room, function(text) {
      
      // Via: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
      var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
      
      return text.replace(urlRegEx, '<a href="$1">$1</a>');
    });
    
  });
  
}