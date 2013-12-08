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
 
module.userMetaTimezone = function() {
  
  action.on('ready', function() {
    var timezoneOffset = (new Date()).getTimezoneOffset() / 60;
    if (timezoneOffset == 0) timezoneOffset = '+0';
    
    var metaTimezone = 'UTC' + timezoneOffset;
    
    $('#user .meta').html(metaTimezone);
  });
  
 }