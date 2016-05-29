/* global module, global */


var sprintf = require('sprintf').sprintf;
var util = require('util');
var dateFormat = require('dateformat');

/**
 * Bunch of useful funcs
 */

function jsonDecodeForceObject(str) {
    var ret = {};
    try {
        ret = JSON.parse(str);
    } catch (e) {
        //not json
    }
    if (typeof ret !== 'object') {
        var obj = {value: ret};
        ret = obj;
    } else if (ret === null) {
        ret = {};
    }

    return ret;
}

function forceValidDate(str) {
    var ret;
    try {
        ret = new Date(str);
    } catch (e) {
        ret = new Date("NOW");
    }
    return ret;
}

function getColumnTypes(type) {
    var columnTypes = {};
    //note fields of type string are ignored b/c default is same as string type
    switch (type) {
        case "clients":
            columnTypes = {
                id: 'int',
                //first: 'string',
                //middle: 'string',
                //last: 'string',
                //street: 'string',
                //city: 'string',
                //country: 'string',
                //email: 'string',
                //phone1: 'string',
                //phone2: 'string',
            };
            break;
        case "field_report":
            columnTypes = {
                id: 'int',
                project_id: 'int',
                uid: 'int',
                phase_id: 'int',
                //notes: 'string',
                //customer: 'string',
                date: 'date',
                time: 'time',
                //weather: 'string',
                built_before_1978: 'checkbox',
                //address: 'string',
                //city: 'string',
                //state: 'string',
                //zip: 'string',
                //insurance_company: 'string',
                //claim_num: 'string',
                owner_sign_lead_pamphlet: 'checkbox',
                customer_present: 'checkbox',
            };
            break;
        case "field_report_data":
            columnTypes = {
                id: 'int',
                field_report_id: 'int',
                phase_field_id: 'int',
                field_report_field_id: 'int',
                //value: 'string',
            };
            break;
        case "field_report_fields":
            columnTypes = {
                id: 'int',
                phase_id: 'int',
                //name: 'string',
                //description: 'string',
                //tips: 'string',
                //pre_container: 'string',
                //pre_container_attributes: 'string',
                //post_container_tag: 'string',
                //post_container_attributes: 'string',
                //before_field_label_tag: 'string',
                //before_field_label_attributes: 'string',
                //before_field_label_text: 'string',
                //field_container_tag: 'string',
                //field_tag: 'string',
                //field_attributes: 'string',
            };
            break;
        case "media":
            columnTypes = {
                id: 'int',
            };
            break;
        case "phases":
            columnTypes = {
                id: 'int',
                next_phase_id: 'int',
                created: 'datetime',
            };
            break;
        case "phase_fields":
            columnTypes = {
                id: 'int',
                phase_id: 'int',
            };
            break;
        case "project":
            columnTypes = {
                id: 'int',
                //name: 'string',
                current_phase_id: 'int',
                //type: 'string',
                //city: 'string',
                //state: 'string',
                client_id: 'int',
                manager_id: 'int',
                //street: 'string',
                //zip: 'string',
                //description: 'string',
            };
            break;
        case "project_phase_data":
            columnTypes = {
                id: 'int',
                project_id: 'int',
                phase_id: 'int',
                phase_field_id: 'int',
            };
            break;
        case "settings":
            columnTypes = {
                id: 'int',
            };
            break;
        case "users":
            columnTypes = {
                id: 'int',
            };
            break;
    }
    return columnTypes;
}

function getValueByType(type, valueRaw) {
    if( false ) {
        console.log("------------------getValueByType()------------------");
        console.log("type", type);
        console.log("valueRaw", valueRaw);
        console.log("------------------END getValueByType()------------------");
    }
    var value = valueRaw;
    switch (type) {
        case "datetime":
            var date = forceValidDate(valueRaw);
            value = dateFormat(date, "isoDateTime");
            break;
        case "date":
            var date = forceValidDate(valueRaw);
            value = dateFormat(date, "yyyy-mm-dd");
            break;
        case "time":
            if (!valueRaw.match(/^\d{2,}:(?:[0-5]\d):(?:[0-5]\d)$/)) {
                value = dateFormat(new Date(), "HH:MM:ss");
            }
            break;
        case "boolean":
            if (isNaN(valueRaw)) {
                value = false;
            } else {
                value = parseInt(valueRaw) === 1 ? true : false;
            }
            break;
        case "checkbox":
            if (typeof (valueRaw) !== 'object') {
                var checked = false;
                if (!isNaN(valueRaw)) {
                    checked = parseInt(valueRaw) === 1 ? true : false;
                }
                value = {type: 'checkbox', value: 1};
                if (checked) {
                    value.checked = "checked";
                }
            }
            break;
        //case "select":
        //    break;
        case "int":
            if (isNaN(valueRaw) || valueRaw === null) {
                value = -1;
            } else {
                value = parseInt(valueRaw);
            }
            break;
        case "decimal":
            if (isNaN(valueRaw) || valueRaw === null) {
                value = -1.0;
            } else {
                value = parseFloat(valueRaw);
            }
            break;
        case "object":
            if (typeof valueRaw !== 'object') {
                value = jsonDecodeForceObject(valueRaw);
            } else {
                // don't touch
            }
            break;
        case "textarea":
        case "string":
        default:
            if (valueRaw === null || valueRaw === undefined) {
                value = '';
            } else {
                // keep origonal
            }
            break;
    }
    return value;
}

function getNiceObject(obj, type) {
    var columnTypes = getColumnTypes(type);
    var columns = Object.keys(columnTypes);
    var keys = Object.keys(obj);
    
    for (var i = 0; i < keys.length; i++) {
        var value = obj[keys[i]];
        var colType = null;
        for(var j = 0; j < columns.length; j++) {
            if( keys[i] === columns[j] ) {
                colType = columnTypes[ columns[j] ];
            }
        }
        
        //console.log("------------------------------------");
        //console.log("type", type);
        //console.log("value", value);
        //console.log("key", keys[i]);
        //console.log("objRaw", obj[keys[i]]);
        //console.log("isNaN?", isNaN(value), parseInt(null));
        obj[keys[i]] = getValueByType(colType, value);
        //console.log("objAfter", obj[keys[i]]);
    }
    
    if ( type.indexOf('field') !== -1 ) {
        for (var i = 0; i < obj.length; i++) {
            if (obj[i].field_attributes.type === 'file') {
                obj[i].isFileType = true;
                var mediaId = obj[i].value;
                var result = global.dbSelect(global.DB_TABLE_MEDIA, "*", [{val: mediaId}]);
                obj[i].fileInfo = {};
                //console.log(result);
                if (result.rowCount === 1) {
                    console.log("ROWS", result.rows[0]);
                    obj[i].fileInfo = result.rows[0];
                } else {
                    console.log("OBJ[", i, "]", obj[i]);
                    console.log("MEDIA ID", mediaId);
                }
                obj[i].value = undefined;
                //console.log("I", i, "OBJ", obj[i]);
            }
        }
    }
    
    if( false ) {
        console.log("------------------getNiceObject()------------------");
        console.log("obj", obj);
        console.log("type", type);
        console.log("columnTypes", columnTypes);
        console.log("columns", columns);
        console.log("keys", keys);
        console.log("------------------END getNiceObject()------------------");
    }
    
    return obj; 
}

function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Takes form data from ajax submit and returns whereArgs to be used as a filter
 * @param Object filterOptions
 * @returns array whereArgs
 */
function getWhereArgsFromFormData(filterOptions){
    var whereArgs = [];
    console.log("getWhereArgsFromFormData FILTER OPTIONS", filterOptions, typeof filterOptions);
    if ( typeof filterOptions === "object" ) {
        var tmpObj = {};
        for( var i = 0; i < filterOptions.length; i++ ) {
            if ( typeof filterOptions[i].name === 'undefined' || typeof filterOptions[i].value === 'undefined' ) {
                continue;
            } else if ( typeof tmpObj[ filterOptions[i].name ] === 'object' ) {
                tmpObj[ filterOptions[i].name ].push(filterOptions[i].value);
            } else {
                tmpObj[ filterOptions[i].name ] = [ filterOptions[i].value ];
            }
        }
        
        var keys = Object.keys(tmpObj);
        for( var i = 0; i < keys.length; i++ ) {
            var value = null;
            if ( tmpObj[ keys[i] ].length === 1 ) {
                value = tmpObj[ keys[i] ][0];
            } else if ( tmpObj[ keys[i] ].length > 1 ) {
                value = tmpObj[ keys[i] ];
            }
            var rowArgs = {
                col: keys[i],
                val: value,
            };
            whereArgs.push( rowArgs );
        }
    }
    return whereArgs;
}

module.exports = {
    jsonDecodeForceObject: function (str) {
        return jsonDecodeForceObject(str);
    },
    getAllUsers: function () {
        var users = {};
        var usersResult = global.dbSelect(global.DB_TABLE_USERS);
        for (var i = 0; i < usersResult.rowCount; i++) {
            var user = usersResult.rows[i];
            users[user.id] = user;
        }
        return users;
    },
    getAllPhases: function () {
        var phases = {};
        var phasesResult = global.dbSelect(global.DB_TABLE_PHASES);
        for (var i = 0; i < phasesResult.rowCount; i++) {
            var phase = phasesResult.rows[i];
            phases[phase.id] = phase;
        }
        return phases;
    },
    getColumnTypes: function (type) {
        return getColumnTypes(type);
    },
    getValueByType: function(type, valueRaw) {
        return getValueByType(type, valueRaw);
    },
    /**
     * 
     * @param {type} obj
     * @param String columnTypes 
     * @returns {undefined}formats an object for front end use
     */
    getNiceObject: function (obj, type) {
        return getNiceObject(obj, type);
    },
    getRowsOfNiceObjects: function(objs, type) {
        var niceObjs = [];
        for( var i = 0; i < objs.length; i++) {
            niceObjs.push( getNiceObject(objs[i], type) );
        }
        return niceObjs;
    },
    /**
     * 
     * @param String table
     * @param Array of objects whereArgs
     * @param String prefix
     * @param String fieldsIdKey ex `field_report_data` is `field_report_field_id`
     * @param Array of Objects values [{valuesIdKey: 'field_id', valuesValueKey: value}]
     *      Generally dbSelect(fieldsDataTable, null, whereArgs, ...).rows
     * @param String valuesIdKey
     * @param String valuesValueKey
     * @param String orderKey
     * @param String orderDirection
     * @return array
     */
    getCustomFields: function (table, whereArgs, prefix, fieldsIdKey, values, valuesIdKey, valuesValueKey, orderKey, orderDirection) {
        if (typeof prefix !== 'string') {
            prefix = global.FORM_PREFIX;
        }

        if (!fieldsIdKey) {
            fieldsIdKey = 'id';
        }

        if (!util.isArray(values)) {
            values = [];
        }

        if (!valuesIdKey) {
            valuesIdKey = 'id';
        }

        if (!valuesValueKey) {
            valuesValueKey = 'value';
        }
        
        if( !orderKey ) {
            orderKey = null;
        }
        
        if( !orderDirection ) {
            orderDirection = null;
        }

        var queryResults = global.dbSelect(table, null, whereArgs, null, null, orderKey, orderDirection);
        /**if (true) {
            console.log("--------------getCustomFields()---------------------");
            console.log("--------------getCustomFields()---------------------");
            console.log("table", table);
            console.log("whereArgs", whereArgs);
            console.log("prefix", prefix);
            console.log("fieldsIdKey", fieldsIdKey);
            console.log("values", values);
            console.log("valuesIdKey", valuesIdKey);
            console.log("valuesValueKey", valuesValueKey);
            console.log("QueryResults", queryResults);
            console.log("---------------------------------------------------");
            console.log("---------------------------------------------------");
        }**/

        for (var i = 0; i < queryResults.rowCount; i++) {
            for (var j = 0; j < queryResults.columns.length; j++) {
                var key = queryResults.columns[j];
                switch (key) {
                    case "options":
                        var options = jsonDecodeForceObject(queryResults.rows[i][key]);
                        if (!util.isArray(options)) {
                            queryResults.rows[i].options = [];
                        } else {
                            queryResults.rows[i].options = options;
                        }
                        break;
                    default:
                        if (key.indexOf('_attributes') >= 0) {
                            queryResults.rows[i][key] = jsonDecodeForceObject(queryResults.rows[i][key]);
                        } else if (queryResults.rows[i][key] === null || queryResults.rows[i][key] === undefined) {
                            if (key.indexOf('_tag') >= 0) {
                                queryResults.rows[i][key] = 'div';
                            } else {
                                queryResults.rows[i][key] = '';
                            }
                        } else {
                            //leave as default
                        }
                        break;
                }
            }

            //set value
            var val = undefined;
            for (var j = 0; j < values.length; j++) {
                if (values[j][fieldsIdKey] === queryResults.rows[i][valuesIdKey]) {
                    val = values[j][valuesValueKey];
                    break;
                }
            }
            var defaultVal = queryResults.rows[i].default;
            queryResults.rows[i].value = (val === undefined) ? defaultVal : val;

            //set default values based on tag type
            switch (queryResults.rows[i].field_tag.trim().toLowerCase()) {
                case "textarea":
                    queryResults.rows[i].field_text = queryResults.rows[i].value;
                    break;
                case "select":
                    // do nothing
                    break;
                case "input":
                default:
                    queryResults.rows[i].field_attributes.value = queryResults.rows[i].value;
                    break;
            }
            //set html name
            queryResults.rows[i].field_attributes.name = prefix + queryResults.rows[i].id;
        }
        return queryResults.rows;
    },
    isValidJson: function(str){ 
        return isValidJson(str);
    },
    getWhereArgsFromFormData: function(filterOptions) {
        return getWhereArgsFromFormData(filterOptions);
    }
};