/* global __dirname, process, module, global */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var files = require('./lib/file');
var sprintf = require('sprintf').sprintf;
var vsprintf = require('sprintf').vsprintf;
var session = require('client-sessions');
var cookieParser = require('cookie-parser');

//include everything in /includes/
console.log("CWD:", process.cwd());
files.getAllFilesInDirectory("./includes").forEach(function (file) {
    console.log("Requiring: " + file);
    require(file);
});

function main() {
    global.dbDebug = false;

    //var app = module.exports = express.createServer();
    var app = express();

    app.use(session({
        cookieName: 'session',
        secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;',
        duration: 2 * 7 * 24 * 60 * 60 * 1000, //2wks in millisecs
        activeDuration: 2 * 7 * 24 * 60 * 60 * 1000, // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
        cookie: {
            //path: '/api', // cookie will only be sent to requests under '/api'
            //maxAge: 60000, // duration of the cookie in milliseconds, defaults to duration above
            //ephemeral: false, // when true, cookie expires when the browser closes
            httpOnly: true, // when true, cookie is not accessible from javascript
            //secure: false // when true, cookie will only be sent over SSL. use key 'secureProxy' instead if you handle SSL not in your node process
        }
    }));
    app.locals.sprintf = sprintf;

    // view engine setup
    app.set('port', process.env.PORT || 3000);

    // uncomment after placing your favicon in /public
    //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(logger('dev'));
    
    //app.use(bodyParser.json());
    //app.use(bodyParser.urlencoded({extended: false}));
    //use instead of previous 2... for file uploads
    require('express-busboy').extend(app, {
        upload: true,
        //path: './tmp/'
    });

    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    //define all views
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    var routesPath = "./routes";
    var routes = files.getAllFilesInDirectory(routesPath);
    console.log("--------PREPARING ROUTES----------");
    routes.forEach(function (route, index, array) {
        if (route.indexOf('.js') > -1) { //is nodejs file
            var routePath = files.getFileBaseName(route.replace(routesPath, ''));
            var routeObj = require(route);
            console.log("Route:", route, "RoutesPath:", routesPath, "RoutePath:", routePath);
            //console.log("RouteObj:", routeObj);

            if (routeObj.isIndexPage === true) { //if is root of domain set default page handler to routeObj
                app.use('/', routeObj);
                app.use('/index', routeObj);
                console.log("INDEX PAGE = " + route);
            }
            app.use(routePath, routeObj);
        }
    });
    console.log("------------END ROUTES-----------------");

    //all styles to be included in headers
    var stylesheetsPath = "./public/stylesheets/";
    files.getAllFilesInDirectory(stylesheetsPath).forEach(function (file, index, array) {
        global.LAYOUT.INCLUDES.STYLESHEETS.push("/stylesheets" + file.replace(stylesheetsPath, ''));
    });

    //all scripts to be included in headers
    var scriptsPath = "./public/javascripts/";
    files.getAllFilesInDirectory(scriptsPath).forEach(function (file, index, array) {
        global.LAYOUT.INCLUDES.SCRIPTS.push("/javascripts" + file.replace(scriptsPath, ''));
    });

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        global.preparePageData(req, res, next);
        if (app.get('env') === 'development') {
            //production/dev template is same
        }
        var template = (req.xhr === true) ? 'error_ajax' : 'error';
        res.render(template, {
            message: err.message,
            error: err,
            req: req,
            res: res
                    //next: next
        });
    });

    global.app = app;
    module.exports = app;
}
main();

