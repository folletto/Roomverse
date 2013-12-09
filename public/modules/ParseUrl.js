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

module.ParseUrl = function() {
  
  action.on('rooms-add', function(room) {
    
    action.on('room-echo-' + room, function(text) {
      
      var out = text;
      
      // ****** URL Hyperlinking
      // Via: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
      //var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
      
      // Via: http://daringfireball.net/misc/2010/07/url-matching-regex-test-data.text
      //var urlRegEx = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g;
      
      // This is quite greedy, relies on whitespaces a lot
      var urlRegEx = /(?:\s|^)(https?:\/\/)?([^\s\/\?@]+\.[a-z]{2,4}\/?[^\s?]*\??[^\s]*)(?:\s|$)/gi
      out = out.replace(urlRegEx, replaceURL);
      
      return out;
    });
    
  });
  
  
  /**************************************************************************************************** Replace Fx */
  function replaceURL(match, p1, p2, offset, string) {
    //
    // Takes the regexp match as input and parses it
    //
    var out = '';
    
    var outText = p2;
    var outHref = p1 + p2;
    
    if (p1 === undefined) outHref = 'http://' + p2;
    
    if (match.match(/(.gif|.png|.jpg|.jpeg)\s?$/i)) {
      // Is image
      out = ' <a href="' + outHref + '" target="_blank"><img src="' + outHref + '" /></a> ';
    } else {
      // Is link
      out = ' <a href="' + outHref + '" target="_blank">' + outText + '</a> ';
    }
    
    return out;
  }
}