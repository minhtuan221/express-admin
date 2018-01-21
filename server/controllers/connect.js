var express = require('express');
var path = require('path');
var router = express.Router();
var request = require('request');
// var rp = require('request-promise');
var deferred = require('deferred');
var fs = require('fs');
var Q = require("q");

var admin = require(path.resolve(__dirname,'../../db','users.js'));

// example request an outside link/webpage
//GET example to facebook webpage
router.get('/facebook',
    admin.permit('view facebook'),
    function (req, res) {
    request.get({ url:'https://www.facebook.com/'},function(error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body);
        } else {
            return res.sendStatus(500);
        }
    });
});


module.exports = router
