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
 
 $(document).ready(function() { wb.init(config); });

var wb = {

  socket: null,
  
  userid: "You",

  dom: {},

  /**************************************************************************************************** Init */
  init: function(config) {    
    this.socket = io.connect('http://localhost', { 'sync disconnect on unload': true });
    
    this.userid = config.userid;
    
    if (this.socket) {
      // If the backend wrapper class is there, initialize
      this.bindDOM();
      this.bindSocket();
    }
  },

  bindDOM: function(messageBoxId, chatId, roomsId, widgetsId) {
    var self = this;
    messageBoxId = messageBoxId || "wb-messagebox";
    chatId = chatId || "wb-chat";
    roomsId = roomsId || "wb-rooms";
    widgetsId = widgetsId || "wb-widgets";
    
    this.dom = {
      messagebox: $("#" + messageBoxId),
      chat: $("#" + chatId)
    }
    console.log(messageBoxId);

    this.dom.messagebox.keyup(function(event) {
        if(event.keyCode == 13){
            self.send("wbtestchannel", self.dom.messagebox.val());
            self.dom.messagebox.val("");
        }
    });



  },

  bindSocket: function(socket) {
    this.socket.on("bridge", this.bridgeReceive.bind(this));
    this.socket.on("message", this.messageReceive.bind(this));
  },
  
  /****** Bridge */
  bridgeReceive: function(packet) {
    console.log(packet);
  },
  
  bridgeSend: function(text) {
    wb.socket.emit("bridge", { room: "", userid: "", text: text });
  },
  
  /****** Message */
  messageReceive: function(packet) {
    wb.receive(packet.room, packet.userid, packet.text, packet);
  },

  messageSend: function(room, text) {
    wb.socket.emit("message", { room: room, userid: this.userid, text: text });
  },


  /**************************************************************************************************** Actions */
  send: function(room, text) {
    if (text) {
      console.log("<- " + text);
      this.messageSend(room, text);
      this.roomEcho(room, "you", text);
    }
  },

  receive: function(room, userid, text, packet) {
    console.log("-> " + text);
    this.roomEcho(room, userid, text);
  },


  /**************************************************************************************************** DOM */
  roomEcho: function(room, userid, text) {
    var wasScrolled = ((this.dom.chat.scrollTop() + this.dom.chat.height()) >= this.dom.chat.prop('scrollHeight'));
    
    this.dom.chat.removeClass("wait");
    this.dom.chat.append('<li><span class="wb-message-nick">' + userid + '</span> <span class="wb-message-text">' + text + '</message></li>');
    
    // ****** Scroll to bottom if the chat wasn't scrolled up manually
    if (wasScrolled) {
      this.dom.chat.scrollTop(this.dom.chat.prop('scrollHeight'));
    }
  }
};