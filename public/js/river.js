var river = {
  
  socket: null,

  /**************************************************************************************************** Init */
  init: function(socket) {
    this.socket = socket;

    if (!this.socket) {
      console.log("Sorry pal. Socket.io needed");
    }
  },

  /**************************************************************************************************** Binds */
  bindSocket: function(socket) {
    socket.on("bridge", this.receiveBridge)
  },

  receiveBridge: function() {
    console.log(data);
  }
}