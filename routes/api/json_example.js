/* global module, global */

var express = require('express');
var router = express.Router();
/* GET/POST project page. */
router.all('/', function (req, res, next) {
    var jadeData = {
        json: {test: [1,2,3,4], name: 'testing'},
        BASE_URL: req.get('host')//global.BASE_URL
    };
    
    if( req.xhr ) {
        //is ajax so debugging and display in actual template
        res.send(JSON.stringify(jadeData, null, '\t'));
    } else {
        //not ajax
        jadeData.request = req; //include here so that none circular reference
        res.render('ajax/json_example', jadeData);
    }
});

module.exports = router;