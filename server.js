const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const uuidv4 = require('uuid/v4')

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const { mongoKey } = require('./config/keys');
const Mongo_URI = `mongodb+srv://joon:${mongoKey}@firstatlas-drwhc.mongodb.net/messages`;

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  }

});

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// socketio is using web socket protocol,
//  and therefore it does not affect http connection. 
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log('error in server.js', error);
    const status = error.statusCode || 500;
    const message = error.message;
    // because "error.data = errors.array();" in signup in auth controllers.
    // It is an array.
    const data = error.data;
    res.status(status).json({ message, data });
});

mongoose
  .connect(Mongo_URI, { useNewUrlParser: true })
  .then(() => {

    // Once database and http connections are established,
    // then at the environment of http, the web socket (channel) connection
    //  can be established.

    // Bear in mind again that http and web socket are different protocols but
    //  web socket is connected on the basis of http.
    console.log('Server is up!');
    const server = app.listen(8080);

    // 1) return function. 2) the server returned from app.listen()
    // must pass down to socket.io, as a parameter. 

    // by the way, the server contains not oly "emit" and "on" objects 
    //  that values on functions to be used for the socket io.
    // At this point, socket io has a role to open a channel 
    //  and push data to the clients, but doe not have a role to bring up the tools
    //  such as emit and on.

    // but also, "use", "request", "response", "set" and so on to be used 
    //  for the legacy http server.
    //  console.log(app.listen(8080))
    
    // 2) socketio initialization and running with express apps
    const io = require('./socketio').init(server);

    // 1) just for socketio initializtion
    // const io = require('socket.io')(server);
    io.on('connection', socket => {
      
      // the server keeps trying to listen to "connection" message. 
      // "connection" is a default message when the clients try to connect to a server.

      // If it listen to "connection" key word.
      //  it runs the callback function which has a parameter of "socket".
      // The socket contains server, client and channel information where socket is connected.

      // Then it pushes something to the connected clients without their request.
      // console.log('socket: ', socket)
      console.log('Client connected.');
    });
  })
  .catch(err => {
    console.log(err);
  });
