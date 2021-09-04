const express = require('express');
const fs = require('fs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const moment = require('moment');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 4000;

//utils
const messageUtils = require('./utils/messageUtils');
const validator = require('./utils/validatorUtils');


// Routes
const loginRoutes = require('./routes/loginRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const registerRoutes = require('./routes/registerRoutes');

// Models
const Message = require('./models/Message');

// Register view engine
app.set('view engine', 'ejs');

// Static files
app.use(express.static('public'));

// Setting up https server
const https = require('https');

const httpsServer = https.createServer({
key: fs.readFileSync('./pki/server/sni-chat.pem', 'utf8'),
cert: fs.readFileSync('./pki/server/sni-chat.crt', 'utf8'),
requestCert: true,
rejectUnauthorized: true,
ca: fs.readFileSync('./pki/ca/rootCA.crt'),
crl: fs.readFileSync('./pki/crl/CRL.pem')
}, app);

// Setting up session middleware
const sessionMiddlware = session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SECRET,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_DB_HOST }),
  cookie: { secure: true }
});

// Socket.io
const io = socketio(httpsServer);

io.use((socket, next) => {
  sessionMiddlware(socket.request, socket.response || {}, next);
});

io.use((socket, next) => {
  const session = socket.request.session;
  if(session && session.user && session.verified){
    next();
  } else {
    next(new Error("You attempted attack"));
  }
})



app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(sessionMiddlware);


// Validate request params for SQLI and XSS attacks
app.use((req, res, next) => {
  for(var prop in req.query){
    if(validator.detectMalicious(req.query[prop])){
      console.log('ATTACK DETECTED!');
      req.session.destroy();
      res.redirect('malicious');
    }
  }
  next();
});

//Set up mongoose connection
let mongoDB = process.env.MONGO_DB_HOST;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get default connection
var db = mongoose.connection;

function restrict(req, res, next) {
  if (req.session.verified && req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

// Messaging
io.on('connection', socket => {
  const connectedUser = socket.request.session.user;
  const userId = connectedUser._id;
  const objectId = new mongoose.Types.ObjectId(userId);

  socket.join(userId);

  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    let user = socket.request.session.user;
    user.messages = [];
    users.push(user);
  }
  Message.find({
    $or: [
      { to: objectId },
      { 'from._id': userId }
    ]
  }, (err, messages) => {
    if (!err) {
      messages.forEach(message => {
        users.forEach(user => {
          if ((userId == message.from._id && user._id == message.to) || (user._id == message.from._id && userId == message.to)) {
            user.messages.push(message);
          }
        })
      });
      socket.emit('users', users);
    } else {
      console.log(err);
    }
  })

  // Broadcast when user connects
  socket.broadcast.emit('user connected', socket.request.session.user);

  socket.on('private message', ({ message, to }) => {
    if(validator.detectMalicious(message)){
      console.log('malicious');
      io.to(socket.request.session.user._id).emit('malicious', {
        message: 'Your message is classified as malicious and legal actions may be taken.'})
      socket.disconnect();
    }else{
      const { messages, ...from } = socket.request.session.user;
      let escaped = messageUtils.escapeHTML(message);
      console.log('ESCAPED:', escaped);
      io.to(to).to(userId).emit('private message', { message: escaped, from, to, time: moment().format("HH:mm") })
      const newMessage = new Message({
        message: escaped,
        to,
        from,
        time: moment().format("HH:mm")
      })
      newMessage.save();
    }
  })

  socket.on("disconnect", async (reason) => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    console.log(reason);
    if (isDisconnected) {
      // notify other users
      const session = socket.request.session;
      socket.broadcast.emit("user disconnected", session ? session.user._id : "Disconnected due to err");
      // If user is disconnected by server destroy session
      if(reason == 'server namespace disconnect'){
        socket.request.session.destroy();
      }
    }
  });
});

app.get('/', restrict, (req, res) => {
  res.render('index');
})

// ROUTES
app.use('/login', loginRoutes);
app.use('/token', tokenRoutes);
app.use('/register', registerRoutes);

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/malicious', (req, res) => {
  res.render('malicious');
})

app.use((req, res) => {
  res.status(404).render('404');
})

httpsServer.listen(port, () => {
  console.log(`Express app listening at https://localhost:${port}`)
})