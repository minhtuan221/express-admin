var path = require('path');
var express = require('express');
var router = express.Router();

//setup for database
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require(path.resolve(__dirname,'../../db','index.js'));
var admin=db.users;
const {config} = require('../../config');
var {listpermit } = require('../../config');

const { createPermitTable} = require('./lib')

var request = require('request');
var fs = require('fs');
const auth_api=config.auth_api;

const errorLog = require(path.resolve(__dirname,'../../','logger.js')).errorlog;
const successlog = require(path.resolve(__dirname,'../../','logger.js')).successlog;


// Define routes.

//basic landing page
router.get('/home',
  function(req, res) {
    res.render('home', { user: req.user });

  });

router.get('/index',
  admin.ensureLoggedIn(),
  admin.permit('guest'),
  function(req, res) {
    res.render('index', { user: req.user });

  });

router.get('/login',
  function(req, res){
    res.render('login', { user: req.user,message: req.query.message});
  });

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/login?message='+ encodeURIComponent('Wrong username or password') }),
  function(req, res) {
    successlog.info(`{"log":"admin","hostname":"${req.hostname}","originalUrl":"${req.originalUrl}","username":"Try to login local","ip":"${req.ip}","method":"${req.method}", "body":{"username":${JSON.stringify(req.body.username)}} }`);
    res.redirect('/index');
  });

router.get('/logout',
  admin.ensureLoggedIn(),
  function(req, res){
    req.isAuthenticated=false;
    req.logout();
    res.redirect('/home');
  });

router.get('/signup',
  function (req, res) {
    res.render('signup', { user: req.user, message: req.query.message });
  });

// signup code for example, not ready to use
router.post('/signup',
  function (req, res) {
    db.users.findByUsername(req.body.username, function (error, user) {
      // body...
      if (!user) {

        db.users.signupNewUser(req.body.username,config.normalUserRole, function (error, result) {
          // body...
          console.log(error);
          res.redirect('/home');
        });
      } else {
        res.redirect('/signup?message=' + encodeURIComponent('User already exist!!'));
      }
    })
  });

router.get('/profile',
  admin.ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user, message: req.query.message });
  });

router.post('/profile/:username',
  admin.ensureLoggedIn(),
  function (req,res) {
    // check matching user...
    var username=req.params.username;
    var newpassword=req.body.password;
    if (username===req.user.username && req.body.password===req.body.password2) {
      db.users.changePassword(req.user.id,newpassword,function (error,result) {
        // body...
        res.redirect('/profile?message=' + encodeURIComponent('Password updated!!'));
      })
    } else {
      res.redirect('/profile?message=' + encodeURIComponent('Confirm password not match or You do not have permission!!'));
    }

  });

router.get('/profile/userinfo',
  admin.ensureLoggedIn(),
  function(req, res){
    res.json(req.user); // example response with json
  });

router.get('/error',
  admin.ensureLoggedIn(),
  function(req, res){
    res.render('myerror', { user: req.user,message: req.query.message});
  });

router.get('/admin',
	admin.ensureLoggedIn(),
  db.users.permit('admin'),
	function(req,res){
    if(req.user.role==='admin'){
      // console.log(req.user);
      db.users.findAllUser('admin',function (error,users) {
        // body...
        db.users.findOnlyRole('anything',function (error,allowedRole) {
          // body...
          // console.log(allowedRole);
          res.render('admin',{ alluser: users,message:'', user: req.user,allowedRole:allowedRole });
        })
      });

    } else {
      res.redirect('/home');
    }

	});

router.get('/admin/changerole',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
    // console.log(req.user.username+' va role la '+ req.user.role);
    if(req.user.role==='admin'){
      db.users.changerole(req.query.id,req.query.role,function (error) {
        // body...
        res.redirect('/admin');
      });

    } else {
      res.redirect('/error?message=' + encodeURIComponent('You do not have permission!!'));
    }

  });

router.post('/admin/adduser',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
    // console.log(req.user.username+' va role la '+ req.user.role);
    db.users.findByUsername(req.body.username,function(error,user) {
      // body...
      if(!user){

        db.users.signupNewUser(req.body.username,req.body.role,function (error,result) {
        // body...
        console.log(error);
        res.redirect('/admin');
        });
      }else{
        res.redirect('/error?message=' + encodeURIComponent('User already exist!!'));
      }
    })

  });

router.get('/admin/roles',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
    // console.log(req.user.username+' va role la '+ req.user.role);
    // successlog.info(`Going to admin/roles page by: ${req.user.username}`);
    if(req.user.role==='admin'){
      // console.log(req.user);
      db.users.findAllRole('admin',function (error,myroles) {
        // body...
        res.render('roles', {
          allroles: myroles,
          message: '',
          user: req.user,
          listPermit: listpermit.sort(),
          permitTable: createPermitTable(listpermit),
        });
      });

    } else {
      res.redirect('/error?message=' + encodeURIComponent('You do not have permission!!'));
    }

  });

router.post('/admin/roles/add',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
      db.users.addNewRole(req.body.role,req.body.permission,function (error) {
        // body...
        console.log(error);
      });
      res.redirect('/admin/roles');

  });

router.get('/admin/roles/remove',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
      if (req.query.role!='admin') {
        db.users.destroyPermission(req.query.role,req.query.permit,function (error) {
          // body...
          console.log(error);
        });
      }
      res.redirect('/admin/roles');
  });

router.get('/admin/roles/addpermit',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
      db.users.addNewRole(req.query.role,req.query.permit,function (error) {
        // body...
        console.log(error);
      });
      res.redirect('/admin/roles');
  });

router.get('/admin/resetpassword/:userid',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function (req,res) {
    // check matching user...
    var userid=req.params.userid;
      db.users.changePassword(userid,config.defaultValue,function (error,result) {
        // body...
        res.redirect('/admin');
      })
  });

// getting to main page
router.get('/',
	function (req, res) {
	res.render('home', { user: req.user });
});

//authentication from API
router.get('/loginapi',
  function(req, res){
    res.render('loginapi', { user: req.user ,message: ''});
  });

// router.post('/loginapi',
//   passport.authenticate('local', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/home');
//   });

router.post('/auth-api', function (req, res) {
    successlog.info(`{"log":"admin","hostname":"${req.hostname}","originalUrl":"${req.originalUrl}","username":"Try to loginapi","ip":"${req.ip}","method":"${req.method}", "body":{"username":${JSON.stringify(req.body.username)}} }`);
    request.post({
        url: auth_api,
        json: {
          "username": req.body.username,
          "password": req.body.password
        }
    },function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // res.send(body); // send object contain token
            // find user when have token
            db.users.findByUsername(req.body.username,function(error,user) {
              // body...
              if(user){
                req['user']=user;
                // console.log(user);
                req.login(user,function(error) {
                  console.log(error);
                });
                res.redirect('/index');
              } else {
                db.users.signupNewUser(req.body.username,'guest',function (error) {
                  // body...
                  console.log(error);
                  db.users.findByUsername(req.body.username,function(error,user) {
                      req['user']=user;
                      req.login(user,function(error) {
                        console.log(error);
                      });
                   });
                })
                res.render('loginapi',{user:null,message:'Account verified! Please login again'})
              }
            })
        } else {
            // return res.sendStatus(500); or
          return res.render('loginapi', { user: req.user,message:'Wrong username or password'});
        }
    });
});

router.get('/admin/log',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req, res) {
    var logger=[]
    const logdir = config.winston_dir;
    fs.readdirSync(logdir).forEach(file => {
      var onefile={
        date: file.slice(0,10),
        file: file
      }
      logger.push(onefile);
    })
    return res.render('log',{ log: logger,message:'', user: req.user});
  });

router.get('/admin/log/:logdate',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req, res) {
    var logger = []
    const logdir = config.winston_dir+'/';
    var array = fs.readFileSync(logdir+req.params.logdate).toString().split("\n");
    for(i in array) {
      var timeVN=array[i].slice(11,24);
      var hourVN=Number(timeVN.slice(0,2))+7;
      timeVN=hourVN.toString()+'h'+timeVN.slice(3,12);
      var logbody=array[i].substring(32);
      var date=array[i].slice(0,24);
      try {
        logbody=JSON.parse(logbody);
        var onefile={
          date:date,
          timeVN:timeVN,
          body:logbody
        }
        logger.push(onefile);
      } catch (e) {
        continue;
      }
    }
    if (req.query.type!=null && req.query.type.toLowerCase()==='json') {
      // res.send(logger) if have ?type=json in parameters;
      return res.send(logger);
    }

    return res.render('log2', {
      log: logger,
      message: '',
      user: req.user
    });
  });

router.get('/admin/log/json/:logday',
  admin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req, res) {
    var logger = [];
    const logdir = config.winston_dir+'/';
    var logday=1;
    if (typeof req.params.logday===null) {
      return res.send("False parameters null => "+req.params.logday);
    } else if (typeof Number(req.params.logday)=='number' && Number(req.params.logday)>=1) {
      // console.log(Number(req.params.logday));
      logday=req.params.logday;
    } else {
      console.log((req.params.logday));
      return res.send("False parameters= "+req.params.logday);
    }

    var files=fs.readdirSync(logdir);
    files.sort().reverse();
    var filecount=0;
    // console.log(files);
    for (var file in files) {
      if (filecount<logday) {
        var array = fs.readFileSync(logdir + files[file]).toString().split("\n");
        array=array.reverse();
        for (i in array) {
          var timeVN = array[i].slice(11, 24);
          var hourVN = Number(timeVN.slice(0, 2)) + 7;
          timeVN = hourVN.toString() + 'h' + timeVN.slice(3, 12);
          var logbody = array[i].substring(32);
          var date = array[i].slice(0, 24);
          try {
            logbody = JSON.parse(logbody);
            var onefile = {
              date: date,
              timeVN: timeVN,
              body: logbody
            }
            logger.push(onefile);
          } catch (e) {
            continue;
          }
        }
        filecount++;
      }
    }

    if (req.query.type!=null && req.query.type.toLowerCase()==='json') {
      // res.send(logger) if have ?type=json in parameters;
      return res.send(logger);
    }

    return res.render('log2', {
      log: logger,
      message: '',
      user: req.user
    });
  });

module.exports = router;

//.replace(/"/g, "'")
// .replace(/'/g, '"')
//.replace(/\\/g, "\\")
