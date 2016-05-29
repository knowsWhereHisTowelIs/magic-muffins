/* global module, global */

/**
 * Removes underscores and capitalizes first letters of each word
 * @param {type} key
 * @returns {unresolved}
 */
global.getKeyNiceName = function(key) {
    var keyNoUnderscores = key.replace(/_/g, ' ');
    var pieces = keyNoUnderscores.split(" ");
    //console.log(key, pieces);
    for ( var i = 0; i < pieces.length; i++ )
    {
        var j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    }
    return pieces.join(" ");
    //return key.replace('_', ' ').replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

global.addTrailingSlash = function(url) {
    if (url.substr(-1) !== '/') url += '/';
    return url;
};

global.var_dump = function (obj) {
    var util = require("util");
    return util.inspect(obj);
};

module.exports = {
    var_dump: function (obj) {
        return global.var_dump(obj);
    }
};
