$(function () {
    let myUsername;
    let myColor;
    //A client creates a socket and connects to the server
    let socket = io();

    //To calculate the scrollbar position for the messages' window
    let chatBody = document.getElementById("messages");
    chatBody.maxScrollTop = chatBody.scrollHeight - chatBody.offsetHeight;

    //A client receives something from server for the first time
    socket.on('your username', function(thisUser, thisUserColor, allMsg, uMsg, assignedUsernames) {
        myUsername = thisUser;
        myColor = thisUserColor;
        onlineUsersUpdate(assignedUsernames);
        messagesUpdate(allMsg, uMsg);
    });

    //When user submits a message to the client
    $('form').submit(function(e) {
        e.preventDefault(); // prevents page reloading

        //Client sends the message to the server
        socket.emit('chat message', $('#m').val(), myUsername, myColor);
        $('#m').val('');
        return false;
    });

    //Clients receive the current state (all messages) from server
    socket.on('chat message', function(allMsg, uMsg, assignedUsernames) {
        messagesUpdate(allMsg, uMsg);
        onlineUsersUpdate(assignedUsernames);

    });

    //A client has joined. Others receive a message from server
    socket.on('new user', function (allMsg, uMsg, assignedUsernames) {
        onlineUsersUpdate(assignedUsernames);
        messagesUpdate(allMsg, uMsg);
    });

    //A client has been disconnected. Others receive a message from server
    socket.on('user left', function (allMsg, uMsg, assignedUsernames) {
        onlineUsersUpdate(assignedUsernames);
        messagesUpdate(allMsg, uMsg);
    });

    //User has inserted an invalid input to the /name or /color commands. Client receives this announcement
    socket.on('invalid input', function (invalidInput) {
        alert(invalidInput);
        // let invalidMessage = document.createTextNode('<em>' + invalidUsername + '</em>');
        // let newItem = document.createElement('LI');
        // newItem.appendChild(invalidMessage);
        // $('#messages').insertBefore(newItem, $('#messages').childNodes[0]);
    });

    //User has inserted an invalid command with '/'. Client receives this announcement
    socket.on('invalid command', function (invalidCommand) {
        alert(invalidCommand);
    });

    //This user has changed their username. Client receives this announcement and updates the username
    socket.on('username changed', function (newSelectedUsername) {
        myUsername = newSelectedUsername;
    });

    //This user has changed their color. Client receives this announcement and updates the color
    socket.on('color changed', function (newSelectedColor) {
        myColor = newSelectedColor;
    });

    //Creating the messages window
    function messagesUpdate(allMsg, uMsg) {
        $('#messages').empty();
        for (let i = allMsg.length - 1; i >= 0; i--) {
            if (uMsg[i] === 'Server') {
                $('#messages').append($('<li><em>' + allMsg[i][0] + allMsg[i][1] + '</em></li>'));
            }
            else if (uMsg[i] === myUsername) {
                $('#messages').append($('<li><b>' + allMsg[i][0] + allMsg[i][1].replace(/</g,'&lt;') + '</b></li>'));
            }
            else {
                $('#messages').append($('<li>' + allMsg[i][0] + allMsg[i][1].replace(/</g,'&lt;') + '</li>'));
            }
        }
        //To check the position of the scrollbar of the messages' window and push it to bottom
        if (chatBody.scrollTop - chatBody.maxScrollTop <= chatBody.offsetHeight) {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    //Creating the online users panel
    function onlineUsersUpdate(assignedUsernames) {
        $('#online-users').empty();
        $('#online-users').append($('<li><b>' + myUsername + '(You) </b></li>'));
        for (let u of assignedUsernames) {
            if (u !== myUsername) {
                $('#online-users').append($('<li>').text(u));
            }
        }
    }
});

