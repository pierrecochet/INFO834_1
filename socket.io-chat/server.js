var express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
var app = express();

let db = 'mongodb://localhost:27021,localhost:27022,localhost:27023/socketio?replicaSet=rs0'
database = 'mongodb://localhost:27017/socketio';
mongoose.connect(db,(err)=>{
  if(err)
    throw err;
  console.log('conneced to the database')
});

app.use(bodyParser.urlencoded({ extended: true }));

const messageRoutes = require("./routes/message");
app.use('/message', messageRoutes);










app.set('port', process.env.PORT || 3000);
const server = app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io')(server);
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
var i;

/**
 * Gestion des requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
 */
app.use('/', express.static(__dirname + '/public'));

/**
 * Liste des utilisateurs connectés
 */
var users = [];

/**
 * Historique des messages
 */
var messages = [];

/**
 * Liste des utilisateurs en train de saisir un message
 */
var typingUsers = [];

var socketList= []

io.on('connection', function (socket) {

  // /**
  //  * Utilisation du redis-adapter pour connaitre les clients d'un salon
  //  */
  // socket.on('get-member', function (room) {
  //   io.of('/').adapter.clients([room], (err, clients) => {
  //     console.log(clients);
  //   });
  // })

  /**
   * Utilisateur connecté à la socket
   */
  var loggedUser;

  /**
   * Emission d'un événement "user-login" pour chaque utilisateur connecté
   */
  for (i = 0; i < users.length; i++) {
    socket.emit('user-login', users[i]);
  }

  for (i = 0; i < socketList.length; i++) {
    console.log('oui');
    var param=[socketList[i].nickname,socketList[i].room]
    console.log(param)
    socket.emit('joinroomchat',param);
  }






  /** 
   * Emission d'un événement "chat-message" pour chaque message de l'historique
   */
  for (i = 0; i < messages.length; i++) {
    if (messages[i].username !== undefined) {
      socket.emit('chat-message', messages[i]);
    } else {
      socket.emit('service-message', messages[i]);
    }
  }

  /**
   * Déconnexion d'un utilisateur
   */
  socket.on('disconnect', function () {
    if (loggedUser !== undefined) {
      // Broadcast d'un 'service-message'
      var serviceMessage = {
        text: 'User "' + loggedUser.username + '" disconnected',
        type: 'logout'
      };
      socket.broadcast.emit('service-message', serviceMessage);
      // Suppression de la liste des connectés
      var userIndex = users.indexOf(loggedUser);
      if (userIndex !== -1) {
        users.splice(userIndex, 1);
      }
      // Ajout du message à l'historique
      messages.push(serviceMessage);
      // Emission d'un 'user-logout' contenant le user
      io.emit('user-logout', loggedUser);
      // Si jamais il était en train de saisir un texte, on l'enlève de la liste
      var typingUserIndex = typingUsers.indexOf(loggedUser);
      if (typingUserIndex !== -1) {
        typingUsers.splice(typingUserIndex, 1);
      }
      socket.emit('leftroom');
      var index = socketList.indexOf(socket);
      socketList.splice(index,1);
    }
  });

  /**
   * Connexion d'un utilisateur via le formulaire :
   */
  socket.on('user-login', function (user, callback) {
    // Vérification que l'utilisateur n'existe pas
    var userIndex = -1;
    for (i = 0; i < users.length; i++) {
      if (users[i].username === user.username) {
        userIndex = i;
      }
    }
    if (user !== undefined && userIndex === -1) { // S'il est bien nouveau
      // Sauvegarde de l'utilisateur et ajout à la liste des connectés
      loggedUser = user;
      socket.nickname = user.username
      users.push(loggedUser);
      //liste des socket avec le nom des users
      socketList.push(socket);
      // Envoi et sauvegarde des messages de service
      var userServiceMessage = {
        text: 'You logged in as "' + loggedUser.username + '"',
        type: 'login'
      };
      var broadcastedServiceMessage = {
        text: 'User "' + loggedUser.username + '" logged in',
        type: 'login'
      };
      socket.emit('service-message', userServiceMessage);
      socket.broadcast.emit('service-message', broadcastedServiceMessage);
      messages.push(broadcastedServiceMessage);
      // Emission de 'user-login' et appel du callback
      io.emit('user-login', loggedUser);
      callback(true);
    } else {
      callback(false);
    }
  });


  socket.on('joinroom', (room) => {
    if(socket.nickname!=undefined){
      socket.emit('loadmessages',room)
      console.log("join room ",socket.nickname)
      var userServiceMessage = {
        text: socket.nickname+' has joined '+room,
        type: 'loginroom'
      };
      var userServiceMessageMe = {
        text: 'You\'ve joined ' + room,
        type: 'loginroom'
      };
      socket.room=room
      console.log("socket room"+socket.room);
      var param= [socket.nickname,socket.room];
      socket.emit('joinroomchat',param);
      socket.broadcast.emit('joinroomchat',param)
      socket.emit('service-message', userServiceMessageMe);
      socket.to(room).emit('service-message', userServiceMessage);
      socket.join(room);
    }
  });

  socket.on("leftroom",()=>{
    var userServiceMessagelougout = {
          text: loggedUser.username+' logged out from the room',
          type: 'logoutroom'
        };
    socket.to(socket.room).emit('service-message', userServiceMessagelougout);
    var param= [socket.nickname,socket.room];
    socket.broadcast.emit('leftroomchat',param);
    socket.emit('leftroomchat',param);
    socket.leave(socket.room);
  });



  /**
   * Réception de l'événement 'chat-message' et réémission vers tous les utilisateurs
   */
  socket.on('chat-message', function (message) {
    // On ajoute le username au message et on émet l'événement
    message.username = loggedUser.username;
    socket.emit('chat-message', message);
    socket.to(socket.room).emit('chat-message', message);
    param=[message.text,socket.nickname,socket.room];
    socket.emit('save-message',param);
  });

  /**
   * Réception de l'événement 'start-typing'
   * L'utilisateur commence à saisir son message
   */
  socket.on('start-typing', function () {
    // Ajout du user à la liste des utilisateurs en cours de saisie
    if (typingUsers.indexOf(loggedUser) === -1) {
      typingUsers.push(loggedUser);
    }
    io.emit('update-typing', typingUsers);
  });

  /**
   * Réception de l'événement 'stop-typing'
   * L'utilisateur a arrêter de saisir son message
   */
  socket.on('stop-typing', function () {
    var typingUserIndex = typingUsers.indexOf(loggedUser);
    if (typingUserIndex !== -1) {
      typingUsers.splice(typingUserIndex, 1);
    }
    io.emit('update-typing', typingUsers);
  });
});

/**
 * Lancement du serveur en écoutant les connexions arrivant sur le port 3000
 */
