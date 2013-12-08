/*
 * Timezone Module
 * This file is part of WordBridge.
 *
 ******************************************************************************************
 *
 * Modules are loaded once, just the first time.
 * Attach them to specific events using action.on();
 *
 */
 
module.UserMetaTimezone = function() {
  
  action.on('ready', function() {
    var timezoneOffset = -1 * ((new Date()).getTimezoneOffset() / 60);
    if (timezoneOffset >= 0) timezoneOffset = '+' + timezoneOffset;
    
    var metaTimezone = 'UTC' + timezoneOffset;
    
    $('#user .meta').html(metaTimezone);
  });
  
 }