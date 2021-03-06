'use strict';

require('dotenv').load();
const http = require('http'),
      path = require('path'),
      methods = require('methods'),
      express = require('express'),
      bodyParser = require('body-parser'),
      session = require('express-session'),
      cors = require('cors'),
      passport = require('passport'),
      errorhandler = require('errorhandler'),
      mongoose = require('mongoose'),
      multer = require('multer');

var multipart=require('connect-multiparty');
var methodOverride = require('method-override')

const isProduction = process.env.NODE_ENV === 'PRODUCTION';

// Create global app object
const app = express();

app.use(cors());

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(multipart());

app.use(require('method-override')());
app.use(express.static(__dirname + '/public'));

app.use(multer({dest:'./public/upload/temp'}).single('file'));

app.use(session({ secret: 'fit-chievements', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

if (!isProduction) {
  app.use(errorhandler());
}

if(isProduction){
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect('mongodb://localhost:27017/fit-chievements');
  mongoose.set('debug', true);
  mongoose.connection.once('open', function() {
    console.log(`Connected to mongoDB at  + ${process.env.MONGODB_URI}`)
  });
}

require('./models/User');
require('./models/Achievement');
require('./models/Comment');
require('./config/passport');

app.use(require('./routes'));

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
})

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function(err, req, res, next) {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({'errors': {
      message: err.message,
      error: err
    }});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'errors': {
    message: err.message,
    error: {}
  }});
});

// finally, let's start our server...
const server = app.listen( process.env.PORT || 3000, function(){
  console.log('Listening on port ' + server.address().port);
});

module.exports = server;
