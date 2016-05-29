/* global module, global */

var express = require('express');

//FOR FILE UPLOADS
var multer = require('multer');
var upload = multer({dest: './tmp/'});

var router = express.Router();
var sprintf = require('sprintf').sprintf;
var util = require('util');

var tools = require(global.ROOT_PATH + 'lib/tools.js');
var file = require(global.ROOT_PATH + 'lib/file.js');

router.all('/field-get-media/:id', function(req, res, next) {
    global.preparePageData(req, res, next);
    
    var mediaId = parseInt(req.params.id);
    var results = global.dbSelect(global.DB_TABLE_MEDIA, null, [{col:'id', val:mediaId}]);
    
    var media = {};
    if ( results.rowCount === 1 ) {
        media = results.rows[0];
    }
    
    var mediaAttrs = {};
    var keys = Object.keys(media);
    for( var i in keys ) {
        var key = keys[i];
        mediaAttrs['data-' + key] = media[key];
    }
    
    var data = {
        media: media,
        mediaAttrs: mediaAttrs
    };
    console.log("HERE", req.body, data);
    res.render('ajax/media/uploaded', data);
});

router.all('/field-uploads/', function(req, res, next) {
    global.preparePageData(req, res, next);
    //console.log("BODY", req.body, "FILES", req.files);
    var data = {
        successfullyUploaded: [],
        errored: [],
        errorMsgs: [],
    };
    
    var resource = req.body.resource;
    var resourceId = req.body.resourceId;
    var fieldCategory = req.body.fieldCategory;
    
    for(var key in req.files) {
        var media = req.files[key];
        var fieldId = null;
        var matches = key.match(/[^[\]]+(?=])/g);
        if( matches.length === 1 && isNaN(matches[0]) ) {
            fieldId = parseInt(matches[0]);
        }
        
        var caption = null;
        //console.log("MEDIA UPLOAD", req.session.uid, resource, resourceId, caption, key, media, "\n\n");
        var fileId = file.uploadFile(req.session.uid, resource, resourceId, caption, media, null, null, fieldCategory, fieldId);
        data.successfullyUploaded.push(fileId);
    }
    //console.log(data);
    
    res.render('ajax/json', {
        data: data
    });
});

router.all('/', function (req, res, next) {
    global.preparePageData(req, res, next);
    res.render('ajax/json', {
        data: null
    });
});

module.exports = router;