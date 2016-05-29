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

// MODULE VARS
var projectPrefix = "project-";

//TODO FILES + SORTING at table
function getProjectErrors(req, type) {
    var msgs = [];

    if (req.body.submitted) {
        if (typeof req.body[projectPrefix + 'name'] !== 'string' || req.body[projectPrefix + 'name'].trim().length === 0) {
            msgs.push("Name must be filled out");
        }

        if (isNaN(parseInt(req.body[projectPrefix + 'current_phase_id']))) {
            msgs.push("Phase must be selected");
        }

        if (typeof req.body[projectPrefix + 'street'] !== 'string' || req.body[projectPrefix + 'street'].trim().length === 0) {
            msgs.push("Street must be filled out");
        }

        if (typeof req.body[projectPrefix + 'city'] !== 'string' || req.body[projectPrefix + 'city'].trim().length === 0) {
            msgs.push("City must be filled out");
        }

        if (typeof req.body[projectPrefix + 'state'] !== 'string' || req.body[projectPrefix + 'state'].trim().length === 0) {
            msgs.push("State must be filled out");
        }

        if (typeof req.body[projectPrefix + 'zip'] !== 'string' || req.body[projectPrefix + 'zip'].trim().length === 0) {
            msgs.push("Zip must be filled out");
        }

        if (isNaN(parseInt(req.body[projectPrefix + 'manager_id']))) {
            msgs.push("Manager must be selected");
        }
    }

    return msgs;
}

router.all('/delete/:id', function (req, res, next) {
    var id = parseInt(req.params.id);
    global.dbDelete(global.DB_TABLE_PROJECTS, [{val: id}]);
    global.dbDelete(global.DB_TABLE_PROJECTS_PHASE_DATA, [{col: 'project_id', val: id}]);
    res.redirect('/projects/');
    res.end();
});

router.all('/edit/:id/get_errors', function (req, res, next) {
    global.preparePageData(req, res, next);
    var msgs = getProjectErrors(req, 'edit');
    var html = '';
    for (var i = 0; i < msgs.length; i++) {
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

router.all('/add/get_errors', function (req, res, next) {
    global.preparePageData(req, res, next);
    var msgs = getProjectErrors(req, 'edit');
    var html = '';
    for (var i = 0; i < msgs.length; i++) {
        html += sprintf('<p class="alert alert-danger" role="alert">%s</p>', msgs[i]);
    }

    var data = {
        req: req.body,
        html: html,
        submit: msgs.length === 0,
    };
    res.render('ajax/json', {data: data});
});

router.all('/add/get_fields', function (req, res, next) {
    global.preparePageData(req, res, next);

    var phaseId = parseInt(req.body.phaseId);

    var phaseFields = [];
    if (!isNaN(phaseId)) {
        phaseFields = tools.getCustomFields(
                global.DB_TABLE_PHASE_FIELDS,
                [{col: 'phase_id', val: phaseId}],
                global.FORM_PREFIX,
                'phase_field_id'
                );
        var data = {
            fields: tools.getNiceObject(phaseFields, 'phase_fields'),
            //fields: fields,
        };

        if (true) {
            console.log("---------------------/edit/:id/get_fields----------------------------");
            console.log("id", phaseId);
            console.log("phaseId", phaseId);
            console.log("data", data);
            console.log("---------------------END /edit/:id/get_fields----------------------------");
        }

        res.render('ajax/fields', data);
    } else {
        //console.log("Didn't find fields /edit/:id/get_fields");
        //console.log("REQUEST", req.body);
        res.render('ajax/jade', {content: '<p>Must select phase first</p>'});
    }
});

router.all('/add', function (req, res, next) {
    global.preparePageData(req, res, next);
    //found project load data
    var msgs = getProjectErrors(req, 'add');

    /**
     console.log("=======================================");
     console.log("req", Object.keys(req));
     console.log("=======================================");
     console.log("req.body", req.body);
     console.log("=======================================");
     console.log("req.file", req.file);
     console.log("=======================================");
     console.log("req.files", req.files);
     console.log("=======================================");
     **/

    if (req.body.submitted && msgs.length === 0) {
        //console.log("Add project");
        //edit then reload data
        var projectData = {};
        var phaseFieldsData = {};

        Object.keys(req.body).forEach(function (key) {
            if (key.indexOf(global.FORM_PREFIX) === 0) {
                //project phase fields data
                var k = parseInt(key.replace(global.FORM_PREFIX, ''));
                phaseFieldsData[k] = req.body[key];
            } else if (key.indexOf(projectPrefix) === 0) {
                //project data
                var k = key.replace(projectPrefix, '');
                switch (k) {
                    case "manager_id":
                    case "current_phase_id":
                        projectData[k] = parseInt(req.body[key]);
                        break;
                    default:
                        projectData[k] = req.body[key];
                        break;
                }
            }
        });

        //update project data
        var projectId = global.dbInsert(global.DB_TABLE_PROJECTS, projectData);

        //update phase fields data
        Object.keys(phaseFieldsData).forEach(function (key) {
            var phaseFieldId = key;
            var value = phaseFieldsData[key];
            var data = {
                project_id: projectId,
                phase_id: projectData.current_phase_id,
                phase_field_id: phaseFieldId,
                value: value,
            };
            global.dbInsert(global.DB_TABLE_PROJECTS_PHASE_DATA, data);
        });

        //update project media
        var i = 0;
        for (var key in req.files) {
            var media = req.files[key];
            if( media.filename.length === 0 ) {
                //error
            } else if (key.indexOf(global.FORM_PREFIX) !== -1) {
                var phaseFieldId = parseInt(key.replace(global.FORM_PREFIX, ''));
                var fileId = file.uploadFile(req.session.uid, 'project', projectId, null, media);
                var data = {
                    project_id: projectId,
                    phase_id: projectData.current_phase_id,
                    phase_field_id: phaseFieldId,
                    value: fileId,
                };
                var whereArgs = [
                    {col: 'project_id', val: id}, 
                    {col: 'phase_id', val: projectData.current_phase_id},
                    {col: 'phase_field_id', val: phaseFieldId}
                ];
                global.dbUpdateRow(global.DB_TABLE_PROJECTS_PHASE_DATA, data, whereArgs);
            } else {
                var caption = req.body.file_uploads[i].caption;
                file.uploadFile(req.session.uid, 'project', projectId, caption, media);
                i++;
            }
        }

        //redirect and die
        res.redirect(sprintf('/projects/edit/%d/', projectId));
        res.end();
    } else {
        console.log("ERROR REDIRECT");
        console.log("REQUEST", req.body);
        //prepare data for jade
        var allPhasesResults = global.dbSelect(global.DB_TABLE_PHASES);

        var data = {
            title: 'Add project',
            msgs: msgs,
            allPhases: tools.getRowsOfNiceObjects(allPhasesResults.rows, 'phases'),
            allUsers: tools.getRowsOfNiceObjects(global.dbSelect(global.DB_TABLE_USERS).rows, 'users'),
            projectPrefix: projectPrefix,
        };
        res.render('projects/add', data);
    }
});

router.all('/edit/:id/get_fields', function (req, res, next) {
    global.preparePageData(req, res, next);
    var id = parseInt(req.params.id);
    var phaseId = parseInt(req.body.phaseId);

    var project = {};
    var phaseFields = [];

    var whereProjArgs = [{col: 'id', val: id}];
    var queryResults = global.dbSelect(global.DB_TABLE_PROJECTS, '*', whereProjArgs);
    if (!isNaN(phaseId) && queryResults.rowCount === 1) {
        project = queryResults.rows[0];
        var projectPhaseData = global.dbSelect(global.DB_TABLE_PROJECTS_PHASE_DATA, '*', [{col: 'project_id', val: id}, {col: 'phase_id', val: phaseId}]).rows;
        phaseFields = tools.getCustomFields(
                global.DB_TABLE_PHASE_FIELDS,
                [{col: 'phase_id', val: phaseId}],
                global.FORM_PREFIX,
                'phase_field_id',
                projectPhaseData,
                null, null,
                'position'
        );
    } else {
        console.log("Didn't find fields /edit/:id/get_fields");
        console.log("id", id);
        console.log("REQUEST", req.body);
    }

    var fields = tools.getNiceObject(phaseFields, 'phase_fields');

    var data = {
        id: id,
        project: tools.getNiceObject(project, 'project'),
        table: global.DB_TABLE_PHASE_FIELDS,
        fields: fields,
        resource: 'project',
        resourceId: id,
    };

    //console.log("DATA", data);

    if (false) {
        console.log("---------------------/edit/:id/get_fields----------------------------");
        console.log("id", phaseId);
        console.log("phaseId", phaseId);
        console.log("data", data);
        console.log("---------------------END /edit/:id/get_fields----------------------------");
    }

    res.render('ajax/fields', data);
});

router.all('/edit/:id', function (req, res, next) {
    global.preparePageData(req, res, next);
    var id = parseInt(req.params.id);

    //on select change update current phase id for project
    if (!isNaN(req.body.project_current_phase_id)) {
        var projectCurrentPhaseId = parseInt(req.body.project_current_phase_id);
        global.dbUpdate(global.DB_TABLE_PROJECTS, {current_phase_id: projectCurrentPhaseId}, [{col: 'id', val: id}]);
    }
    //console.log("REQUEST", req.body, "FILES", req.files);
    var msgs = getProjectErrors(req, 'edit');
    var whereProjArgs = [{col: 'id', val: id}];
    var queryResults = global.dbSelect(global.DB_TABLE_PROJECTS, '*', whereProjArgs);
    if (queryResults.rowCount === 1) {
        //found project load data
        var project = queryResults.rows[0];

        if (req.body.submitted && msgs.length === 0) {
            //edit then reload data
            var projectData = {};
            var phaseFieldsData = {};
            Object.keys(req.body).forEach(function (key) {
                if (key.indexOf(global.FORM_PREFIX + 'media') === 0) {
                    //field uploaded media
                } else if (key.indexOf(global.FORM_PREFIX) === 0) {
                    //project phase fields data
                    var k = parseInt(key.replace(global.FORM_PREFIX, ''));
                    phaseFieldsData[k] = req.body[key];
                } else if (key.indexOf(projectPrefix) === 0) {
                    //project data
                    var k = key.replace(projectPrefix, '');
                    switch (k) {
                        case "manager_id":
                        case "current_phase_id":
                            projectData[k] = parseInt(req.body[key]);
                            break;
                        default:
                            projectData[k] = req.body[key];
                            break;
                    }
                }
            });

            //update project data
            global.dbUpdateRow(global.DB_TABLE_PROJECTS, projectData, whereProjArgs);
            //refresh project
            var project = global.dbSelect(global.DB_TABLE_PROJECTS, '*', whereProjArgs).rows[0];
            
            //update phase fields data
            Object.keys(phaseFieldsData).forEach(function (key) {
                var phaseFieldId = key;
                var value = phaseFieldsData[key];
                var data = {
                    project_id: id,
                    phase_id: project.current_phase_id,
                    phase_field_id: phaseFieldId,
                    value: value,
                };
                var whereArgs = [{col: 'project_id', val: id}, {col: 'phase_field_id', val: phaseFieldId}];
                global.dbUpdateRow(global.DB_TABLE_PROJECTS_PHASE_DATA, data, whereArgs);
            });

            //update project media
            var i = 0;
            for (var key in req.files) {
                var media = req.files[key];
                if( media.filename.length === 0 ) {
                    //error
                } else if (key.indexOf(global.FORM_PREFIX) !== -1) {
                    var phaseFieldId = parseInt(key.replace(global.FORM_PREFIX, ''));
                    var fileId = file.uploadFile(req.session.uid, 'project', project.id, null, media);
                    var data = {
                        project_id: id,
                        phase_id: project.current_phase_id,
                        phase_field_id: phaseFieldId,
                        value: fileId,
                    };
                    var whereArgs = [
                        {col: 'project_id', val: id}, 
                        {col: 'phase_id', val: project.current_phase_id},
                        {col: 'phase_field_id', val: phaseFieldId}
                    ];
                    global.dbUpdateRow(global.DB_TABLE_PROJECTS_PHASE_DATA, data, whereArgs);
                } else {
                    var caption = req.body.file_uploads[i].caption;
                    file.uploadFile(req.session.uid, 'project', project.id, caption, media);
                    i++;
                }
            }
        }

        //prepare data for jade
        var allPhasesResults = global.dbSelect(global.DB_TABLE_PHASES);

        var currentPhaseIndex = 0;
        for (var i = 0; i < allPhasesResults.rowCount; i++) {
            if (allPhasesResults.rows[i].id === project.current_phase_id) {
                currentPhaseIndex = i;
                break;
            }
        }

        //console.log("!!!!!!!!!!!!!DEBUG!!!!!!!!!!!!!!");
        //console.log("global.getWhereArgs([{val:[]}])", global.getWhereArgs([{val:[]}]));
        //console.log("global.dbselect([{val:[]}])", global.dbSelect('media', null, [{val:[]}]));
        var projectFiles = file.getProjectFiles(id);
        //console.log("PROJECT FILES", projectFiles);
        var fieldReportPhases = file.getProjectFieldReportsFiles(id);
        //console.log("fieldReportPhases", fieldReportPhases);
        //console.log("!!!!!!!!!!!!!END DEBUG!!!!!!!!!!!!!!");

        var data = {
            title: project.name,
            msgs: msgs,
            id: id,
            project: tools.getNiceObject(project, 'project'),
            currentPhaseIndex: currentPhaseIndex,
            projectFiles: projectFiles,
            fieldReportPhases: fieldReportPhases,
            allPhases: tools.getRowsOfNiceObjects(allPhasesResults.rows, 'phases'),
            allUsers: tools.getRowsOfNiceObjects(global.dbSelect(global.DB_TABLE_USERS).rows, 'users'),
            projectPrefix: projectPrefix,
        };
        //console.log("DATA", data);
        res.render('projects/edit', data);

    } else {
        console.log("-------------------------------");
        console.log(sprintf("PROJECT %d DOES NOT EXIST", id));
        console.log(queryResults);
        console.log("-------------------------------");

        res.redirect('/projects/');
        res.end();
    }
});

router.all('/get_list', function (req, res, next) {
    global.preparePageData(req, res, next);
    var paged = typeof req.body.paged === "undefined" ? 1 : parseInt(req.body.paged);
    var start = (paged - 1) * global.ROWS_PER_PAGE;
    var queryResults = global.dbSelect(global.DB_TABLE_PROJECTS, '*', null, start, global.ROWS_PER_PAGE);

    var projectIds = new Array();
    var clientIds = [];
    var clientInfo = {};
    var managerInfo = {};

    for (var i = 0; i < queryResults.rowCount; i++) {
        var project = queryResults.rows[i];
        projectIds.push(project.id);
        clientIds.push(project.client_id);
    }

    if (projectIds.length > 0) {
        var clientQueryResults = global.dbSelect(global.DB_TABLE_CLIENTS, '*', [{col: 'id', cmp: 'IN', val: clientIds}]);

        for (var index in tools.getRowsOfNiceObjects(clientQueryResults.rows, 'clients')) {
            var row = clientQueryResults.rows[index];
            clientInfo[row.id] = row;
        }
    }

    var data = {
        columns: queryResults.columns,
        rows: tools.getRowsOfNiceObjects(queryResults.rows, 'project'),
        clients: clientInfo,
        managers: managerInfo,
        foundRows: queryResults.rowCount,
        pageNum: paged
    };
    //console.log(data);
    res.render('projects/ajax/list', data);
});

router.all('/', function (req, res, next) {
    global.preparePageData(req, res, next);
    res.render('projects/table', {
        title: 'Projects',
        options: ['test', 'test2']
    });
    console.log("REQ.PATH" + req.path);
});

module.exports = router;