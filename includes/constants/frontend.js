
//FILES AND URLS
global.ROOT_PATH = process.cwd() + '/';
global.UPLOAD_PATH = global.ROOT_PATH + 'public/uploads/';
//var os = require("os");
//global.BASE_URL = os.hostname();
global.ROWS_PER_PAGE = 15;
global.DISPLAYED_PAGINATION_RANGE = 2;

global.PROTOCAL = "http";
global.DOMAIN = "crm.contractnorthshore.com";
global.ROOT_URL = global.PROTOCAL + "://" + global.DOMAIN + "/";

//FORMS
global.MIN_TEXT_AREA_LENGTH = 100;
global.FORM_PREFIX = 'pwm-field-';

//LAYOUTS FOR JADE
global.LAYOUT = {
    INCLUDES: {
        SCRIPTS: [],
        STYLESHEETS: []
    }
};
