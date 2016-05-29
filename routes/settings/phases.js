/* global module, global, users */

var express = require('express');
var router = express.Router();
var sprintf = require('sprintf').sprintf;

/********START MODULES*********/
var users = require( process.cwd() + '/lib/users.js');
var tools = require(global.ROOT_PATH + 'lib/tools.js');
/*********END MODULES*********/


function getErrors(req, type) {
    var msgs = [];
    
    if( req.body.submitted ) {
        if( typeof req.body[global.FORM_PREFIX + 'name'] !== 'string' || req.body[global.FORM_PREFIX + 'name'].trim().length === 0 ) {
            msgs.push("Name must be filled out");
        }
        
        if( typeof req.body[global.FORM_PREFIX + 'phase'] !== 'string' || req.body[global.FORM_PREFIX + 'phase'].trim().length === 0 ) {
            msgs.push("Phase must be filled out");
        }
        
        if( req.body[global.FORM_PREFIX + 'next_phase_id'] ) {
            if( isNaN(req.body[global.FORM_PREFIX + 'next_phase_id']) || global.dbSelect(global.DB_TABLE_PHASES, ' `id` ', [{val: parseInt(req.body[global.FORM_PREFIX + 'next_phase_id'])}]).rowCount !== 1 ) {
                msgs.push("Next phase must be valid");
            }
        }
    }
    
    return msgs;
}

router.all('/add/get_errors', function (req, res, next) {
    global.preparePageData(req, res, next);
    var msgs = getErrors(req, 'edit');
    var html = '';
    for( var i = 0; i < msgs.length; i++ ){
        html += sprintf('<p class="alert alert-danger" role="alert">%s</p>', msgs[i]);
    }
    
    var data = {
        req: req.body,
        html: html,
        msgs: msgs,
        submit: msgs.length === 0,
    };
    res.render('ajax/json', {data: data});
});

router.all('/edit/:id/get_errors', function (req, res, next) {
    global.preparePageData(req, res, next);
    var msgs = getErrors(req, 'edit');
    var html = '';
    for( var i = 0; i < msgs.length; i++ ){
        html += sprintf('<p class="alert alert-danger" role="alert">%s</p>', msgs[i]);
    }
    
    var data = {
        req: req.body,
        html: html,
        msgs: msgs,
        submit: msgs.length === 0,
    };
    res.render('ajax/json', {data: data});
});

router.all('/add', function (req, res, next) {
    global.preparePageData(req, res, next);
    var queryResults = global.dbGetTableColumns(global.DB_TABLE_PHASES);
    var msgs = getErrors(req, 'add');

    if ( req.body.submitted && msgs.length === 0 ) {
        var errors = [];
        var fieldObj = {};
        Object.keys(req.body).forEach(function (keyWithPrefix) {
            if( keyWithPrefix.indexOf(global.FORM_PREFIX) === 0 ) {
                var val = req.body[keyWithPrefix];
                var key = keyWithPrefix.replace(global.FORM_PREFIX, '');

                fieldObj[key] = val === "" ? null : val;
            }
        });

        var phaseId = global.dbInsert(global.DB_TABLE_PHASES, fieldObj);
        //msg = sprintf("Successfully added %s", fieldObj.name);
    }
    
    var fields = [];
    for( var i = 0; i < queryResults.rowCount; i++ ) {
        switch(queryResults.rows[i].Field) {
            case "id":
            case "created":
                //ignore
                break;
            default:
                fields.push(queryResults.rows[i]);
                break;
        }
    }
    
    var otherPhases = global.dbSelect(global.DB_TABLE_PHASES).rows;
    var data = {
        msgs: msgs,
        fields: fields,
        otherPhases: tools.getRowsOfNiceObjects(otherPhases, 'phases'),
    };
//    console.log(data);
    res.render('settings/phases/add', data);
});

router.all('/delete/:id', function (req, res, next) {
    var id = parseInt( req.params.id );
    global.dbDelete(global.DB_TABLE_PHASES, [{val:id}]);
    global.dbDelete(global.DB_TABLE_PHASE_FIELDS, [{col:'phase_id', val:id}]);
    global.dbDelete(global.DB_TABLE_PROJECTS_PHASE_DATA, [{col:'phase_id', val:id}]);
    res.redirect('/settings/phases/');
    res.end();
});

router.all('/edit/:id/get_list', function (req, res, next) {
    global.preparePageData(req, res, next);
    var id = parseInt( req.params.id );
    var paged = typeof req.body.paged === "undefined" ? 1 : parseInt(req.body.paged);
    var start = (paged - 1) * global.ROWS_PER_PAGE;
    var queryResults = global.dbSelect(global.DB_TABLE_PHASES, '*', null, start, global.ROWS_PER_PAGE);
    
    var data = {
        columns: queryResults.columns,
        
        rows: tools.getRowsOfNiceObjects(queryResults.rows, 'phases'),
        
        foundRows: queryResults.rowCount,
        pageNum: paged
    };
//    console.log(data);
    res.render('settings/phases/ajax/list', data);
});

router.all('/edit/:id', function (req, res, next) {
    global.preparePageData(req, res, next);
    var id = parseInt( req.params.id );
    var queryResults = global.dbGetTableColumns(global.DB_TABLE_PHASES);
    var msgs = getErrors(req, 'add');
    var whereArgs = [{val: id}];
    if ( req.body.submitted && msgs.length === 0 ) {
        var errors = [];
        var fieldObj = {};
        Object.keys(req.body).forEach(function (keyWithPrefix) {
            if( keyWithPrefix.indexOf(global.FORM_PREFIX) === 0 ) {
                var val = req.body[keyWithPrefix];
                var key = keyWithPrefix.replace(global.FORM_PREFIX, '');

                fieldObj[key] = val === "" ? null : val;
            }
        });

        global.dbUpdateRow(global.DB_TABLE_PHASES, fieldObj, whereArgs);
        //msg = sprintf("Successfully added %s", fieldObj.name);
    }
    
    var queryResults = global.dbSelect(global.DB_TABLE_PHASES, '*', whereArgs);
    if (queryResults.rowCount === 1) {
        var phase = queryResults.rows[0];
        
        var otherPhases = global.dbSelect(global.DB_TABLE_PHASES, null, [{cmp: '!=', val: id}]).rows;
        var data = {
            msgs: msgs,
            phase: tools.getNiceObject(phase, 'phases'),
            otherPhases: tools.getRowsOfNiceObjects(otherPhases, 'phases'),
        };
        //console.log(data);
        res.render('settings/phases/edit', data);
    } else {
        res.redirect('/settings/phases/');
    }
});

router.all('/get_list', function (req, res, next) {
    global.preparePageData(req, res, next);
    var paged = typeof req.body.paged === "undefined" ? 1 : parseInt(req.body.paged);
    var start = (paged - 1) * global.ROWS_PER_PAGE;
    var queryResults = global.dbSelect(global.DB_TABLE_PHASES, '*', null, start, global.ROWS_PER_PAGE);
    
    var data = {
        columns: queryResults.columns,
        
        rows: queryResults.rows,
        
        foundRows: queryResults.rowCount,
        pageNum: paged
    };
//    console.log(data);
    res.render('settings/phases/ajax/list', data);
});

router.all('/', function (req, res, next) {
    global.preparePageData(req, res, next);
    if( global.isRedirecting !== false ) {
        var data = {
            title: 'Phases'
        };
        res.render('settings/phases/table', data);
    }
});

module.exports = router;
