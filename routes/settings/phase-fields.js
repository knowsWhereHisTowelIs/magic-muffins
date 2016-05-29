/* global module, global, users */

var express = require('express');
var router = express.Router();
var sprintf = require('sprintf').sprintf;

/********START MODULES*********/
var users = require(process.cwd() + '/lib/users.js');
var tools = require(global.ROOT_PATH + 'lib/tools.js');
/*********END MODULES*********/

function getErrors(req, type) {
    var msgs = [];
    
    if( req.body.submitted ) {
        
        if( isNaN(req.body[global.FORM_PREFIX + 'phase_id']) || global.dbSelect(global.DB_TABLE_PHASES, ' `id` ', [{val: parseInt(req.body[global.FORM_PREFIX + 'phase_id'])}]).rowCount !== 1 ) {
            msgs.push("Phase must be valid");
        }
        
        Object.keys(req.body).forEach(function(keyWithPrefix){
            var value = req.body[keyWithPrefix];
            var key = keyWithPrefix.replace(global.FORM_PREFIX, '');
            if( key.indexOf('_attributes') !== -1 ) {
                if( ! tools.isValidJson(value) ) {
                    msgs.push(sprintf("%s must be valid JSON", global.getKeyNiceName(key)));
                }
            } 
            //else if( key.indexOf('_tag') ) {
                //allow any tag
            //}
        });
        
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
    var queryResults = global.dbGetTableColumns(global.DB_TABLE_PHASE_FIELDS);
    var msgs = getErrors(req, 'add');
    
    var rows = [];
    for( var i = 0; i < queryResults.rowCount; i++) {
        var row = queryResults.rows[i];
        var key = row.Field;
        switch (key) {
            case "id":
                //ignore
                break;
            case "phase_id":
                var options = [];
                var phases = global.dbSelect(global.DB_TABLE_PHASES).rows;
                for(var i = 0; i < phases.length; i++ ){
                    options.push({
                        value: phases[i].id,
                        text: phases[i].phase,
                    });
                }
                row.selected = row.Default;
                row.options = options;
                rows.push(row);
                //ignore
                break;
            case "position":
                var options = [];
                var positions = global.dbSelect(global.DB_TABLE_PHASE_FIELDS, '`position`', [{col:'phase_id', val:fieldDataRaw.phase_id}], null, null, 'position').rows;
                for(var i = 0; i < positions.length; i++ ){
                    options.push({
                        value: positions[i].position,
                        text: positions[i].position,
                    });
                }
                fieldData[key] = {
                    selected: fieldDataRaw[key],
                    options: options,
                };
                break;
            default:
                //keep as raw
                rows.push( row );
                break;
        }
    };

    if ( req.body.submitted && msgs.length === 0 ) {
        var errors = [];
        var fieldObj = {};
        Object.keys(req.body).forEach(function (keyWithPrefix) {
            var val = req.body[keyWithPrefix];
            var key = keyWithPrefix.replace(global.FORM_PREFIX, '');
            if( keyWithPrefix !== 'submitted' && key !== 'submitted' ) {
                fieldObj[key] = val === "" ? null : val;
            }
        });
        
        var newestPosition = -1;
        var positions = global.dbSelect(global.DB_TABLE_PHASE_FIELDS, 'MAX(`position`) AS `max_pos`', [{col:'phase_id', val:fieldObj.phase_id}]);
        if( positions.rowCount === 1 ){
            newestPosition = positions.rows[0].max_pos + 1;
        }
        // update in memory new position
        fieldObj.position = newestPosition;

        if (errors.length === 0) {
            global.dbInsert(global.DB_TABLE_PHASE_FIELDS, fieldObj);
            msgs.push( sprintf("Successfully added %s", fieldObj.name) );
        } else {
            msgs.push( errors.join('<BR>') );
        }
    }
    
    var queryResults = global.dbGetTableColumns(global.DB_TABLE_PHASE_FIELDS);
    var fieldData = {};
    var fieldDataRaw = {};
    if (queryResults.rowCount > 0 ) {
        fieldDataRaw = queryResults.rows;
    }
    Object.keys(fieldDataRaw).forEach(function (index) {
        var row = fieldDataRaw[index];
        var key = row.Field;
        switch (key) {
            case "id":
                //ignore
                break;
            case "phase_id":
                var options = [];
                var phases = global.dbSelect(global.DB_TABLE_PHASES).rows;
                for(var i = 0; i < phases.length; i++ ){ 
                    options.push({
                        value: phases[i].id,
                        text: phases[i].phase,
                    });
                }
                fieldData[key] = {
                    selected: fieldDataRaw[key],
                    options: options,
                };
                //ignore
                break;
            default:
                //keep as raw
                fieldData[key] = null;
                break;
        }
    });

    var data = {
        msgs: msgs,
        fields: rows,
        fieldData: fieldData,
        submitValue: 'Add',
    };
    res.render('settings/phase-fields/add', data);
});

router.all('/delete/:id', function (req, res, next) {
    var id = parseInt(req.params.id);
    global.dbDelete(global.DB_TABLE_PHASE_FIELDS, [{col:'id', val:id}]);
    global.dbDelete(global.DB_TABLE_PROJECTS_PHASE_DATA, [{col:'phase_field_id', val:id}]);
    res.redirect('/settings/phase-fields/');
    res.end();
});

router.all('/edit/:id', function (req, res, next) {
    global.preparePageData(req, res, next);
    var id = parseInt(req.params.id);
    var msgs = getErrors(req, 'edit');
    
    var queryResults = global.dbSelect(global.DB_TABLE_PHASE_FIELDS, '*', [{col: 'id', val: id}]);

    if (queryResults.rowCount === 1) {
        var fieldDataRaw = {};
        if (queryResults.rowCount === 1) {
            fieldDataRaw = queryResults.rows[0];
        }
        
        //update data
        if (  req.body.submitted && msgs.length === 0 ) {
            var values = {};
            Object.keys(req.body).forEach(function(key){
                if( key.indexOf(global.FORM_PREFIX) === 0 ) {
                    var k = key.replace(global.FORM_PREFIX, '');
                    values[k] = req.body[key];
                }
            });
            var rowInNewPostion = {
                //current value
                position: fieldDataRaw.position,
            };
            //swap positions with existion row if exists
            global.dbUpdate(global.DB_TABLE_PHASE_FIELDS, rowInNewPostion, [{col: 'phase_id', val: fieldDataRaw.phase_id}, {col: 'position', val: values.position}]);
            // update in memory new position
            fieldDataRaw.position = values.position;
            
            global.dbUpdate(global.DB_TABLE_PHASE_FIELDS, values, [{col: 'id', val: id}]);
            msgs.push( sprintf("Successfully edited %s", values.name) );
        }

        //parse out current values
        var fieldData = {};
        Object.keys(fieldDataRaw).forEach(function (key) {
            switch (key) {
                case "id":
                    //ignore
                    break;
                case "phase_id":
                    var options = [];
                    var phases = global.dbSelect(global.DB_TABLE_PHASES).rows;
                    for(var i = 0; i < phases.length; i++ ){ 
                        options.push({
                            value: phases[i].id,
                            text: phases[i].phase,
                        });
                    }
                    fieldData[key] = {
                        selected: fieldDataRaw[key],
                        options: options,
                    };
                    //ignore
                    break;
                case "position":
                    var options = [];
                    var positions = global.dbSelect(global.DB_TABLE_PHASE_FIELDS, '`position`', [{col:'phase_id', val:fieldDataRaw.phase_id}], null, null, 'position').rows;
                    for(var i = 0; i < positions.length; i++ ){
                        options.push({
                            value: positions[i].position,
                            text: positions[i].position,
                        });
                    }
                    fieldData[key] = {
                        selected: fieldDataRaw[key],
                        options: options,
                    };
                    break;
                default:
                    //keep as raw
                    fieldData[key] = fieldDataRaw[key];
                    break;
            }
        });
        
        var allPhasesResults = global.dbSelect(global.DB_TABLE_PHASES);

        var data = {
            msgs: msgs,
            title: fieldData.name,
            fieldDataRaw: fieldDataRaw,
            fieldData: fieldData,
            allPhases: allPhasesResults.rows,
            deleteUrl: sprintf("/settings/phase-fields/delete/%d/", id),
            submitValue: 'Add',
        };
        //console.log(data);
        res.render('settings/phase-fields/edit', data);
    } else {
        res.redirect('/settings/phase-fields/');
        res.end();
    }
});

router.all('/get_list', function (req, res, next) {
    global.preparePageData(req, res, next);
    var paged = typeof req.body.paged === "undefined" ? 1 : parseInt(req.body.paged);
    var start = (paged - 1) * global.ROWS_PER_PAGE;
    console.log("HERE");
    var whereArgs = tools.getWhereArgsFromFormData(req.body.filterOptions);
    var queryResults = global.dbSelect(global.DB_TABLE_PHASE_FIELDS, '*', whereArgs, start, global.ROWS_PER_PAGE);
    
    var data = {
        columns: queryResults.columns,
        rows: queryResults.rows,
        foundRows: queryResults.rowCount,
        pageNum: paged
    };
//    console.log(data);
    res.render('settings/phase-fields/ajax/list', data);
});

router.all('/', function (req, res, next) {
    global.preparePageData(req, res, next);
    if (global.isRedirecting !== false) {
        var phases = global.dbSelect(global.DB_TABLE_PHASES);
        var data = {
            title: 'Phase Fields',
            phases: phases.rows,
        };
        res.render('settings/phase-fields/table', data);
    }
});

module.exports = router;

