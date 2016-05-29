
/* global global */

var tools = require(global.ROOT_PATH + 'lib/tools.js');

/**
 * Pass request then setup vars in global so jade has easy access
 * @param {type} req
 * @returns void
 */
global.preparePageData = function(req, res, next) {
    global.BASE_URL = req.get('host').replace(':8000', '');
    
    var redirectToLogin = true;
    // if is logged in or at login page don't redirect
    if( ( typeof req.session === "object" && req.session.isLoggedIn === true ) || req.originalUrl.indexOf('/login') === 0 ) {
        redirectToLogin = false;
    }
    
    console.log("session: ", req.session);
    
    if( redirectToLogin === true ) {
        console.log("===========Redirecting b/c:");
        console.log("-----typeof req.session", typeof req.session);
        console.log("-----req.session.isLoggedIn", req.session.isLoggedIn); 
        console.log("-----req.originalUrl.indexOf('/login')", req.originalUrl.indexOf('/login'));
        
        res.redirect('/login/');
        res.end();
    }
    
    global.REQUEST = req;
    global.REQUEST.slashedUrl = global.addTrailingSlash( req.originalUrl );
    
    global.RESPONSE = res;
    global.NEXT = next;
};

global.getUserNameById = function(uid){ 
    var name = "N/A";
    var userResult = global.dbSelect(global.DB_TABLE_USERS, null, [{val: uid}]);
    if ( userResult.rowCount === 1 ) {
        var userData = tools.getNiceObject(userResult.rows[0], 'users');
        name = userData.first + ' ' + userData.last;
    }
    return name;
};