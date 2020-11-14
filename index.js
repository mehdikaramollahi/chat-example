let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

let availableUsernames = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8'];
let availableColors = ['FF0000', '0000FF', '00FF00', '00FFFF', 'FF00FF', 'FFFF00', 'FFA500', '008080'];
let assignedUsernames = [];
let assignedColors = [];
let allMsg = []; //list of all messages
let uMsg = []; //list of the username of each message
let uColors = []; //list of color of each message
let invalidInput = 'Invalid input! Please try another one.';
let invalidCommand = 'Invalid command! Please try either "/name" to change username, ' +
    'or "/color" to change your color';

//Function to calculate current time in HH:MM:SS format
function calTime () {
    let timeOfMsg = Math.floor(new Date().getTime()/ 1000.0);
    let myDate = new Date(timeOfMsg * 1000);
    let myHour = myDate.getHours();
    myHour = ("0" + myHour).slice(-2);
    let myMin = myDate.getMinutes();
    myMin = ("0" + myMin).slice(-2);
    let mySec = myDate.getSeconds();
    mySec = ("0" + mySec).slice(-2);
    return myHour + ':' + myMin + ':' + mySec;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + "/style.css");
});

app.get('/script.js', function(req, res) {
    res.sendFile(__dirname + "/script.js");
});

io.on('connection', (socket) => {

    let thisUser; //this user's username
    let thisUserColor; //this user's color
    thisUser = availableUsernames.shift(); //get one username from the list of available usernames
    thisUserColor = availableColors.shift(); //get one color from the list of available color
    assignedUsernames.push(thisUser); // push to the list of assigned usernames
    assignedColors.push(thisUserColor); //push to the list of assigned colors

    socket.username = thisUser;
    socket.color = thisUserColor;

    //Server has assigned a username to this client, now sends to that client its username and all messages
    socket.emit('your username', thisUser, thisUserColor, allMsg, uMsg, assignedUsernames);

    //Server announces the new user to all clients
    allMsg.push([calTime() + ' ' + "New user is joined: "
    + '</span>' + '<span style="color: #' + thisUserColor + '">' + thisUser + '</span>', '']);
    uMsg.push('Server');
    uColors.push('#eeeeee');
    io.emit('new user', allMsg, uMsg, assignedUsernames);
    console.log(thisUser);

    //When a client gets disconnected
    socket.on('disconnect', () => {
        allMsg.push([calTime() + ' ' + "A user is left: "
            + '</span>' + '<span style="color: #' + socket.color + '">' + socket.username + '</span>', '']);
        uMsg.push('Server');
        uColors.push('#eeeeee');
        let indexU = assignedUsernames.indexOf(socket.username);
        if (indexU > -1) {
            assignedUsernames.splice(indexU, 1); //remove the username from the assigned list
            availableUsernames.push(socket.username); //push the username to the available list
        }
        let indexC = assignedColors.indexOf(socket.color);
        if (indexC > -1) {
            assignedColors.splice(indexC, 1); //remove the color from the assigned list
            availableColors.push(socket.color); //push the color to the available list
        }
        //Broadcast to everyone that a user has left and let them update their window
        io.emit('user left', allMsg, uMsg, assignedUsernames);
    });

    //Server receives a message from one of the clients
    socket.on('chat message', (msg, myUsername, myColor) => {

        let thisUsername = myUsername;
        let thisColor = myColor;
        let currTime = calTime();
        let newSelectedUsername;
        let newSelectedColor;
        let flag = false;

        //Check to see if the client wants to change the username
        if (msg.startsWith('/')) {
            if (msg.startsWith('/name ')) {
                newSelectedUsername = msg.substr(6);
                //Check to see if the username is already taken, hence invalid
                for (let u of assignedUsernames) {
                    if (u === newSelectedUsername) {
                        //Announce the client that she/he has taken an invalid username
                        socket.emit('invalid input', invalidInput);
                        flag = true;
                        break;
                    }
                }
                //If the username is not already taken, hence valid
                if (flag === false) {
                    for (let i = 0; i < assignedUsernames.length; i++) {
                        //Find the client with old username and assign new username to the online users
                        if (assignedUsernames[i] === thisUsername) {
                            assignedUsernames[i] = newSelectedUsername;
                            //Let the client know about her/his new username
                            socket.emit('username changed', newSelectedUsername);
                            //Broadcast to all clients to update their online users list
                            allMsg.push([currTime + ' ' + thisUsername + ': ' + 'changed their username to: '
                            + '<span style="color: #' + thisColor + '">' + newSelectedUsername
                            + '</span>', '']);
                            uMsg.push('Server');
                            uColors.push('#eeeeee');
                            io.emit('new user', allMsg, uMsg, assignedUsernames);
                            //Update the available list of usernames in case the new username is in that list
                            for (let j = 0; j < availableUsernames.length; j++) {
                                if (availableUsernames[j] === newSelectedUsername) {
                                    availableUsernames[j] = thisUsername;
                                }
                            }
                            break;
                        }
                    }
                    //Update the username attribute of the socket
                    socket.username = newSelectedUsername;
                }
            }
            //Check to see if the client wants to change its color
            else if (msg.startsWith('/color ')) {
                newSelectedColor = msg.substr(7, 6).toUpperCase();
                //Check to see if the color has correct format
                if (!/^[A-F0-9]+$/.test(newSelectedColor)) {
                    socket.emit('invalid input', invalidInput);
                    flag = true;
                }
                //Check to see if the color is already taken, hence invalid
                else {
                    for (let c of assignedColors) {
                        if (c === newSelectedColor) {
                            //Announce the client that she/he has taken an invalid color
                            socket.emit('invalid input', invalidInput);
                            flag = true;
                            break;
                        }
                    }
                }
                //If the selected color is valid
                if (flag === false) {
                    for (let i = 0; i < assignedColors.length; i++) {
                        //Find the client with old color and assign new color to the chat messages
                        if (assignedColors[i] === thisColor) {
                            assignedColors[i] = newSelectedColor;
                            //Let the client know that their requested color is confirmed
                            socket.emit('color changed', newSelectedColor);
                            allMsg.push([currTime + ' ' + thisUsername + ': ' + 'changed their color to: '
                            + '<span style="color: #' + newSelectedColor + '">' + thisUsername
                            + '</span>', '']);
                            uMsg.push('Server');
                            uColors.push('#eeeeee');
                            //Update the available list of colors in case the new color is in that list
                            for (let j = 0; j < availableColors.length; j++) {
                                if (availableColors[j] === newSelectedColor) {
                                    availableColors[j] = thisColor;
                                }
                            }
                            //Update the colors of previous messages
                            for (let j = 0; j < allMsg.length; j++) {
                                if (uColors[j] === thisColor) {
                                    uColors[j] = newSelectedColor;
                                    let oneOldMsg = allMsg[j][0];
                                    let indexOfSharp = oneOldMsg.indexOf("#");
                                    let part_one = oneOldMsg.substring(0, indexOfSharp + 1);
                                    let part_two = oneOldMsg.substring(indexOfSharp + 7,
                                        oneOldMsg.length);
                                    allMsg[j][0] = part_one + newSelectedColor + part_two;
                                }
                            }
                            //Broadcast to all clients to update their online users list
                            io.emit('new user', allMsg, uMsg, assignedUsernames);
                            break;
                        }
                    }
                    //Update the color attribute of the socket
                    socket.color = newSelectedColor;
                }
            }
            else {
                //Send the client the "Invalid command" message
                socket.emit('invalid command', invalidCommand);
            }
        }
        //User has inserted a message and client has sent a message
        else {
            //Check the smiley here
            let smile = msg.indexOf(":)");
            if (smile > -1) {
                let p_one = msg.substring(0, smile);
                let p_two = msg.substring(smile + 2, msg.length);
                msg = p_one + '&#128578' + p_two;
            }
            let sad = msg.indexOf(":(");
            if (sad > -1) {
                let p_one = msg.substring(0, sad);
                let p_two = msg.substring(sad + 2, msg.length);
                msg = p_one + '&#128577' + p_two;
            }
            let wonder = msg.indexOf(":o");
            if (wonder > -1) {
                let p_one = msg.substring(0, wonder);
                let p_two = msg.substring(wonder + 2, msg.length);
                msg = p_one + '&#128558' + p_two;
            }
            //Create the new message and put it in the list of all messages
            allMsg.push([currTime + ' ' + '<span style="color: #' + thisColor + '">' + thisUsername + ': ' +
                '</span>' , msg]);
            uMsg.push(thisUsername);
            uColors.push(thisColor);

            //Server broadcasts the current state (all messages) to all clients
            io.emit('chat message', allMsg, uMsg, assignedUsernames);
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});