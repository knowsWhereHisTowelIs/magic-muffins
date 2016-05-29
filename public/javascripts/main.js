$(document).ready(function () {
    setupTinyMceEditor();
    prepareConfirmClicks();
    prepareLoadingButtons();
});

var debugResponse; // global debugger

function prepareConfirmClicks() {
    $(".confirmClick").click(function(element){
        var msg = typeof $(this).data('msg') === "undefined" ? 'Are you sure?' : $(this).data('msg');
        
        if (confirm(msg)) {
            //allow deletion
        } else {
            element.preventDefault();
        }
    });
}

// don't worry bout since ajax n would need to manage on return
function prepareLoadingButtons() {
    jQuery(".ladda-button").click(function (e) {
        var loadingIcon = Ladda.create(this);
        loadingIcon.start();
//        jQuery(this).removeAttr('disabled');
//        jQuery(this).parents("form:first").submit();
    });
}

function getFormattedDate(date) {
    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return  month + '/' + day + '/' + year;
}

function setupTinyMceEditor() {
    if (typeof tinyMCE !== 'undefined') {
        //create tinymce listener
        tinyMCE.init({
            selector: "textarea",
            theme: "modern",
            plugins: [
                "advlist autolink lists link image charmap print preview hr anchor pagebreak",
                "searchreplace wordcount visualblocks visualchars code fullscreen",
                "insertdatetime media nonbreaking save table contextmenu directionality",
                "emoticons template paste textcolor colorpicker textpattern imagetools"
            ],
            setup: function (editor) {
                editor.on('keyup', function (e) {
                    // Revalidate the hobbies field
                    tinyMCE.triggerSave(true, true);
                });
            }
        });
    }
}