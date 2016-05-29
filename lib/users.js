
/* global module, global */

var sprintf = require('sprintf').sprintf;
var md5 = require('md5');

var userPrefix = 'user-';

module.exports = {
    //VARS
    prefix: userPrefix,
    //funcs
    getUserErrors: function (req, type) {
        var msgs = [];

        if (req.body.submitted) {
            if (typeof req.body[userPrefix + 'email'] !== 'string' || req.body[userPrefix + 'email'].trim().length === 0) {
                msgs.push("Email must be filled out");
            } else if (type !== 'edit' && global.dbSelect(global.DB_TABLE_USERS, null, [{col: 'email', val: req.body[userPrefix + 'email']}]).rowCount !== 0) {
                msgs.push("Sorry that email is already taken");
            }
            
            if ( typeof req.body[userPrefix + 'first'] !== 'string' || req.body[userPrefix + 'first'].length === 0 ) {
                msgs.push("First name must be filled out");
            }
            
            if ( typeof req.body[userPrefix + 'last'] !== 'string' || req.body[userPrefix + 'last'].length === 0 ) {
                msgs.push("Last name must be filled out");
            }

            if (type === 'edit' && (req.body[userPrefix + 'password'] || req.body[userPrefix + 'passwordConfirm'])) {
                //allow password not to change
            } else if (req.body[userPrefix + 'password'] && !req.body[userPrefix + 'passwordConfirm']) {
                msgs.push("Please fill out password confirmation");
            } else if (!req.body[userPrefix + 'password'] && req.body[userPrefix + 'passwordConfirm']) {
                msgs.push("Please fill out password");
            } else if (req.body[userPrefix + 'password'] !== req.body[userPrefix + 'passwordConfirm']) {
                msgs.push("Passwords must match");
            } else if (req.body[userPrefix + 'password'].length < 4) {
                msgs.push("Passwords must be at least 4 characters");
            }
        }
        return msgs;
    },
    isValidLogin: function (email, password) {
        var whereArgs = [{col: 'email', val: email}, {col: 'password', val: md5(password)}];
        var results = global.dbSelect(global.DB_TABLE_USERS, ' `id` ', whereArgs);

        var isValid = false;
        var uid;
        if (results.rowCount === 1) {
            uid = results.rows[0].id;
            isValid = true;
        }

        return {
            isValid: isValid,
            uid: uid,
            results: results,
        };
    },
    encryptPassword: function(password){ 
        return md5(password);
    }
};