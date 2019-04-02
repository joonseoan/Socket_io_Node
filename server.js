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
// for incomming data!!!! based on json.

// where the file is stored
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // pointing out the images folder in this project.
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    //     // when using OSX
    // cb(null, new Date().toISOString().replace(/:/g, '-')  + '-' + file.originalname);
    cb(null, uuidv4());
  }

});

// define image file extension.
const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(bodyParser.json());

// [uploading]
// define upload library
// Accept a single file with the name "fieldName."" 
// The single file will be stored in "req.file.""
// "image" : the request from the client contains the content-type: image.
//  whenever the client requests "image" on POST at any route, the file will be stroed as image.!!!!
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

// [downloading]
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    // Access-Control-Allow-Origin: set up that client allows cross origin resource sharing
    //  "*":  any clients or we can specify like "codepen.io"
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    // make the client set Content-Type and Authorization (to be discussed)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

// errors because of "next(e)"
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
    console.log('Server is up!');
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });
