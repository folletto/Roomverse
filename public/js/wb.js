var wb = {

  socket: null,

  dom: {},

  /**************************************************************************************************** Init */
  init: function() {
    var self = this;

    $(document).ready(function() {
      self.socket = io.connect('http://localhost');;

      if (self.socket) {
        // If the backend wrapper class is there, initialize
        self.bindDOM();
        self.bindSocket();
      }
    })
  },

  bindDOM: function(messageBoxId, buttonSendId, chatId, channelId) {
    var self = this;
    messageBoxId = messageBoxId || "wb-messagebox";
    chatId = chatId || "wb-chat";
    channelId = channelId || "wb-channel";
    
    this.dom = {
      messagebox: $("#" + messageBoxId)
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
  }
};