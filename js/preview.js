BBIT = {};
BBIT.WebFiddler = {
    displayContent: function(contentType){
        if (localStorage.getItem(contentType) != null){
            document.write(localStorage.getItem(contentType)); // Retrieve locally stored output
        }
    },
    loadCSS: function(){
        var extCSS = localStorage.getItem("extCSS") == null ? [] : JSON.parse(localStorage.getItem("extCSS"));
        for (var i = 0; i < extCSS.length; i++){
            var fileRef = document.createElement("link");
            fileRef.setAttribute("rel", "stylesheet");
            fileRef.setAttribute("type", "text/css");
            fileRef.setAttribute("href", extCSS[i]);
            document.getElementsByTagName("head")[0].appendChild(fileRef);
        }
    },
    loadJS: function(){
        var loaded = 0;
        var extJS = localStorage.getItem("extJS") == null ? [] : JSON.parse(localStorage.getItem("extJS"));
        loadJS();

        function loadJS(){
            if (loaded < extJS.length){
                var fileRef = document.createElement('script');
                fileRef.onload = function(){
                    loadJS();
                };
                fileRef.src = extJS[loaded];
                document.getElementsByTagName("body")[0].appendChild(fileRef);
            }
            loaded++;

            if (loaded-1 == extJS.length){
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.text = localStorage.getItem("js-raw");
                document.getElementsByTagName("body")[0].appendChild(script);
            }
        }
    },
    logMessage: function(message, type){
        var messageArray = localStorage.getItem("console") == null ? [] : JSON.parse(localStorage.getItem("console"));
        message = typeof message == "object" ? JSON.stringify(message) : message;
        var messageObj = {
            message: message,
            type: type
        };
        messageArray.push(messageObj);
        localStorage.setItem("console", JSON.stringify(messageArray));
    }
};

(function(){
    window.onerror = function(message, url, lineNumber) {
        lineNumber = lineNumber - 1;
        BBIT.WebFiddler.logMessage(lineNumber + ": " + message, "error");
    };

    var oldLog = console.log;
    console.log = function (message) {
        BBIT.WebFiddler.logMessage(message, "log");
        oldLog.apply(console, arguments);
    };
    var oldWarn = console.warn;
    console.warn = function (message) {
        BBIT.WebFiddler.logMessage(message, "warn");
        oldWarn.apply(console, arguments);
    };
    var oldError = console.error;
    console.error = function (message) {
        BBIT.WebFiddler.logMessage(message, "error");
        oldError.apply(console, arguments);
    };
})();

localStorage.removeItem("console");