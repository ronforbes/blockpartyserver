const express = require('express');
const expressApp = express();
const http = require('http');
const httpServer = http.Server(expressApp);
const socketIOServer = require('socket.io')(httpServer);
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 1337;

expressApp.get('/', function(request, response) {
  response.send('<h1>Block Party Server!</h1>');
});

var players = [];

socketIOServer.on('connection', function(socket) {
  console.log('Connection: socket=' + socket);
  players[socket.id] = socket.id;
  socketIOServer.emit('player connected', { 
    name: players[socket.id] 
  });

  socket.on('chat message', function(message) {
    console.log('Chat Message: message=' + message);
    socketIOServer.emit('chat message', {
      name: players[socket.id],
      message: message
    });
  });

  socket.on('rename player', function(message) {
    console.log('Rename Player: message=' + message);
    var oldName = players[socket.id];
    players[socket.id] = message;
    console.log(oldName + ' became ' + players[socket.id]);
    socketIOServer.emit('rename player', {
      oldName: oldName,
      newName: players[socket.id]
    });
  });

  socket.on('disconnect', function() {
    console.log('Disconnect');
    socketIOServer.emit('player disconnected', {
        name: players[socket.id]
    });
    players[socket.id] = null;
  });
});

httpServer.listen(PORT, function() {
  console.log(`Listening on ${ HOST }:${ PORT }`);
});