/*
 * WordBridge Client
 *
 * This class manages the connection from the client.
 * 
 * Requires
 *   Socket.io
 *   jQuery
 *
 */
 
 $(document).ready(function() { wb.init(); });

var wb = {

  socket: null,

  dom: {},

  /**************************************************************************************************** Init */
  init: function() {    
    this.socket = io.connect('http://localhost', { 'sync disconnect on unload': true });

    if (this.socket) {
      // If the backend wrapper class is there, initialize
      this.bindDOM();
      this.bindSocket();
    }
  },

  bindDOM: function(messageBoxId, chatId, channelsId, widgetsId) {
    var self = this;
    messageBoxId = messageBoxId || "wb-messagebox";
    chatId = chatId || "wb-chat";
    channelsId = channelsId || "wb-channels";
    widgetsId = widgetsId || "wb-widgets";
    
    this.dom = {
      messagebox: $("#" + messageBoxId),
      chat: $("#" + chatId)
    }
    console.log(messageBoxId);

    this.dom.messagebox.keyup(function(event) {
        if(event.keyCode == 13){
            self.send(self.dom.messagebox.val());
            self.dom.messagebox.val("");
        }
    });



  },

  bindSocket: function(socket) {
    this.socket.on("bridge", this.bridgeReceive);
  },

  bridgeReceive: function(data) {
    wb.receive(data.channel, data.nick, data.text, data);
  },

  bridgeSend: function(text) {
    wb.socket.emit("bridge", { channel: "", nick: "", text: text });
  },


  /**************************************************************************************************** Actions */
  send: function(text) {
    if (text) {
      console.log("<- " + text);
      this.bridgeSend(text);
      this.channelWriter("", "you", text);
    }
  },

  receive: function(channel, nick, text, data) {
    console.log("-> " + text);
    this.channelWriter(channel, nick, text);
  },


  /**************************************************************************************************** DOM */
  channelWriter: function(channel, nick, message) {
    var wasScrolled = ((this.dom.chat.scrollTop() + this.dom.chat.height()) >= this.dom.chat.prop('scrollHeight'));
    
    this.dom.chat.append('<li><span class="wb-message-nick">' + nick + '</span> <span class="wb-message-text">' + message + '</message></li>');
    
    // ****** Scroll to bottom if the chat wasn't scrolled up manually
    if (wasScrolled) {
      this.dom.chat.scrollTop(this.dom.chat.prop('scrollHeight'));
    }
  }
};