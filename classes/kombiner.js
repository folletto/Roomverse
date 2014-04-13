/*
 * Kombiner
 * Combines multiple files in one single output.
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
 * This library combines multiple text files (i.e. CSS, JS) into one to serve them in a
 * single HTTP request. Does in-memory caching and watches the file for changes.
 * 
 * USAGE:
 *
 *   var k = require('kombiner').listen(server);
 *   k.serve('allinone.js', ['mylibrary.js', 'otherstuff.js']);
 *
 * The library will aggregate the files in that order, and serve them at that URL.
 *
 * You can also attach filters that will pre-process the files before combining.
 * Add them to the filters dictionary as functions before calling any serve().
 *
 *   k.filters.minify = function(original) { ...; return processed; };
 *
 */

var fs = require('fs');


// ****** Prepare the listen server
var KombinerExport = module.exports = {
  listen: function(httpServer) {
    /*
     * Initialize and return the library.
     */
    Kombiner.server = httpServer;
    return Kombiner;
  }
}


// ****** The library
var Kombiner = { // Use as a static library.
  
  server: null,
  endpoints: {},
  filters: {}, // no default filters, attach them here if needed
  
  serve: function(endpoint, filesArray) {
    /* 
     * Main function. Creates the endpoints.
     */
    
    // Store the endpoint
    this.endpoints[endpoint] = {
      files: filesArray,
      cache: '',
      timestamp: ''
    };
    
    // Do an initial combine
    this.endpoints[endpoint].cache = this.combine(this.endpoints[endpoint].files);
    
    // Watch for changes
    this.watchAll(this.endpoints[endpoint].files, this.onWatchChange.bind(this));
    
    // Listen for requests
    this.listen(this.server, endpoint);
  },
  
  /************************************************************************ Support */
  combine: function(filesArray) {
    /*
     * Combines all the files into one string output.
     */
    var out = '';
    
    for (var i in filesArray) {
      // Read
      var pre = fs.readFileSync(filesArray[i], 'utf8');
      
      // Process filters, if any
      for (var filter in Kombiner.filters) {
        pre = Kombiner.filters[filter](pre);
      }
      
      // Concatenate
      out += pre;
    }
    
    return out;
  },
  
  /************************************************************************ Server */
  listen: function(srv, endpoint) {
    /*
     * Creates the serve listener.
     * Inspired by Socket.io.
     */
    
    var url = '/' + endpoint;
    var evs = srv.listeners('request').slice(0);
    var self = this;
    
    srv.removeAllListeners('request');
    
    srv.on('request', function(req, res) {
      if (0 == req.url.indexOf(url)) {
        // ****** URL found.
        self.serveEndpoint(req, res, endpoint);
      } else {
        // ****** Not the right URL. Go on with the rest.
        for (var i = 0; i < evs.length; i++) {
          evs[i].call(srv, req, res);
        }
      }
    });
  },
  serveEndpoint: function(req, res, endpoint) {
    /*
     * Output function.
     * Inspired by Socket.io.
     */
    
    // Support caching using internal cache generation timestamp
    if (req.headers.etag) {
      if (this.endpoints[endpoint].timestamp == req.headers.etag) {
        res.writeHead(304);
        res.end();
        return;
      }
    }
    
    // Headers
    var ext = endpoint.split().pop();
    if (ext == 'js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (ext == 'css') {
      res.setHeader('Content-Type', 'text/css');
    }
    res.setHeader('ETag', this.endpoints[endpoint].timestamp);
    res.writeHead(200);
    
    // Output
    res.end(this.endpoints[endpoint].cache);
  },
  
  /************************************************************************ Watch */
  watchAll: function(filesArray, fx) {
    /*
     * Watches a set of files.
     */
    for (var i in filesArray) {
      this.watch(filesArray[i], fx);
    }
  },
  watch: function(file, fx) {
    /*
     * Waches a single file for changes.
     */
    fs.watchFile(file, function(curr, prev) {
      if ((curr.size !== prev.size) || (curr.mtime !== prev.mtime)) {
        // File has changed
        fx(file);
      }
    });
  },
  onWatchChange: function(file) {
    /*
     * Event: triggered on watch change.
     */
    
    for (var endpoint in this.endpoints) {
      for (var i in this.endpoints[endpoint].files) {
        //console.log('Checking: ' + file + ' == ' + this.endpoints[endpoint].files[i]);
        
        if (this.endpoints[endpoint].files[i] == file) {
          // Match. Combine a new one.
          console.log('>>> Refreshing endpoint "' + endpoint + '" [' + file + ']');
          
          // Combine
          this.endpoints[endpoint].cache = this.combine(this.endpoints[endpoint].files);
          
          // Timestamp
          this.endpoints[endpoint].timestamp = Date.now();
        }
      }
    }
  }
}
