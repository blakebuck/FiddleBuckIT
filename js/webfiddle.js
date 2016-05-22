var outputFile = null;
var cssEditor, htmlEditor, jsEditor;
var urlParams;
var gistID = null;
var gistDesc;

// Get URL Parameters.
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
        urlParams[decode(match[1])] = decode(match[2]);
})();

$(function(){
    // Initialize Editors
    initEditors();

    // Adjust views and editor sizes
    resizeViews();
    $(window).resize(resizeViews);

    // Import Gist if ID is given
    if ("gist" in urlParams){
        setGistID(urlParams["gist"]);
        importGist(gistID);
        updateGistStatus();
    }

    // Bind click handlers for top link/buttons
    $(".funcBtn[data-value='preview']").click(generatePreview);
    $("#outputLink").click(outputLinkClick);

    $(".view[data-value='settings']").on("focusout", function(){
        saveSettings();
    });

    if (localStorage.getItem("gitToken") != null){
        $(".viewBtn[data-value='github']").show();
    }

    var loading = setTimeout(function loading(){
        $(".view").hide();
        viewBtnClick("html");
    }, 1500);

    window.onblur = function onBlur() {
        prepareContent();
    };

    window.onfocus = function onFocus(){
        updateConsole();
    };
});

function addExtCSS(){
    $(".cssList").append("<li><input class=\"extCSS longInput\"></li>");
}

function addExtJS(){
    $(".jsList").append("<li><input class=\"extJS longInput\"></li>");
}

function appendContent(editor, content){
    if (content != null){
        var previousContent = editor.getValue();
        editor.setValue(previousContent + content);
    }
    editor.clearSelection();
}

function authGitHub(){
    var gitHubUsername = $("#gitHubUsername").val();
    var gitHubPassword = $("#gitHubPassword").val();
    var note = "WebFiddler on " + BBIT.time.date().dateTimeString + " via " + getBrowser();
    if (gitHubUsername != "" && gitHubPassword != ""){
        $.ajax({
            url: 'https://api.github.com/authorizations',
            type: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(gitHubUsername + ":" + gitHubPassword));
            },
            data: '{"scopes":["gist"], "note":"' + note + '"}'
        }).done(function(response) {
            localStorage.setItem("gitToken", response.token);
            $("#gitHubUsername").val("");
            $("#gitHubPassword").val("");
            $("#gitHubStatus").css("color", "green");
            $("#gitHubStatus").html("Token acquired! Connected to GitHub!");
        }).fail(function(){
            alert("Authentication or Connection Failed!");
        });
    }
    else {
        alert("Please enter Username and Password");
    }
}

function clearEditors(){
    htmlEditor.setValue("");
    cssEditor.setValue("");
    jsEditor.setValue("");
}

function escapeSpecialChars(str) {
    return str.replace(/\n/g, "\\n")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/&/g, "\\&")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
        .replace(/\f/g, "\\f");
};

/**
 * Generates Preview of Inputted Code
 * Saves inputted code into localStorage
 * Reloads iframe which reads from localStorage
 * and document.writes() to give preview
 */
function generatePreview(){
    prepareContent();
    var win = window.open("preview.html", 'newTab');
    win.focus();
}

function getBrowser(){
    if(navigator.userAgent.indexOf("Chrome") > -1) {
        return "Chrome";
    } else if (sUsrAg.indexOf("Safari") > -1) {
        return "Safari";
    } else if (sUsrAg.indexOf("Opera") > -1) {
        return "Opera";
    } else if (sUsrAg.indexOf("Firefox") > -1) {
        return "Firefox";
    } else if (sUsrAg.indexOf("MSIE") > -1) {
        return "Internet Explorer";
    }
}

function importGist(gistID){
    $.ajax({
        url: 'https://api.github.com/gists/' + gistID,
        type: 'GET'
    }).done(function(response) {
        sortGistFiles(response.files);
    }).fail(function(){
        alert("Unable to import Gist!");
    });

    function sortGistFiles(files){
        clearEditors();
        var notLoaded = 0;
        for (var file in files){
            switch(files[file].language) {
                case "JavaScript":
                    appendContent(jsEditor, files[file].content);
                    break;
                case "HTML":
                    appendContent(htmlEditor, files[file].content);
                    break;
                case "CSS":
                    appendContent(cssEditor, files[file].content);
                    break;
                default:
                    notLoaded++;
            }
        }
        if (notLoaded > 0){
            alert(notLoaded + " file(s) not of type HTML/JS/CSS and were not loaded");
        }
    }
}

/**
 * Initialize ACE Editors
 * For more options like modes, themes, etc.
 * visit http://ace.c9.io/
 */
function initEditors(){
    // HTML Editor
    htmlEditor = ace.edit("editor-html"); // Set container html element
    htmlEditor.setTheme("ace/theme/vibrant_ink"); // Set Highlighting Theme
    htmlEditor.getSession().setMode("ace/mode/html"); // Set Mode
    loadContent(htmlEditor, localStorage.getItem("html-raw"));

    // JS Editor
    jsEditor = ace.edit("editor-js");
    jsEditor.setTheme("ace/theme/vibrant_ink");
    jsEditor.getSession().setMode("ace/mode/javascript");
    loadContent(jsEditor, localStorage.getItem("js-raw"));

    // CSS Editor
    cssEditor = ace.edit("editor-css");
    cssEditor.setTheme("ace/theme/vibrant_ink");
    cssEditor.getSession().setMode("ace/mode/css");
    loadContent(cssEditor, localStorage.getItem("css-raw"));
}

function loadContent(editor, content){
    if (content != null){
        editor.setValue(content);
    }
    editor.clearSelection();
}

function loadSettings(){
    $(".cssList").empty();
    var extCSS = localStorage.getItem("extCSS") == null ? [] : JSON.parse(localStorage.getItem("extCSS"));
    for (var i = 0; i < extCSS.length; i++){
        $(".cssList").append("<li><input class=\"extCSS longInput\" value='" + extCSS[i] + "'></li>");
    }
    addExtCSS();

    $(".jsList").empty();
    var extJS = localStorage.getItem("extJS") == null ? [] : JSON.parse(localStorage.getItem("extJS"));
    for (var i = 0; i < extJS.length; i++){
        $(".jsList").append("<li><input class=\"extJS longInput\" value='" + extJS[i] + "'></li>");
    }
    addExtJS();

    if (localStorage.getItem("gitToken") != null){
        $("#gitHubStatus").css("color", "green");
        $("#gitHubStatus").html("Token acquired! Connected to GitHub!");
    }
}

/**
 * Create Object URL for Downloading Output
 * This takes the output of the 3 editors and
 * creates a object URL for download.
 * @param output
 * @returns objectURL
 */
function makeOutputFile(output){
    var data = new Blob([output], {type: 'text/html'});

    // Kill last, and generate new object URL
    window.URL.revokeObjectURL(outputFile);
    outputFile = window.URL.createObjectURL(data);

    return outputFile;
}
/**
 * Creates a the HTML for the output page.
 * Spaces are intentional in the strings for spacing in output.
 * @returns {string} page   Contains the the HTML for the output page.
 */
function makePage(){
    var page = "<!DOCTYPE html>\n<html>\n    <head>\n        ";
        page += localStorage.getItem("css");
        page += "\n    <\/head>\n    <body>\n        ";
        page += localStorage.getItem("html");
        page += "\n        <script src=\"http://code.jquery.com/jquery-1.11.2.min.js\"></script>\n        ";
        page += localStorage.getItem("js");
        page += "\n    <\/body>\n<\/html>";
    return page;
}

function newFiddle(){
    if (confirm("Are you sure you want to clear the editors and start a new fiddle? All unsaved work will be lost!")){
        gistID = null;
        updateGistStatus();
        $("#gistDesc").val("");
        clearEditors();
    }
}

function newGist(){
    gistID = null;
    saveGist();
}

/**
 * Handles the "Save Output" link
 */
function outputLinkClick(){
    prepareContent();
    var content = makePage();
    $(this).attr("href", makeOutputFile(content));
}

/**
 * Wraps Inputted Code and saves it to localStorage
 * @returns string CSS wrapped in <style> tag + HTML + JS wrapped in <script> tag
 */
function prepareContent(){
    localStorage.setItem("css-raw", cssEditor.getValue());
    localStorage.setItem("html-raw", htmlEditor.getValue());
    localStorage.setItem("js-raw", jsEditor.getValue());
    var css = "<style>\n" + cssEditor.getValue() + "\n</style>";
    var html = htmlEditor.getValue();
    var js = "<script>\n" + jsEditor.getValue() + "\n<\/script>";
    localStorage.setItem("css", css);
    localStorage.setItem("html", html);
    localStorage.setItem("js", js);
}

/**
 * Resize views
 */
function resizeViews(){
    var height = $(window).height();
    var width = $(window).width();
    var editor = $(".editor");
    editor.height(height);
    editor.width(width);
    $(".view").width(width*.95);
}

function saveGist(){
    var gistDesc = $("#gistDesc").val();
    var githubToken = localStorage.getItem("gitToken");
    var html = htmlEditor.getValue();
    var js = jsEditor.getValue();
    var css = cssEditor.getValue();
    var files = [];

    if (css != "" || js != "" || html != ""){
        if (html != ""){
            files.push('"fiddle.html": {"content": "' + escapeSpecialChars(html)  + '"}');
        }
        if (js != ""){
            files.push('"fiddle.js": {"content": "' + escapeSpecialChars(js)  + '"}');
        }
        if (css != ""){
            files.push('"fiddle.css": {"content": "' + escapeSpecialChars(css) + '"}');
        }
        files = files.join(",");
    }
    else {
        alert("No content to save!");
        return;
    }

    if (gistID != null){
        $.ajax({
            url: 'https://api.github.com/gists/' + gistID,
            type: 'PATCH',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "token " + githubToken);
            },
            data: '{"description": "' + gistDesc + '","public": true,"files": {' + files + '}}'
        }).done(function(response) {
            alert("Gist Successfully Updated!");
        }).fail(function(response){
            console.log(response);
            alert("Failed to Save Gist!");
        });
    }
    else {
        $.ajax({
            url: 'https://api.github.com/gists',
            type: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "token " + githubToken);
            },
            data: '{"description": "' + gistDesc + '","public": true,"files": {' + files + '}}'
        }).done(function(response) {
            setGistID(response["id"]);
            gistDesc = response["description"];
            alert("Save Successful!");
        }).fail(function(response){
            console.log(response);
            alert("Failed to Save Gist!");
        });
        console.log('{"description": "' + gistDesc + '","public": true,"files": {' + files + '}}');
    }
}

function saveSettings(){
    var extCSS = [];
    $(".extCSS").each(function(){
        var URL = $(this).val();
        if (URL != ""){
            extCSS.push(URL);
        }
    });
    localStorage.setItem("extCSS", JSON.stringify(extCSS));

    var extJS = [];
    $(".extJS").each(function(){
        var URL = $(this).val();
        if (URL != ""){
            extJS.push(URL);
        }
    });
    localStorage.setItem("extJS", JSON.stringify(extJS));
}

function setGistID(ID){
    gistID = ID;
    history.pushState({},"FiddleBuckIT", window.location.origin + window.location.pathname + "?gist=" + gistID);
    updateGistStatus();
}

function updateConsole(){
    var console = $(".view[data-value='console']");
    console.html("");
    var messageArray = localStorage.getItem("console") == null ? [] : JSON.parse(localStorage.getItem("console"));
    for (var i = 0; i < messageArray.length; i++){
        var messageObj = messageArray[i];
        var typeClass = messageObj.type == "error" ? "consoleError" : messageObj.type == "warn" ? "consoleWarn" : "consoleLog";
        var message = "<div><img src='images/" + typeClass + ".png'><span class='" + typeClass + "'> &nbsp" + messageObj.message + "</span></div>";
        console.append(message);
    }
}

function updateGistStatus(){
    if (gistID == null){
        $("#gistStatus").html("");
        $("#shareURL").html("<span style=\"color: red; font-weight: bold\">Cannot Share. Not saved as Gist.</span>");
    }
    else {
        $("#gistStatus").html("<span style=\"color: red\">This will update Gist ID: " + gistID + ".</span> <span style=\"color: blue; cursor: pointer\" onclick=\"newGist()\">Click here to create a new gist</span>.");
        $("#shareURL").html("http://fiddlebuckit.com/index.html?gist=" + gistID + "<br>Or, on GitHub: <a href=\"https://gist.github.com/" + gistID + "\">https://gist.github.com/" + gistID + "</a>");
    }
}

/**
 * Handles the Editor Buttons
 */
function viewBtnClick(view){
    // Hide all views
    $(".view:not(.view[data-value='loading'])").hide();

    $(".viewBtn[data-value='html'] img").attr("src", "images/html.png");
    $(".viewBtn[data-value='js'] img").attr("src", "images/js.png");
    $(".viewBtn[data-value='css'] img").attr("src", "images/css.png");

    // Show request view
    $(".view[data-value='" + view + "']").show();

    if (view == "html" || view == "js" || view == "css"){
        $(".viewBtn[data-value='" + view + "'] img").attr("src", "images/" + view + "-active.png");
        // Give focus to the editor
        window[view + "Editor"].focus();
    }

    if (view == "console") {
        updateConsole();
    }

    if (view == "settings"){
        loadSettings();
    }
}