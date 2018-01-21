var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var env       = process.env.NODE_ENV || 'development';

const bcrypt = require('bcrypt');
// var config    = require(__dirname + '/../config/config.js')[env];
// var db        = {};
const utf8 = require('utf8');

const {config,defaultUser} = require('../config');
var {listpermit } = require('../config');
var request = require('request');
var fs = require('fs');

const errorLog = require(path.resolve(__dirname,'../','logger.js')).errorlog;
const logger = require(path.resolve(__dirname,'../','logger.js')).successlog;

// if (config.use_env_variable) {
//   var sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   var sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

const sequelize = require('./index').sequelize;
const User = sequelize.define('users', {
  id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
  username: {type: Sequelize.STRING,unique: true},
  password: {type: Sequelize.STRING},
  displayName: {type:Sequelize.STRING},
  emails:{type:Sequelize.STRING},
  role:{type:Sequelize.STRING},
  // createAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
});

const Role = sequelize.define('roles', {
  id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
  role: {type: Sequelize.STRING},
  permission: {type: Sequelize.STRING},
  permissionID:{type:Sequelize.STRING,unique:true}
  // createAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
});

// User.sync();//create table from db. Use this code if you already have database
// Role.sync();//create table Roles from db. Use this code if you already have database
// create default user. user for first time running
User.sync()
.then(() => {
  // Table created
  return User.findOrCreate({
    where: {username: defaultUser.username}, 
    defaults: {
      password: defaultUser.password,
      displayName: defaultUser.displayName,
      emails: defaultUser.emails,
      role:'admin'
    }
  })
  .spread((user, created) => {
    console.log(user.get({
      plain: true
    }))
    console.log(created)
    /*
     In the example above, the "spread" on line 39 divides the array into its 2 parts and passes them as arguments to the callback function defined beginning at line 39, which treats them as "user" and "created" in this case. (So "user" will be the object from index 0 of the returned array and "created" will equal "true".)
    */
  })
});

// create default Role for first time running
Role.sync()
.then(() => {
  // Table created
  return Role.findOrCreate({
    where: {role: 'admin'}, 
    defaults: {
      permission: 'admin',
      permissionID: 'admin-admin'
    }
  })
  .spread((role, created) => {
    console.log(role.get({
      plain: true
    }))
    console.log(created)
    /*
     In the example above, the "spread" on line 39 divides the array into its 2 parts and passes them as arguments to the callback function defined beginning at line 39, which treats them as "user" and "created" in this case. (So "user" will be the object from index 0 of the returned array and "created" will equal "true".)
    */
  })
});

function uniqueArray( ar ) {
  var j = {};

  ar.forEach( function(v) {
    j[v+ '::' + typeof v] = v;
  });

  return Object.keys(j).map(function(v){
    return j[v];
  });
}

exports.findById = function(id, cb) {
  process.nextTick(function() {
    User.findOne({where: {id:id}}).then(user=>{
      // var idx = id - 1;
      if (user) {
        cb(null, user);
      } else {
        cb(new Error('User ' + id + ' does not exist'));
      }
    })
  });
}

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    User.findOne({ where: { username: username }}).then(user=>{
      if (user) {
      // console.log(user);
      return cb(null, user);
    } else {
      return cb(null, null);
    }
    })

  });
}

exports.signupNewUser=function (newusername,newrole,cb) {
  process.nextTick(function () {
    // body...
    bcrypt.hash(config.defaultValue, 10, function(err, hash) {
      User.bulkCreate([
        {
          username:newusername,
          password:hash,
          displayName: newusername,
          emails: newusername+config.defaultEmail,
          role:newrole
        }
      ]).then(()=>{
        cb(null,true);
      })
    });
  });
}

exports.findAllUser=function (role,cb) {
  process.nextTick(function () {
    // body...
    if(role==='admin'){
      User.findAll().then(users=>{
        return cb(null,users);
      })
    }else {
        return cb(null,'Permissions denied');
    }

  });
}

exports.changerole=function (userid,newrole,cb) {
  process.nextTick(function () {
    // body...
    if(userid!=0){
      User.update({ role:newrole},{ where: { id: userid } }).then(()=>{});
      return cb(null,'role updated');
    }else {
        return cb(null,'Permissions denied');
    }

  });
}

exports.changePassword=function (userid,newpassword,cb) {
  process.nextTick(function () {
    // body...
      let hash = bcrypt.hashSync(newpassword, 10);
      User.update({ password:hash},{ where: { id: userid } }).then(()=>{
        // send email to user here;
      });
      return cb(null,'password updated');
  });
}

exports.findUser=function(username,cb) {
  // body...
  User.findOne({ where: { username: username } }).then(user=>{
    if (user) {
      // console.log(user.id);
      return  user;
    } else {
      return 'failed';
    }
  });

}

exports.ensureLoggedIn=function(options) {
  if (typeof options == 'string') {
    options = { redirectTo: options }
  }
  options = options || {};

  var url = options.redirectTo || '/login';
  var setReturnTo = (options.setReturnTo === undefined) ? true : options.setReturnTo;

  return function(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      if (setReturnTo && req.session) {
        req.session.returnTo = req.originalUrl || req.url;//set url to session
      }
      return res.redirect(url);
    }
    next();
  }
}
// middleware for doing role-based permissions

exports.addNewRole=function (newrole,permission,cb) {
  process.nextTick(function () {
    // body...
    Role.bulkCreate([
      {
        role:newrole,
        permission:permission,
        permissionID:newrole+'-'+permission
      }
    ]).catch(error => {
      // Ooops, do some error-handling
      console.log(error);
    })
  });
}

exports.findPermitByRole=function (role,cb) {
  // body...
  process.nextTick(function () {
    // body...
    Role.findAll({
      where: { role: role },
      attributes: ['permission']
    }).then(pes=>{
      var result=[];
      for (var i = pes.length - 1; i >= 0; i--) {
        result.push(pes[i].permission);
      }
      // console.log(result);
      return cb(null,result);
    })
  });
}

exports.findOnlyRole=function (anything,cb) {
  // body...
  process.nextTick(function () {
    // body...
    Role.findAll({
      order:[['role','DESC']],
      attributes: ['role']
    }).then(roles=>{
      var result=[];
      for (var i = roles.length - 1; i >= 0; i--) {
        result.push(roles[i].role);
      }
      // console.log(uniqueArray(result));
      return cb(null,uniqueArray(result));
    })
  });
}

exports.destroyPermission=function (deleteRole,deletePes,cb) {
  // body...
  process.nextTick(function () {
    // body...

    Role.destroy({
      where: {
        role:deleteRole,
        permission:deletePes
      },
      // truncate: true,
      force:true
    }).catch(error => {
      // Ooops, do some error-handling
      console.log(error);
    });
  });
}


exports.findAllRole=function (newrole,cb) {
  process.nextTick(function () {
    // body...
    Role.findAll({order:[['role','ASC']]}).then(roles=>{
        var allroles=[];
        // console.log(roles);
        allroles.push({
              role:roles[0].role,
              permission:[]
            });
        allroles[0].permission.push(roles[0].permission);
        for (var i = 1; i<=roles.length-1; i++) {
          // var item=0;
          if(roles[i].role===roles[i-1].role){
            allroles[allroles.length-1].permission.push(roles[i].permission);
          }else{
            // item++;
            allroles.push({
              role:roles[i].role,
              permission:[]
            });
            allroles[allroles.length-1].permission.push(roles[i].permission);
          }
        }
        return cb(null,allroles);
      })
    .catch(error => {
      // Ooops, do some error-handling
      console.log(error);
    })
  });
}

exports.permit=function(allowed) {
  if(listpermit.indexOf(allowed) == -1){
    listpermit.push(allowed);
  }
  const isAllowed = function(checkpermit,allowed) {
    // body...
    // console.log(checkpermit);
    return checkpermit.indexOf(allowed) > -1 ? true:false;
  }

  // return a middleware
  return (req, res, next) => {
    var permissions=[];
    this.findPermitByRole(req.user.role,function(error,result) {
      // body...
      permissions=result;
      if (req.user && isAllowed(permissions,allowed)){
        logger.info(`{"log":"moadmin","hostname":"${req.hostname}","originalUrl":"${req.originalUrl}","username":"${req.user.username}","ip":"${req.ip}","method":"${req.method}","body":${JSON.stringify(req.body)} }`);
      next(); // role is allowed, so continue on the next middleware
    } else {

      // console.log(isAllowed(permissions,allowed)+' ' +allowed);
      res.set('Content-Type', 'text/html');
      res.status(403).send(`<!DOCTYPE html>
        <html><head><meta http-equiv="refresh" content="0; url=/error?message=You%20do%20not%20have%20the%20permission!!"></head></html>`);
      // res.redirect(403,'/error?message=' + encodeURIComponent('You do not have the permission!!'));
    }

    })

  }
}

// simple role code for no permission webpage
// exports.permit=function(allowed) {
//   const isAllowed = role => allowed.indexOf(role) > -1;

//   // return a middleware
//   return (req, res, next) => {
//     if (req.user && isAllowed(req.user.role))
//       next(); // role is allowed, so continue on the next middleware
//     else {
//       res.render('login',{message:'Forbidden action'});
//       // response.status(403).json({message: "Forbidden"}); // user is forbidden
//     }
//   }
// }
