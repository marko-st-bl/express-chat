var messages = document.querySelector('.messages');
var form = document.querySelector('.new-message-form');
var input = document.querySelector('.message-input');
var usersUL = document.querySelector('.online-users');
var onlineUsers = [];

const socket = io();

form.addEventListener('submit', (e) => {
    e.preventDefault();
    let selected = document.querySelector('.user-selected');
    if(input.value && selected){
        //send message
        let to = selected.id;
        socket.emit('private message', { message: input.value, to});
        input.value='';
        
        messages.scrollTop = messages.scrollHeight;
    }
});

socket.on('users', (users) => {
    console.log({users});
    usersUL.innerHTML = '';
    onlineUsers = users;
    onlineUsers.forEach(user => {
            addUserToDOM(user);
    }
    );
})

socket.on('messages', (messages) => {
    console.log(messages);
})

socket.on('user disconnected', (id) => {
    console.log(`User: ${id} disconnected`);
    removeUserFromDOM(id);
})

socket.on('user connected', (user) => {
    console.log(`${user.name} connected`)
    let isExistingUser = document.getElementById(user._id);
    if(!isExistingUser){
        onlineUsers.push(user);
        addUserToDOM(user);
    }
});


socket.on('private message', (message) => {
    console.log('Message received', message);
    let selected = document.querySelector('.user-selected');
    onlineUsers.filter(user => user._id === message.from._id || user._id === message.to)[0].messages.push(message);
    if(selected && (selected.id === message.from._id || selected.id === message.to)){
        addMessageToDOM(message);
        messages.scrollTop = messages.scrollHeight;
    }
})

socket.on('malicious', (err) => {
    console.log('MALICIOUS', err.message)
    alert(err.message);
})

socket.on('connect_error', (err) => {
    console.log(err);
})

const addMessageToDOM = (message) => {
    var newMessage = document.createElement('div');
    newMessage.classList.add('message');
    newMessage.innerHTML = `<p class='meta'>${message.from.name}<span>${message.time}</span></p><div class='message-text'>${message.message}</div>`
    messages.appendChild(newMessage);
}

const addUserToDOM = (user) => {
    let li = document.createElement('li');
    li.id = user._id;
    li.innerHTML = `<div class='user-name'>${user.name}</div>`
    li.addEventListener('click', () => {
        let selected = document.querySelector('.user-selected');
        if(selected){
            selected.classList.remove('user-selected');
        }
        li.classList.add('user-selected');
        messages.innerHTML='';
        onlineUsers.filter(user => user._id === li.id)[0].messages.forEach(i => addMessageToDOM(i));
        messages.scrollTop = messages.scrollHeight;
    })
    usersUL.appendChild(li);
}


const removeUserFromDOM = (id) => {
    let dc = document.getElementById(id);
    if(dc){
        usersUL.removeChild(dc);
    }
}

