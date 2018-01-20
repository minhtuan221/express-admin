const express = require('express')
const path = require('path')
const port = process.env.PORT || 8888
const app = express()
var bodyParser = require('body-parser');
var fs = require('fs')
var morgan = require('morgan');
const bcrypt = require('bcrypt');
const {config} = require('./config');
// serve static assets normally
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({'extended': 'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
var rfs = require('rotating-file-stream');
var db_dir=config.db_dir;
var dir = config.winston_dir;
if (!fs.existsSync(db_dir)){
    fs.mkdirSync(db_dir);
}

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

if (!fs.existsSync(config.morgan_dir)){
    fs.mkdirSync(config.morgan_dir);
}

// error log for checking=======================================================
// Configure view engine to render EJS templates (if use).

// Using the .html extension instead of
// having to name the views as *.ejs
app.engine('.html', require('ejs').__express);

app.set('views', __dirname + '/views');
app.set('view engine', 'html');


// extend for user login auth
//==============================================================================

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
var logDirectory = config.morgan_dir;
var now = new Date();
var logfile_name = now.getFullYear() + "-"+ (now.getMonth()+1).toString() + "-" + now.getDate() +'-morgan.log';

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = rfs(logfile_name, {
  interval: '1d', // rotate daily
  path: logDirectory,
  rotationTime:true
})

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))



app.use(require('cookie-parser')());
// app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'this is secret', resave: false, saveUninitialized: false }));

var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
// Step 1:pass port su dung 1 ham de tim user, password
passport.use(new Strategy(
  function(username, password, cb) { //cb = callback function
    db.users.findByUsername(username, function(err, user) { //find by username, can replace by email
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }// if user not exist return false gui lai
      bcrypt.compare(password, user.password, function(err, result) {
      if(result) {
         // Passwords match
         return cb(null, user);
        } else {
         // Passwords don't match
        // console.log(user.password+' and '+password+' and the result='+result);
         return cb(null, false);
        }
      });
    });
  }));

// test hashing password
app.get('/gethash/:password',
  function(req, res){
    bcrypt.hash(req.params.password, 10, function(err, hash) {

      res.render('myerror', { message: hash });
    });
  });
app.get('/gethash/:password/:hash',
  function(req, res){
    bcrypt.compare(req.params.password, req.params.hash, function(err, result) {
      if(result) {
         // Passwords match
         res.render('myerror', { message: 'password match with hash:'+req.params.hash+' and result:'+result });
        } else {
         // Passwords don't match
         res.render('myerror', { message: 'password not match with hash:' + req.params.hash });
        }
      });
  });
// Configure Passport authenticated session persistence.
//step2: passport chuyen user.id vao session
passport.serializeUser(function(user, cb) {
  cb(null, user.id);//send user.id to next
});

//step3: passport lay thong tin user qua user.id
passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);//find user.id in session and return user object contain user information and assit to req.user de get data
  });
});

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

//=======================================================
// routes ======================================================================
app.use(require('./server/controllers'));
// error handler use in production
// In UAT, should make it be comment
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('myerror');
});

app.listen(port)
console.log("server started on port " + port)
