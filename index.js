const express = require('express');
const expressApp = express();
const http = require('http');
const httpServer = http.Server(expressApp);
const socketIOServer = require('socket.io')(httpServer);
const PORT = process.env.PORT || 1337;

expressApp.get('/', function(request, response) {
  response.send('<h1>Block Party Server!</h1>');
});

var players = [];
var states = {
    inGame: "inGame",
    outOfGame: "outOfGame"
}
var stateDurations = {
    inGame: 120,
    outOfGame: 45,
}
var state = states.inGame;
var stateDuration = stateDurations.inGame;
var stateElapsed = 0;
var results = [];

socketIOServer.on('connection', function(socket) {
  players[socket.id] = socket.id;
  console.log('player connected: { name: ' + players[socket.id] + ' }');
  socketIOServer.emit('player connected', { 
    name: players[socket.id] 
  });

  socket.on('request state', function() {
    console.log('request state: { state: ' + state + ', duration: ' + stateDuration + ', elapsed: ' + stateElapsed + ' }');
    socket.emit('request state', {
        state: state,
        duration: stateDuration,
        elapsed: stateElapsed
    });
  });

  socket.on('chat message', function(message) {
    console.log('chat message: { name: ' + players[socket.id] + ', message: ' + message + ' }');
    socketIOServer.emit('chat message', {
      name: players[socket.id],
      message: message
    });
  });

  socket.on('rename player', function(message) {
    var oldName = players[socket.id];
    players[socket.id] = message;
    console.log('rename player: { oldName: ' + oldName + ', newName: ' + players[socket.id] + ' }');
    socketIOServer.emit('rename player', {
      oldName: oldName,
      newName: players[socket.id]
    });
  });

  socket.on('player score', function(message) {
    results.push({
        name: players[socket.id],
        score: message
    });
    results.sort((a, b) => { return b.score - a.score });
    console.log('player score: { name: ' + players[socket.id] + ', score: ' + message + ' }');
  });

  socket.on('game results', function() {
    console.log('game results: { results: ' + results + ' }');
    socketIOServer.emit('game results', {
        results: results
    });
  });

  socket.on('disconnect', function() {
    console.log('player disconnected: { name: ' + players[socket.id] + ' }');
    socketIOServer.emit('player disconnected', {
        name: players[socket.id]
    });
    players[socket.id] = null;
  });
});

httpServer.listen(PORT, function() {
  console.log(`Listening on port ${ PORT }`);
});

console.log("Switching state to " + state);

setInterval(function() {
  stateElapsed++;

  if(state == states.outOfGame && stateElapsed == 3) {
    console.log('game results: { ');
    results.forEach(function(result) {
      console.log('{ name: ' + result.name + ', score: ' + result.score + ' },');
    });
    console.log('}');
    socketIOServer.emit('game results', {
        results: results
    });
  }

  if(stateElapsed >= stateDuration) {
    switch(state) {
      case states.inGame:
        state = states.outOfGame;
        stateDuration = stateDurations.outOfGame;
        stateElapsed = 0;
        console.log("Switching state to " + state);
        break;
      case states.outOfGame:
        state = states.inGame;
        stateDuration = stateDurations.inGame;
        stateElapsed = 0;
        results = [];
        console.log("Switching state to " + state);
        break;
    }
  }
}, 1000);