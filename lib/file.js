/* global module, global, __dirname */

var sprintf = require('sprintf').sprintf;
var util = require('util');
var dateFormat = require('dateformat');
var fs = require('fs');

/**
 var imageMimeTypes = [
 'image/gif',
 'image/jpeg',
 'image/png',
 'application/x-shockwave-flash',
 'image/psd',
 'image/bmp',
 'image/tiff',
 'application/octet-stream',
 'image/jp2',
 'image/iff',
 'image/vnd.wap.wbmp',
 'image/xbm',
 'image/vnd.microsoft.icon',
 ];
 var audioMimeTypes = [
 'audio/aac',
 'audio/mp4',
 'audio/mpeg',
 'audio/ogg',
 'audio/wav',
 'audio/webm',
 ];
 var videoMimeTypes = [
 'video/mp4',
 'video/ogg',
 'video/webm',
 ];
 **/

/**
 * Returns array of all files inside directory
 * @param {type} dir
 * @returns {Array}
 */
function getAllFilesInDirectory(dir) {
    var fs = require('fs');
    var results = [];
    var list = [];

    if (typeof dir !== 'string') {
        return results;
    }

    try {
        var list = fs.readdirSync(dir);
    } catch (e) {
        //can't read directory don't throw and break error
        console.log("-----------ERROR getAllFilesInDirectory()--------------");
        console.log("dir", dir);
        console.log("Exception", e);
        console.log("-------------------------------------------------------");
    }

    list.forEach(function (file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFilesInDirectory(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

function getFilename(path) {
    var filename = path;
    if (path.indexOf('/') > 0) {
        filename = path.substr(path.lastIndexOf('/') + 1);
    }
    return filename;
}

function getFileBaseName(path) {
    path = getFilename(path);
    return path.substr(0, path.lastIndexOf('.'));
}

function getFileExtention(path) {
    path = getFilename(path);
    return path.substr(-1, path.lastIndexOf('.'));
}

function getFileTypeByExtention(path) {
    var extention = getFileExtention(path);
    var type;
    //TODO support none images
    switch (extention.toLowerCase()) {
        case "tif":
        case "tiff":
        case "gif":
        case "jpeg":
        case "jpg":
        case "jif":
        case "jfif":
        case "jp2":
        case "jpx":
        case "j2k":
        case "j2c":
        case "fpx":
        case "pcd":
        case "png":
        case "pdf":
            type = 'image';
            break;
        default:
            type = null;
            break;
    }
    return type;
}

function getProjectFiles(projectId){
    var project = {};
    var projectResult = global.dbSelect(global.DB_TABLE_PROJECTS, null, [{val: projectId}]);
    if (projectResult.rowCount === 1) {
        project = projectResult.rows[0];
    }
    return projectFiles = global.dbSelect(global.DB_TABLE_MEDIA, null, [{col: 'resource', val: 'project'}, {col: 'resource_id', val: project.id}]).rows;
}

function getProjectFieldReportsFiles(projectId){ 
    var fieldReports = {};
    var fieldReportResult = global.dbSelect(global.DB_TABLE_FIELD_REPORTS, null, [{col: 'project_id', val: projectId}]);
    if (fieldReportResult.rowCount === 1) {
        var fieldReport = fieldReportResult.rows[0];
        fieldReports[fieldReport.id] = fieldReport;
    }
    
    //load and prepare phases
    var phases = global.dbSelect(global.DB_TABLE_PHASES).rows;
    for(var i = 0; i < phases.length; i++ ){
        phases[i].fieldReports = [];
        phases[i].fieldReportIds = [];
        phases[i].fieldReportFiles = [];
    }
    
    var distinctFieldReportPhaseIds = [];
    var fieldReports = global.dbSelect(global.DB_TABLE_FIELD_REPORTS, null, [{col: 'project_id', val: projectId}]).rows;
    //console.log("FIELD REPORTS", fieldReports);
    for (var i = 0; i < fieldReports.length; i++) {
        if (distinctFieldReportPhaseIds.indexOf(fieldReports[i].phase_id) === -1) {
            distinctFieldReportPhaseIds.push(fieldReports[i].phase_id);
        }
        var phaseIndex = null;
        for( var j = 0; j < phases.length; j++){ 
            if( fieldReports[i].phase_id === phases[j].id ) {
                phaseIndex = j;
                break;
            }
        }
        if( phaseIndex !== null ) {
            phases[ phaseIndex ].fieldReports.push(fieldReports[i]);
            phases[ phaseIndex ].fieldReportIds.push(fieldReports[i].id);
        }
    }
    
    for(var i = 0; i < phases.length; i++ ){
        var ids = phases[i].fieldReportIds;
        //TODO debug why if ids = [] then out of memory...
        if( ids.length > 0 ) {
            phases[i].fieldReportFiles = global.dbSelect(
                global.DB_TABLE_MEDIA, null,
                [
                    {col: 'resource', val: 'field-report'},
                    {col: 'resource_id', val: ids}
                ]
            ).rows;
        }
    }
    return phases;
}

function getFieldReportFiles(fieldReportId){ 
    return global.dbSelect(global.DB_TABLE_MEDIA, null, [{col: 'resource', val: 'field-report'}, {col: 'resource_id', val: fieldReportId}]).rows;
}

/**
 * 
 * @param int uid
 * @param string resource
 * @param string caption
 * @param object fileObjRaw typically req.files.[NAME] {filename: '', mimetype: '', file: [PATH]}
 * @param string filename
 * @param string|null savePath
 * @returns {@var;userFolder|mocha_L11821.ROOT_PATH|Function.ROOT_PATH|String|mocha_L6405.ROOT_PATH}
 */
function uploadFile(uid, resource, resourceId, caption, fileObjRaw, filename, savePath, fieldCategory, fieldId) {
    var fileId = null;
    if (true) { 
        //TODO FIlter mimetypes?
        var user = {};

        var userResult = global.dbSelect(global.DB_TABLE_USERS, null, [{val: uid}]);
        if (userResult.rowCount === 1) {
            user = userResult.rows[0];
        }
        
        if (typeof filename !== 'string' || filename.length < 1) {
            filename = fileObjRaw.filename;
        }

        if (typeof savePath !== 'string' || savePath.length < 1) {
            var date = new Date();
            var userFolder = sprintf("/%s-%s/", uid, user.email);
            savePath = global.UPLOAD_PATH + dateFormat(date, "yyyy/mm/dd") + userFolder;
        }
        
        if ( typeof fieldCategory !== "string" ) {
            fieldCategory = null;
        }
        
        if ( typeof fieldId !== "number" && fieldId === parseInt(fieldId) ) { 
            fieldId = null;
        }

        //force unique filename
        var timestamp = new Date().getTime().toString();
        var uniqueFilename = sprintf("%s-%s", timestamp, filename);

        var fileObj = {
            //id
            resource: resource,
            resource_id: resourceId,
            type: fileObjRaw.mimetype,
            path: savePath,
            filename: filename,
            unique_filename: uniqueFilename,
            link: (savePath+uniqueFilename).replace(global.ROOT_PATH + 'public/', global.ROOT_URL),
            caption: caption,
            //uploaded timestamp
            uid: uid,
            field_category: fieldCategory,
            field_id: fieldId,
        };

        //upload file in database
        fileId = global.dbInsert(global.DB_TABLE_MEDIA, fileObj);
        //upload file to path
        fs.readFile(fileObjRaw.file, function (err, data) {
            var filePath = savePath + uniqueFilename;
            var parts = savePath.replace(global.UPLOAD_PATH, '').split('/');
            var currentPath = global.UPLOAD_PATH;
            for( var i = 0; i < parts.length; i++) {
                if( parts[i].length > 0 ) {
                    currentPath += parts[i] + '/';
                    if (!fs.existsSync(currentPath)){
                        fs.mkdirSync(currentPath);
                    }
                }
            }
            fs.writeFile(filePath, data, function (err) {
                if( err ) {
                    console.log("UPLOAD FILE ERROR", err);
                }
            });
        });
    }
    return fileId;
}

module.exports = {
    getAllFilesInDirectory: function (dir) {
        return getAllFilesInDirectory(dir);
    },
    getFilename: function (path) {
        return getFilename(path);
    },
    getFileBaseName: function (path) {
        return getFileBaseName(path);
    },
    getFileExtention: function (path) {
        return getFileExtention(path);
    },
    getFileTypeByName: function (path) {
        return getFileTypeByExtention(path);
    },
    uploadFile: function (uid, resource, resourceId, caption, fileObjRaw, filename, savePath) {
        return uploadFile(uid, resource, resourceId, caption, fileObjRaw, filename, savePath);
    },
    getProjectFiles: function(projectId){
        return getProjectFiles(projectId);
    },
    getProjectFieldReportsFiles: function(projectId){
        return getProjectFieldReportsFiles(projectId);
    },
    getFieldReportFiles: function(fieldReportId){
        return getFieldReportFiles(fieldReportId);
    },
};