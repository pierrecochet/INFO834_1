/*global io*/
/*jslint browser: true*/
var socket = io();
var i;

/*** Fonctions utiles ***/

/**
 * Scroll vers le bas de page si l'utilisateur n'est pas remonté pour lire d'anciens messages
 */
function scrollToBottom() {
  if ($(window).scrollTop() + $(window).height() + 2 * $('#messages li').last().outerHeight() >= $(document).height()) {
    $('html, body').animate({ scrollTop: $(document).height() }, 0);
  }
}

/*** Gestion des événements ***/

/**
 * Connexion de l'utilisateur
 * Uniquement si le username n'est pas vide et n'existe pas encore
 */
$('#login form').submit(function (e) {
  e.preventDefault();
  var user = {
    username : $('#login input').val().trim()
  };
  if (user.username.length > 0) { // Si le champ de connexion n'est pas vide
    socket.emit('user-login', user, function (success) {
      if (success) {
        $('body').removeAttr('id'); // Cache formulaire de connexion
        $('#chat input').focus(); // Focus sur le champ du message
      }
    });
    socket.emit('joinroom','home');
  }
});

/**
 * Envoi d'un message
 */
$('#chat form').submit(function (e) {
  e.preventDefault();
  var message = {
    text : $('#m').val()
  };
  $('#m').val('');
  if (message.text.trim().length !== 0) { // Gestion message vide
    socket.emit('chat-message', message);
  }
  $('#chat input').focus(); // Focus sur le champ du message
});

socket.on('loadmessages',function (room) {
  $.getJSON( 'message/'+room, function( data ) {
    $.each( data, function( key, val ) {
      $('#messages').append($('<li>').html('<span class="username">' + val['sender_name'] + '</span> ' + val['text_message']));
      scrollToBottom();
    });
  });
});

socket.on('save-message',function (param) {
  var postData = {};
  console.log(param)
  postData.text_message = param[0];
  postData.sender_name = param[1];
  postData.room = param[2];
  $.ajax({
    url: '/message/',
    dataType: "json",
    type: 'POST',
    data: postData,
    success: function (data) {
      console.log(data);
    },
    failure: function (response) {
      alert(response.responseText);
    },
    error: function (response) {
      alert(response.responseText);
    }
})})

/**
 * Réception d'un message
 */
socket.on('chat-message', function (message) {
  $('#messages').append($('<li>').html('<span class="username">' + message.username + '</span> ' + message.text));
  scrollToBottom();
});

/**
 * Réception d'un message de service
 */
socket.on('service-message', function (message) {
  $('#messages').append($('<li class="' + message.type + '">').html('<span class="info">information</span> ' + message.text));
  scrollToBottom();
});

/**
 * Connexion d'un nouvel utilisateur
 */
socket.on('user-login', function (user) {
  $('#users').append($('<li class="' + user.username + ' new">').html(user.username + '<span class="typing">typing</span>'));
  setTimeout(function () {
    $('#users li.new').removeClass('new');
  }, 1000);
});

/**
 * Déconnexion d'un utilisateur
 */
socket.on('user-logout', function (user) {
  var selector = '#users li.' + user.username;
  $(selector).remove();
});

socket.on('joinroomchat', function (param) {
  console.log("joinchatroom");
  console.log(param);
  console.log(param[0]);
  $('#'+param[1]+'room').append($('<li class="' + param[0] + ' new">').html(param[0]));
  setTimeout(function () {
    $('#usersroom li.new').removeClass('new');
  }, 1000);
});

/**
 * Déconnexion d'un utilisateur
 */
socket.on('leftroomchat', function (param) {
  console.log("leftroomchat");
  console.log(param);
  console.log(param[0]);
  var selector = '#'+param[1]+'room li.' + param[0];
  $(selector).remove();
});


/**
 * Détection saisie utilisateur
 */
var typingTimer;
var isTyping = false;

$('#m').keypress(function () {
  clearTimeout(typingTimer);
  if (!isTyping) {
    socket.emit('start-typing');
    isTyping = true;
  }
});

$('#m').keyup(function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(function () {
    if (isTyping) {
      socket.emit('stop-typing');
      isTyping = false;
    }
  }, 500);
});

$(".room").click(function(event) {
  const promise1 = new Promise(function(resolve, reject) {
    resolve(socket.emit('leftroom'));
  });
  // socket.leave('home');
  promise1.then(socket.emit('joinroom',event.target.id));
});

/**
 * Gestion saisie des autres utilisateurs
 */
socket.on('update-typing', function (typingUsers) {
  $('#users li span.typing').hide();
  for (i = 0; i < typingUsers.length; i++) {
    $('#users li.' + typingUsers[i].username + ' span.typing').show();
  }
});