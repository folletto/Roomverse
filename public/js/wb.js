$(document).ready(function() { wb.init(); });

var wb = {

  socket: null,

  dom: {},

  /**************************************************************************************************** Init */
  init: function() {    
    this.socket = io.connect('http://localhost');;

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
    console.log(data);
    console.log(data.message);
    wb.receive(data.message);
  },

  bridgeSend: function(message) {
    wb.socket.emit("bridge", { message: message });
  },

  /**************************************************************************************************** Actions */
  send: function(message) {
    console.log("<- " + message);
    this.bridgeSend(message);
  },

  receive: function(message) {
    console.log("-> " + message);
    this.dom.chat.append("<li>" + message + "</li>");
  }
};