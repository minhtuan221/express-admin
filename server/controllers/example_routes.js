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


// Define routes.

//example route for a page name timline
router.get('/timeline',
  admin.permit('view timeline'),
  function(req, res) {
    res.render('timeline', { user: req.user });

  });

  //example route for a page name user wall
router.get('/userwall',
  admin.permit('view userwall'),
  function(req, res) {
    res.render('userwall', { user: req.user });
  });



module.exports = router;
