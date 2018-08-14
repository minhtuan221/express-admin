var path = require('path');
var express = require('express');
var router = express.Router();
var url = ['/monitor', '/account', '/config', '/aftype', '/secinfo', '/pool', '/pool-tplus', '/room', '/orsrule', '/navt0', '/distribution', '/pool-uttb', '/portfolio', '/margin', '/margin/defercall', '/margin/forcesell', '/margin/history'];
//setup for passport js
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require(path.resolve(__dirname,'../../db','index.js'));
var checklogin=db.users;
const { config } = require('../../config');
var { listpermit } = require('../../config');
const { createPermitTable, convertToPermitTable} = require('./labs')

var request = require('request');
var fs = require('fs');
const auth_api='https://auth-api.vndirect.com.vn/staff/auth';

const errorLog = require(path.resolve(__dirname,'../../','logger.js')).errorlog;
const successlog = require(path.resolve(__dirname,'../../','logger.js')).successlog;

// router.get(url, function (req, res) {
// 	res.set('content-type','text/html');
//     res.sendFile(path.resolve(__dirname, '../../', 'index.html'))
// })


// router.get('*',
// 	require('connect-ensure-login').ensureLoggedIn(),
// 	function (req, res) {
// 	res.set('content-type','text/html');
//     res.sendFile(path.resolve(__dirname, '../../', 'index.html'))
// });

const listPermit=[
//     'view accounts',
//     'view pools',
//     'view rules',
//     'view config',
//     'view pools t_plus',
//     'view tplus',
//     'view rooms',
//     'view aftype',
//     'view secinfo',
//     'view accounts tplus',
//     'view orsrules',
//     'view uttb',
//     'view account_margincall',
//     'view defer',
//     'view vars',
//     'view offset',
//     'view account_history',
//     'view liquidation',

//     'add defer',

//     'edit tplus',
//     'edit accounts_pool',
//     'edit accounts_room',
//     'edit config',
//     'edit accounts',
//     'edit pools',
//     'edit aftype',
//     'edit orsrules',
//     'edit rooms',
//     'edit monitor',
//     'edit rules',
//     'edit defer',
//     'edit ports',

//     'download pools',
//     'download rooms',
//     'download accounts',

//     'delete tplus',
//     'delete rooms',
//     'delete pools',
//     'delete orsrules',
//     'delete rules',
//     'delete defer',
    'admin',
  ];
// Define routes.

//basic landing page
router.get('/home',
  function(req, res) {
    res.render('home', { user: req.user });

  });

router.get('/login',
  function(req, res){
    res.render('login',{message:''});
  });

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    successlog.info(`{"log":"moadmin","hostname":"${req.hostname}","originalUrl":"${req.originalUrl}","username":"Try to login local","ip":"${req.ip}","method":"${req.method}", "body":{"username":${JSON.stringify(req.body.username)}} }`);
    res.redirect('/home');
  });

router.get('/logout',
  checklogin.ensureLoggedIn(),
  function(req, res){
    req.isAuthenticated=false;
    req.logout();
    res.redirect('/home');
  });

router.get('/profile',
  checklogin.ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user, message: req.query.message });
  });

router.post('/profile/:username',
  checklogin.ensureLoggedIn(),
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
  checklogin.ensureLoggedIn(),
  function(req, res){
    res.json(req.user);;
  });

router.get('/error',
  checklogin.ensureLoggedIn(),
  function(req, res){
    res.render('myerror', { message: req.query.message});
  });

router.get('/admin',
	checklogin.ensureLoggedIn(),
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
  checklogin.ensureLoggedIn(),
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
      // res.redirect('/error');
    }

  });

router.post('/admin/adduser',
  checklogin.ensureLoggedIn(),
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
  checklogin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
    // console.log(req.user.username+' va role la '+ req.user.role);
    // successlog.info(`Going to admin/roles page by: ${req.user.username}`);
    if(req.user.role==='admin'){
      // console.log(req.user);
      db.users.findAllRole('admin',function (error, myroles) {
        // body...
        myroles = convertToPermitTable(myroles)
        // console.log(myroles);
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
  checklogin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
      db.users.addNewRole(req.body.role,req.body.permission,function (error) {
        // body...
        console.log(error);
      });
      res.redirect('/admin/roles');

  });

router.get('/admin/roles/remove',
  checklogin.ensureLoggedIn(),
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
  checklogin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req,res){
      db.users.addNewRole(req.query.role,req.query.permit,function (error) {
        // body...
        console.log(error);
      });
      res.redirect('/admin/roles');
  });

router.get('/admin/resetpassword/:userid',
  checklogin.ensureLoggedIn(),
  db.users.permit('admin'),
  function (req,res) {
    // check matching user...
    var userid=req.params.userid;
      db.users.changePassword(userid,'123456',function (error,result) {
        // body...
        res.redirect('/admin');
      })
  });

// getting to main page
router.get('/',
	function (req, res) {
	res.render('home', { user: req.user });
});

router.get(url,
	checklogin.ensureLoggedIn('/home'),
	function (req, res) {
	res.set('content-type','text/html');
  res.render('index');
    // res.sendFile(path.resolve(__dirname, '../../', 'index.html'))
});

//auth iVND API
router.get('/loginvnd',
  function(req, res){
    res.render('loginvnd',{message: ''});
  });

// router.post('/loginvnd',
//   passport.authenticate('local', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/home');
//   });

router.post('/auth-api', function (req, res) {
    successlog.info(`{"log":"moadmin","hostname":"${req.hostname}","originalUrl":"${req.originalUrl}","username":"Try to loginvnd","ip":"${req.ip}","method":"${req.method}", "body":{"username":${JSON.stringify(req.body.username)}} }`);
    request.post({
        url: auth_api,
        json: {
          "username": req.body.username,
          "password": req.body.password
        }
    },function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // res.send(body);
            // console.log(body);
            //tim username sau khi co token
            db.users.findByUsername(req.body.username,function(error,user) {
              // body...
              if(user){
                req['user']=user;
                // console.log(user);
                req.login(user,function(error) {
                  console.log(error);
                });
                res.redirect('/account');
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
                res.render('loginvnd',{message:'Account verified! Please login again'})
              }
            })
        } else {
            console.log(error)
            return res.render('loginvnd',{message:'Wrong username or password'});
        }
    });
});

router.get('/admin/log',
  checklogin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req, res) {
    var logger=[]
    const logdir = '../db_moadmin/logs/';
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
  checklogin.ensureLoggedIn(),
  db.users.permit('admin'),
  function(req, res) {
    var logger = []
    const logdir = '../db_moadmin/logs/';
    var array = fs.readFileSync(logdir+req.params.logdate).toString().split("\n");
    for(let i in array) {
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
  // checklogin.ensureLoggedIn(),
  // db.users.permit('admin'),
  function(req, res) {
    var logger = [];
    const logdir = '../db_moadmin/logs/';
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
        for (let i in array) {
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
