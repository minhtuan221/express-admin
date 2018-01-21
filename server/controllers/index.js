var path = require('path');
var express = require('express');
var router = express.Router();
var admin = require(path.resolve(__dirname,'../../db','users.js'));

// var request = require('request');
// this router for login, home page and other common page
router.use('/', require('./routes'))

// the router's example for requesting to another server. In a multi-services structure, this router can be used to request to inside server that protected outside request by firewall
router.use('/connect',
    admin.ensureLoggedIn(),
    require('./connect'));

// the router's example for rendering page with ensure-logined and permisson
router.use('/',
    admin.ensureLoggedIn(),
    require('./example_routes'));

module.exports = router;
