var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var env       = process.env.NODE_ENV || 'development';

const {config} = require('../config');
const db_dir = path.resolve(__dirname,'../'+config.db_dir);
// var config    = require(__dirname + '/../config/config.js')[env];
// var db        = {};

// if (config.use_env_variable) {
//   var sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   var sequelize = new Sequelize(config.database, config.username, config.password, config);
// }
exports.sequelize = new Sequelize('sqlite:'+config.db_dir+'/database.sqlite')
console.log('sqlite:'+db_dir+'/database.sqlite');

exports.users = require('./users');
