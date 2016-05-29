
/* global global */

var sprintf = require('sprintf').sprintf;
var util = require('util');

/**
 * NOT Event driven. waits for query to complete before return
 * @param {type} query
 * @param {type} args fields to replace '?'
 * @returns {global.queryDb.result}
 */
global.queryDb = function (query, args) {
    var result = {
        rows: [],
        error: false,
        errorMsg: null,
        columns: [],
        query: query,
        args: args,
    };
    var isFinished = false;
    
    if( ! util.isArray(args) ) {
        args = [];// invalid so fill with empty
    }
    
    if( global.dbDebug ) {
        console.log("---------queryDb-----------");
        console.log("QUERY:", query);
        console.log("ARGS:", args);
    }

    global.db.query(query, args, function (err, rows) {
        if (err) {
            console.log("---------SQL ERROR-----------");
            console.log("QUERY:", query);
            console.log("ARGS:", args);
            console.log("ERROR:", err);
            //console.trace("Calls to db.query");
            console.log("------ERROR----->");
            throw err;
            isFinished = true;
        } else {
            result.rows = rows;
            isFinished = true;
        }
        isFinished = true;
    });
    
    while (!isFinished) { //force syncronized action
        require('deasync').runLoopOnce();
    }
    
    if( result.rows.length > 0 ) {
        var keys = Object.keys(result.rows[0]);
        
        for( var i = 0; i < keys.length; i++) {
           result.columns.push(keys[i]);
        }
    }
    
    return result;
};

/**
 * Query must use SQL_CALC_FOUND_ROWS
 * @param {type} query SELECT SQL_CALC_FOUND_ROWS * FROM `test` LIMIT 0, 5
 * @returns dataset + #of rows regardless of pagination
 */
global.queryDbCountRows = function(query, args) {
    var results = global.queryDb(query, args);
    var countResults = global.queryDb("SELECT FOUND_ROWS() as `total`;");
    
    results.debug = countResults;
    results.rowCount = -1;
    if( countResults.error === false && countResults.rows.length === 1 ) {
        results.rowCount = countResults.rows[0].total;
    }
    return results;
};

/**
 * 
 * @param String table
 * @param Object obj
 * @returns {undefined}
 */
global.dbInsert = function(table, obj) {
    var columns = [];
    var placeholders = [];
    var fields = [];
    
    Object.keys(obj).forEach(function(key){
        columns.push( sprintf("`%s`", key) );
        if( typeof obj[key] === 'string' ) {
            fields.push( obj[key].trim() );
        } else {
            fields.push(obj[key]);
        }
        placeholders.push('?');
    });
    
    var query = sprintf("INSERT INTO `%s` ( %s ) VALUES ( %s );", table, columns.join(', '), placeholders.join(', '));
    
    if( global.dbDebug ) {
        console.log("----------INSERT-------------");
        console.log(query);
        console.log(columns);
        console.log(fields);
        console.log(placeholders);
        console.log("----------END INSERT-------------");
    }
    
    var result = global.queryDb(query, fields);
    var insertId = result.rows.insertId;
    return insertId;
};

/**
 * 
 * @param String table
 * @param Array of objects where
 * @returns {undefined}
 */
global.dbDelete = function(table, where) {
    var whereArgsObj = global.getWhereArgs(where);
    var query = sprintf("DELETE FROM `%s` WHERE %s ;", table, whereArgsObj.whereArr.join(' AND '));
    if( global.dbDebug ) {
        console.log("----------dbDelete-------------");
        console.log(query);
        console.log(table);
        console.log(whereArgsObj);
    }
    global.queryDb(query, whereArgsObj.args);
};

/**
 * 
 * @param String table 
 * @param null|String columns ' * '
 * @param null|Array where Null for 1=1 else Array of objects [{cmp: '=', col: 'id', val: 1}]
 * @param null|int offset null for no offset
 * @param null|int numOfEntries 
 * @param null|String orderCol 
 * @param null|String orderDirection 
 * @param null|String customOrder 
 * @returns {mocha_L6405.queryDbCountRows.results|global.queryDb.result|global.queryDbCountRows.results|Function.queryDbCountRows.results|mocha_L11821.queryDbCountRows.results}
 */
global.dbSelect = function(table, columns, where, offset, numOfEntries, orderCol, orderDirection, customOrder) {   
    if( ! columns ) {
        columns = " * ";
    }
    var whereArgsObj = global.getWhereArgs(where);
    
    var limitStr = '';
    if( typeof offset === 'number' && typeof numOfEntries === 'number') {
        limitStr = sprintf(" LIMIT %d, %d", offset, numOfEntries);
    } else if( typeof offset === 'number' ) {
        limitStr = sprintf(" LIMIT %d ", offset);
    } else if ( typeof numOfEntries === 'number') {
        limitStr = sprintf(" LIMIT 0, %d", numOfEntries);
    } else {
        //do nothing
    }
    
    var orderByStr = '';
    if( (typeof orderCol === 'string' && orderCol !== '') && (typeof orderDirection === 'string' && orderDirection !== '') ) {
        orderByStr = sprintf(" ORDER BY `%s` %s ", orderCol, orderDirection);
    } else if ( typeof orderCol === 'string' && orderCol !== '' ) {
        orderByStr = sprintf(" ORDER BY `%s` ASC ", orderCol);
    } else if ( typeof orderDirection === 'string' && orderDirection !== '' ) {
        orderByStr = sprintf(" ORDER BY `id` %s ", orderDirection);
    } else if ( customOrder ) {
        orderByStr = customOrder;
    } else {
        //default order
        orderByStr = ' ORDER BY `id` ASC ';
    } 
    
    var query = sprintf("SELECT SQL_CALC_FOUND_ROWS %s FROM `%s` WHERE %s %s %s ;", columns, table, whereArgsObj.whereArr.join(' AND '), orderByStr, limitStr);
    
    if( global.dbDebug ) {
        console.log('-------SELECT--------');
        console.log(query);
        console.log(whereArgsObj);
        console.log("table:", table);
        console.log("columns:", columns);
        console.log("where:", where);
        console.log("offset:", offset);
        console.log("numOfEntries:", numOfEntries);
        console.log("orderCol:", orderCol);
        console.log("orderDirection:", orderDirection);
        console.log('--------END SELECT-----------');
    }
    
    return global.queryDbCountRows(query, whereArgsObj.args);
};

/**
 * 
 * @param String table
 * @param Object data
 * @param Array of objects where
 * @returns {global.queryDb.result}
 */
global.dbUpdate = function(table, data, where) {
    var args = [];
    var setStr = [];
    Object.keys(data).forEach(function(key){
        setStr.push( sprintf(" `%s` = ? ", key) );
        if( typeof data[key] === 'string' ) {
            args.push( data[key].trim() );
        } else {
            args.push(data[key]);
        }
    });
    
    var whereArgsObj = global.getWhereArgs(where);
    
    //add to args
    for( var i = 0; i < whereArgsObj.args.length; i++ ){
        args.push(whereArgsObj.args[i]);
    }
    
    var query = sprintf("UPDATE `%s` SET %s WHERE %s ", table, setStr.join(', '), whereArgsObj.whereArr.join(' AND '));
    
    if( global.dbDebug ) {
        console.log('-------UPDATE--------');
        console.log(query);
        console.log(whereArgsObj.whereArr);
        console.log(args);
        console.log('--------END UPDATE-----------');
    }
    
    return global.queryDb(query, args);
};

/**
 * 
 * @param String table
 * @returns {mocha_L6405.queryDbCountRows.results|global.queryDb.result|global.queryDbCountRows.results|Function.queryDbCountRows.results|mocha_L11821.queryDbCountRows.results}
 */
global.dbGetTableColumns = function(table){
    var query = sprintf("SHOW COLUMNS FROM `%s`", table);
    if( global.dbDebug ) {
        console.log("-------dbGetTableColumns()-----");
        console.log("Table:", table);
    }
    return global.queryDbCountRows(query);
};

/**
 * 
 * @param String table
 * @param Object data
 * @param Array of objects where
 * @returns {global.queryDb.result}
 */
global.dbUpdateRow = function(table, data, where) {
    var whereArgsObj = global.getWhereArgs(where);
    var query = sprintf("SELECT count(*) as `total` FROM `%s` WHERE %s ", table, whereArgsObj.whereArr.join(' AND '));
    var result = global.queryDb(query, whereArgsObj.args);
    
    if( global.dbDebug ) {
        console.log("----------dbUpdateRow-----------");
        console.log("QUERY", query);
        console.log("WHERE RAW", where);
        console.log("WHERE ARGS OBJ", whereArgsObj);
        console.log("DATA", data);
        console.log("TOTAL", result.rows[0].total);
    }
    
    var id;
    if( result.rows[0].total === 0 ) {
        id = global.dbInsert(table, data);
    } else {
        global.dbUpdate(table, data, where);
    }
    return id;
};

/**
 * 
 * @param Array of objects where
 * @returns {getWhereArgs.interactionsAnonym$0}
 */
global.getWhereArgs = function(where) {
    var whereArr = [' 1=1 '];
    var args = [];
    if( util.isArray(where) ) {
        for(var i = 0; i < where.length; i++){
            var column = 'id';
            var comparator = '=';
            var value = where[i].val;
            
            if( typeof where[i].col !== 'undefined' ) {
                column = where[i].col;
            }
            
            if( value === null ) {
                if( ['IS', 'IS NOT'].indexOf(where[i].cmp) === -1 ) {
                    comparator = 'IS';
                }
            } else {
                if( typeof where[i].cmp !== 'undefined' ) {
                    comparator = where[i].cmp;
                }
            }
            
            //console.log("ROW", i, column, comparator, value, util.isArray(value));
            
            if( util.isArray(value) ) {
                if( ['IN', 'NOT IN'].indexOf( comparator.trim() ) === -1 ) {
                    comparator = 'IN';
                }
                
                var valArr = [];
                for( var i = 0; i < value.length; i++) {
                    //var val = value[i];
                    //if( typeof(val) === 'number' ) {
                    //    valArr.push(val);
                    //} else {
                    //    //string
                    //    valArr.push(sprintf("'%s'", global.db.escape(val)));
                    //}
                    valArr.push('?');
                    args.push(value[i]);
                }
                if( valArr.length > 0 ) {
                    whereArr.push( sprintf(' `%s` %s ( %s ) ', column, comparator, valArr.join(', ')) );
                } else {
                    //no array so return no rows
                    whereArr.push( " 0 ");
                }                
            } else {
                whereArr.push( sprintf(' `%s` %s ? ', column, comparator) );
                //args.push( global.db.escape(value) );
                args.push( value );
            }
        }
    } else if ( typeof where !== 'undefined' && where !== null ) {
        var column = 'id';
        var comparator;
        if( value === null ) {
            comparator = 'IS';
        } else {
            comparator = '=';
        }
        
        whereArr.push( sprintf(' `%s` %s ? ', column, comparator) );
        args.push( where );
    }
    
    if( global.dbDebug ) {
        console.log('-----------getWhereArgs--------');
        console.log('where', where);
        console.log('whereArr', whereArr);
        console.log('args', args);
        console.log('-----------getWhereArgs--------');
    }
    
    var data = {
        whereArr: whereArr, 
        args: args
    }; 
    return data;
};